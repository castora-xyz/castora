// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {IAccessControl} from '@openzeppelin/contracts/access/IAccessControl.sol';
import {ERC1967Proxy} from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import {PausableUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import {Test} from 'forge-std/Test.sol';
import {Castora} from '../src/Castora.sol';
import {CastoraActivities} from '../src/CastoraActivities.sol';
import {CastoraErrors} from '../src/CastoraErrors.sol';
import {CastoraEvents} from '../src/CastoraEvents.sol';
import {CastoraPoolsManager} from '../src/CastoraPoolsManager.sol';
import {CastoraPoolsRules} from '../src/CastoraPoolsRules.sol';
import {CastoraStructs} from '../src/CastoraStructs.sol';
import {cUSD} from '../src/cUSD.sol';

contract RejectETH {} // by default, empty contract will reject ETH

contract CastoraCompletePoolTest is CastoraErrors, CastoraEvents, CastoraStructs, Test {
  CastoraActivities activities;
  Castora castora;
  CastoraPoolsManager poolsManager;
  CastoraPoolsRules poolsRules;
  cUSD cusd;
  address feeCollector;
  address admin;
  address predicter1;
  address predicter2;
  address predicter3;
  uint256 poolIdSinglePrediction;
  uint256 poolIdMultiplePredictions;
  PoolSeeds validSeeds;

  // Allow test contract to receive ETH
  receive() external payable {}

  function getPoolSeeds() internal view returns (PoolSeeds memory) {
    return PoolSeeds({
      predictionToken: address(cusd),
      stakeToken: address(cusd),
      stakeAmount: 1000000,
      snapshotTime: 1200,
      windowCloseTime: 900,
      feesPercent: 500,
      multiplier: 200,
      isUnlisted: false
    });
  }

  function setUp() public {
    feeCollector = makeAddr('feeCollector');
    admin = makeAddr('admin');
    predicter1 = makeAddr('predicter1');
    predicter2 = makeAddr('predicter2');
    predicter3 = makeAddr('predicter3');

    // Deploy contracts
    cusd = new cUSD();
    activities = CastoraActivities(payable(address(new ERC1967Proxy(address(new CastoraActivities()), ''))));
    activities.initialize();
    poolsManager = CastoraPoolsManager(payable(address(new ERC1967Proxy(address(new CastoraPoolsManager()), ''))));
    poolsManager.initialize(address(activities), feeCollector, 5000);
    poolsRules = CastoraPoolsRules(address(new ERC1967Proxy(address(new CastoraPoolsRules()), '')));
    poolsRules.initialize();
    castora = Castora(payable(address(new ERC1967Proxy(address(new Castora()), ''))));
    castora.initialize(address(activities), address(poolsManager), address(poolsRules));
    poolsManager.setCastora(address(castora));
    activities.setAuthorizedLogger((address(poolsManager)), true);
    activities.setAuthorizedLogger((address(castora)), true);

    // Grant admin role
    castora.grantAdminRole(admin);

    // Configure pools rules
    poolsRules.updateAllowedPredictionToken(address(castora), true);
    poolsRules.updateAllowedPredictionToken(address(cusd), true);
    poolsRules.updateAllowedStakeToken(address(cusd), true);
    poolsRules.updateAllowedStakeAmount(address(cusd), 1000000, true);
    poolsRules.updateAllowedPoolMultiplier(200, true);

    // Create pools for testing
    validSeeds = getPoolSeeds();

    // Pool with single prediction
    vm.prank(admin);
    poolIdSinglePrediction = castora.createPool(validSeeds);

    // Pool with multiple predictions
    vm.prank(admin);
    PoolSeeds memory nextSeeds = validSeeds;
    nextSeeds.predictionToken = address(castora); // changing a property to allow valid creation
    poolIdMultiplePredictions = castora.createPool(nextSeeds);

    // Give predicters tokens and make predictions
    cusd.transfer(predicter1, 10000000);
    cusd.transfer(predicter2, 10000000);
    cusd.transfer(predicter3, 10000000);

    // Single prediction in first pool
    vm.prank(predicter1);
    cusd.approve(address(castora), 1000000);
    vm.prank(predicter1);
    castora.predict(poolIdSinglePrediction, 1500000);

    // Multiple predictions in second pool
    vm.prank(predicter1);
    cusd.approve(address(castora), 2000000);
    vm.prank(predicter1);
    castora.bulkPredict(poolIdMultiplePredictions, 1500000, 2);

    vm.prank(predicter2);
    cusd.approve(address(castora), 2000000);
    vm.prank(predicter2);
    castora.bulkPredict(poolIdMultiplePredictions, 1600000, 2);

    vm.prank(predicter3);
    cusd.approve(address(castora), 1000000);
    vm.prank(predicter3);
    castora.predict(poolIdMultiplePredictions, 1700000);

    vm.warp(1300); // Past snapshot time
  }

  function testRevertPausedInitiatePoolCompletion() public {
    castora.pause();
    assertTrue(castora.paused());

    vm.prank(admin);
    vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);
  }

  function testRevertNotAdminInitiatePoolCompletion() public {
    vm.expectRevert(
      abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, predicter1, castora.ADMIN_ROLE())
    );
    vm.prank(predicter1);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);
  }

  function testRevertInvalidPoolIdInitiatePoolCompletion() public {
    vm.startPrank(admin);
    vm.expectRevert(InvalidPoolId.selector);
    castora.initiatePoolCompletion(0, 1550000, 1);

    vm.expectRevert(InvalidPoolId.selector);
    castora.initiatePoolCompletion(999, 1550000, 1);
  }

  function testRevertPoolAlreadyCompletedInitiatePoolCompletion() public {
    // First initiate and complete the pool
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;

    vm.startPrank(admin);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);
    castora.setWinnersInBatch(poolIdSinglePrediction, winners);
    castora.finalizePoolCompletion(poolIdSinglePrediction);

    // Try to initiate again
    vm.expectRevert(PoolAlreadyCompleted.selector);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);
  }

  function testRevertPoolCompletionAlreadyInitiatedInitiatePoolCompletion() public {
    // First initiation
    vm.startPrank(admin);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);

    // Try to initiate again
    vm.expectRevert(PoolCompletionAlreadyInitiated.selector);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);
  }

  function testRevertNotYetSnapshotTimeInitiatePoolCompletion() public {
    vm.startPrank(admin);
    PoolSeeds memory futureSeeds = validSeeds;
    futureSeeds.snapshotTime = 2100;
    futureSeeds.windowCloseTime = 1800;
    uint256 futurePoolId = castora.createPool(futureSeeds);
    vm.warp(1300); // Before snapshot time

    vm.expectRevert(NotYetSnapshotTime.selector);
    castora.initiatePoolCompletion(futurePoolId, 1550000, 1);
  }

  function testRevertNoPredictionsInPoolInitiatePoolCompletion() public {
    vm.startPrank(admin);
    PoolSeeds memory emptyPoolSeeds = validSeeds;
    emptyPoolSeeds.snapshotTime = 2100; // changing a property to allow valid creation
    uint256 emptyPoolId = castora.createPool(emptyPoolSeeds);
    vm.warp(2200); // Past snapshot time

    vm.expectRevert(NoPredictionsInPool.selector);
    castora.initiatePoolCompletion(emptyPoolId, 1550000, 1);
  }

  function testRevertInvalidPoolCompletionBatchSizeInitiatePoolCompletion() public {
    vm.startPrank(admin);
    vm.expectRevert(InvalidPoolCompletionBatchSize.selector);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 0); // Batch size must be > 0

    vm.expectRevert(InvalidPoolCompletionBatchSize.selector);
    // will fail because noOfWinners is 1 and batch size must be less than or equal to noOfWinners
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 2);
  }

  function testRevertInvalidPoolMultiplierInitiatePoolCompletion() public {
    vm.prank(admin);
    PoolSeeds memory multiplierSeeds = validSeeds;
    multiplierSeeds.multiplier = 0;
    vm.warp(0); // reset test environment time
    // "blind" the poolsRules contract to simulate worst case scenario of not preventing zero multiplier
    vm.mockCall(
      address(poolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, multiplierSeeds),
      abi.encode()
    );
    uint256 multiplierPoolId = castora.createPool(multiplierSeeds);

    vm.prank(predicter1);
    cusd.approve(address(castora), 1000000);
    vm.prank(predicter1);
    castora.predict(multiplierPoolId, 1000000);
    vm.warp(1300); // Past snapshot time

    vm.prank(admin);
    vm.expectRevert(InvalidPoolMultiplier.selector);
    castora.initiatePoolCompletion(multiplierPoolId, 1550000, 1);
  }

  function testInitiatePoolCompletionSuccessSingleWinner() public {
    uint256 snapshotPrice = 1550000;
    uint256 batchSize = 1;

    // Get pool before initiation
    Pool memory poolBefore = castora.getPool(poolIdSinglePrediction);

    // Calculate expected values
    uint256 expectedWinners = 1; // Single prediction = 1 winner
    uint256 totalStaked = poolBefore.seeds.stakeAmount * poolBefore.noOfPredictions;
    uint256 fees = poolBefore.seeds.feesPercent * totalStaked / 10000;
    uint256 expectedWinAmount = (totalStaked - fees) / expectedWinners;

    // Expect event
    vm.prank(admin);
    vm.expectEmit(true, false, false, true);
    emit PoolCompletionInitiated(poolIdSinglePrediction, expectedWinners, expectedWinAmount);
    castora.initiatePoolCompletion(poolIdSinglePrediction, snapshotPrice, batchSize);

    // Verify pool state
    Pool memory poolAfter = castora.getPool(poolIdSinglePrediction);
    assertEq(poolAfter.noOfWinners, expectedWinners);
    assertEq(poolAfter.winAmount, expectedWinAmount);
    assertEq(poolAfter.completionTime, 0); // Not yet finalized

    // Verify initiation state
    assertTrue(castora.hasPoolCompletionBeenInitiated(poolIdSinglePrediction));
    assertEq(castora.poolCompletionBatchSize(poolIdSinglePrediction), batchSize);
    assertEq(castora.poolCompletionBatchesProcessed(poolIdSinglePrediction), 0);
  }

  function testInitiatePoolCompletionSuccessMultipleWinners() public {
    uint256 snapshotPrice = 1550000;
    uint256 batchSize = 2;

    // Get pool before initiation
    Pool memory poolBefore = castora.getPool(poolIdMultiplePredictions);
    assertEq(poolBefore.noOfPredictions, 5);

    // Calculate expected values
    // With 5 predictions and 2x multiplier (200), winners = (5 * 100) / 200 = 2 (rounded down)
    uint256 expectedWinners = (poolBefore.noOfPredictions * 100) / poolBefore.seeds.multiplier;

    uint256 totalStaked = poolBefore.seeds.stakeAmount * poolBefore.noOfPredictions;
    uint256 fees = poolBefore.seeds.feesPercent * totalStaked / 10000;
    uint256 expectedWinAmount = (totalStaked - fees) / expectedWinners;

    // Expect event
    vm.prank(admin);
    vm.expectEmit(true, false, false, true);
    emit PoolCompletionInitiated(poolIdMultiplePredictions, expectedWinners, expectedWinAmount);
    castora.initiatePoolCompletion(poolIdMultiplePredictions, snapshotPrice, batchSize);

    // Verify pool state
    Pool memory poolAfter = castora.getPool(poolIdMultiplePredictions);
    assertEq(poolAfter.noOfWinners, expectedWinners);
    assertEq(poolAfter.winAmount, expectedWinAmount);
    assertEq(poolAfter.completionTime, 0); // Not yet finalized

    // Verify initiation state
    assertTrue(castora.hasPoolCompletionBeenInitiated(poolIdMultiplePredictions));
    assertEq(castora.poolCompletionBatchSize(poolIdMultiplePredictions), batchSize);
    assertEq(castora.poolCompletionBatchesProcessed(poolIdMultiplePredictions), 0);
  }

  function testInitiatePoolCompletionSuccessHighMultiplierAtLeastOneWinner() public {
    // Allow the high multiplier in rules as top-level owner
    poolsRules.updateAllowedPoolMultiplier(500, true);

    // Create a pool with high multiplier that would result in 0 winners
    PoolSeeds memory highMultiplierSeeds = validSeeds;
    highMultiplierSeeds.multiplier = 500; // 5x multiplier - high enough to make winners = 0
    highMultiplierSeeds.snapshotTime = 2100; // changing a property to allow valid creation
    highMultiplierSeeds.windowCloseTime = 1800;
    // intentionally not pranking admin to confirm that owner can createPools at least here
    uint256 highMultiplierPoolId = castora.createPool(highMultiplierSeeds);

    // Add predictions to this pool
    vm.prank(predicter1);
    cusd.approve(address(castora), 1000000);
    vm.prank(predicter1);
    castora.predict(highMultiplierPoolId, 2000000);

    vm.prank(predicter2);
    cusd.approve(address(castora), 1000000);
    vm.prank(predicter2);
    castora.predict(highMultiplierPoolId, 2100000);

    vm.warp(2200); // Past snapshot time

    // Get pool before initiation
    Pool memory poolBefore = castora.getPool(highMultiplierPoolId);
    assertEq(poolBefore.noOfPredictions, 2);
    assertEq(poolBefore.seeds.multiplier, 500);

    // Calculate expected values
    // With 2 predictions and 5x multiplier (500), winners = (2 * 100) / 500 = 0.4 = 0 (rounded down)
    // But minimum is 1 winner
    uint256 calculatedWinners = (poolBefore.noOfPredictions * 100) / poolBefore.seeds.multiplier;
    assertEq(calculatedWinners, 0); // Verify calculation would be 0
    uint256 expectedWinners = 1; // But we expect at least 1

    uint256 totalStaked = poolBefore.seeds.stakeAmount * poolBefore.noOfPredictions;
    uint256 fees = poolBefore.seeds.feesPercent * totalStaked / 10000;
    uint256 expectedWinAmount = (totalStaked - fees) / expectedWinners;

    uint256 snapshotPrice = 2050000;
    uint256 batchSize = 1;

    // Expect event with at least 1 winner
    vm.prank(admin);
    vm.expectEmit(true, false, false, true);
    emit PoolCompletionInitiated(highMultiplierPoolId, expectedWinners, expectedWinAmount);
    castora.initiatePoolCompletion(highMultiplierPoolId, snapshotPrice, batchSize);

    // Verify pool state - should have at least 1 winner
    Pool memory poolAfter = castora.getPool(highMultiplierPoolId);
    assertEq(poolAfter.noOfWinners, expectedWinners);
    assertEq(poolAfter.winAmount, expectedWinAmount);
    assertEq(poolAfter.snapshotPrice, snapshotPrice);
    assertEq(poolAfter.completionTime, 0); // Not yet finalized

    // Verify initiation state
    assertTrue(castora.hasPoolCompletionBeenInitiated(highMultiplierPoolId));
    assertEq(castora.poolCompletionBatchSize(highMultiplierPoolId), batchSize);
    assertEq(castora.poolCompletionBatchesProcessed(highMultiplierPoolId), 0);

    // Verify that winner gets the full prize (minus fees) since there's only 1 winner
    uint256 expectedPrizePerWinner = (totalStaked - fees);
    assertEq(poolAfter.winAmount, expectedPrizePerWinner);
  }

  function testRevertPausedSetWinnersInBatch() public {
    // First initiate pool completion
    vm.prank(admin);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);

    // Pause the contract
    castora.pause();
    assertTrue(castora.paused());

    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;

    vm.prank(admin);
    vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
    castora.setWinnersInBatch(poolIdSinglePrediction, winners);
  }

  function testRevertNotAdminSetWinnersInBatch() public {
    // First initiate pool completion
    vm.prank(admin);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);

    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;

    vm.expectRevert(
      abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, predicter1, castora.ADMIN_ROLE())
    );
    vm.prank(predicter1);
    castora.setWinnersInBatch(poolIdSinglePrediction, winners);
  }

  function testRevertInvalidPoolIdSetWinnersInBatch() public {
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;

    vm.startPrank(admin);
    vm.expectRevert(InvalidPoolId.selector);
    castora.setWinnersInBatch(0, winners);

    vm.expectRevert(InvalidPoolId.selector);
    castora.setWinnersInBatch(999, winners);
  }

  function testRevertPoolCompletionNotInitiatedSetWinnersInBatch() public {
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;

    vm.prank(admin);
    vm.expectRevert(PoolCompletionNotInitiated.selector);
    castora.setWinnersInBatch(poolIdSinglePrediction, winners);
  }

  function testRevertPoolAlreadyCompletedSetWinnersInBatch() public {
    // First initiate and complete the pool
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;

    vm.startPrank(admin);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);
    castora.setWinnersInBatch(poolIdSinglePrediction, winners);
    castora.finalizePoolCompletion(poolIdSinglePrediction);

    // Try to set winners again
    vm.expectRevert(PoolAlreadyCompleted.selector);
    castora.setWinnersInBatch(poolIdSinglePrediction, winners);
  }

  function testRevertInvalidPoolCompletionBatchSizeEmptyArraySetWinnersInBatch() public {
    // First initiate pool completion
    vm.prank(admin);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);

    uint256[] memory emptyWinners = new uint256[](0);

    vm.prank(admin);
    vm.expectRevert(InvalidPoolCompletionBatchSize.selector);
    castora.setWinnersInBatch(poolIdSinglePrediction, emptyWinners);
  }

  function testRevertPoolCompletionBatchesAllProcessedSetWinnersInBatch() public {
    // First initiate and process all batches
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;

    vm.startPrank(admin);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);
    castora.setWinnersInBatch(poolIdSinglePrediction, winners);

    // Try to process another batch when all are done
    vm.expectRevert(PoolCompletionBatchesAllProcessed.selector);
    castora.setWinnersInBatch(poolIdSinglePrediction, winners);
  }

  function testRevertInvalidPoolCompletionBatchSizeWrongSizeSetWinnersInBatch() public {
    // Create a pool with multiple predictions for testing batch size validation
    vm.prank(admin);
    castora.initiatePoolCompletion(poolIdMultiplePredictions, 1550000, 1); // Batch size of 1

    // Try to set winners with wrong batch size (should be 1 but sending 2)
    uint256[] memory wrongSizeWinners = new uint256[](2);
    wrongSizeWinners[0] = 1;
    wrongSizeWinners[1] = 2;

    vm.prank(admin);
    vm.expectRevert(InvalidPoolCompletionBatchSize.selector);
    castora.setWinnersInBatch(poolIdMultiplePredictions, wrongSizeWinners);
  }

  function testRevertInvalidPoolCompletionBatchSizeLastBatchWrongSizeSetWinnersInBatch() public {
    vm.warp(0); // reset test environment time to add more predictions

    // add 5 more predictions to the pool
    vm.startPrank(predicter1);
    for (uint256 i = 0; i < 5; i++) {
      cusd.approve(address(castora), 1000000);
      castora.predict(poolIdMultiplePredictions, 1500000);
    }
    vm.stopPrank();

    vm.warp(1300); // bring back time to snapshot

    // With 10 predictions and x2 multiplier, we have 5 winners. If we complete in batches of 3,
    // first batch of winners should set with 3, and next must be 2 (as that's the number of winners left)

    // first initiate completion
    vm.startPrank(admin);
    castora.initiatePoolCompletion(poolIdMultiplePredictions, 1550000, 3);

    // set winners with first batch with correct size
    uint256[] memory winners = new uint256[](3);
    winners[0] = 1;
    winners[1] = 2;
    winners[2] = 3;
    castora.setWinnersInBatch(poolIdMultiplePredictions, winners);

    // Try second batch with incorrect array size, should fail as we expect exact leftover to be set
    winners[0] = 4;
    winners[1] = 5;

    vm.expectRevert(InvalidPoolCompletionBatchSize.selector);
    castora.setWinnersInBatch(poolIdMultiplePredictions, winners);
  }

  function testRevertInvalidPredictionIdSetWinnersInBatch() public {
    vm.startPrank(admin);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);

    // Test with predictionId = 0
    uint256[] memory invalidWinners = new uint256[](1);
    invalidWinners[0] = 0;

    vm.expectRevert(InvalidPredictionId.selector);
    castora.setWinnersInBatch(poolIdSinglePrediction, invalidWinners);

    // Test with predictionId > pool.noOfPredictions
    invalidWinners[0] = 999;
    vm.expectRevert(InvalidPredictionId.selector);
    castora.setWinnersInBatch(poolIdSinglePrediction, invalidWinners);
  }

  function testRevertPredictionAlreadyMarkedAsWinnerSetWinnersInBatch() public {
    vm.warp(0); // reset test environment time to add more predictions

    // add 2 more predictions to the pool, so that we will have 2 winners out of 5 for x2 multiplier
    vm.startPrank(predicter1);
    cusd.approve(address(castora), 1000000);
    castora.predict(poolIdMultiplePredictions, 1500000);
    cusd.approve(address(castora), 1000000);
    castora.predict(poolIdMultiplePredictions, 1500000);
    vm.stopPrank();

    vm.warp(1300); // bring back time to snapshot

    vm.startPrank(admin);
    castora.initiatePoolCompletion(poolIdMultiplePredictions, 1550000, 1);
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;
    // first time should succeed
    castora.setWinnersInBatch(poolIdMultiplePredictions, winners);

    // second call with same winner should fail
    vm.expectRevert(abi.encodeWithSelector(PredictionAlreadyMarkedAsWinner.selector, 1));
    castora.setWinnersInBatch(poolIdMultiplePredictions, winners);
  }

  function testSetWinnersInBatchSuccessSingleWinner() public {
    vm.prank(admin);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;

    // Get initial stats
    AllPredictionStats memory statsBefore = castora.getAllStats();
    UserPredictionStats memory userStatsBefore = castora.getUserStats(predicter1);
    Pool memory poolBefore = castora.getPool(poolIdSinglePrediction);

    // Expect event
    vm.prank(admin);
    vm.expectEmit(true, false, false, true);
    emit SetWinnersInBatch(poolIdSinglePrediction, 1, 1, 1);
    castora.setWinnersInBatch(poolIdSinglePrediction, winners);

    // Verify prediction is marked as winner
    Prediction memory prediction = castora.getPrediction(poolIdSinglePrediction, 1);
    assertTrue(prediction.isAWinner);

    // Verify global stats updated
    AllPredictionStats memory statsAfter = castora.getAllStats();
    assertEq(statsAfter.noOfWinnings, statsBefore.noOfWinnings + 1);
    assertEq(statsAfter.noOfClaimableWinnings, statsBefore.noOfClaimableWinnings + 1);

    // Verify user stats updated
    UserPredictionStats memory userStatsAfter = castora.getUserStats(predicter1);
    assertEq(userStatsAfter.noOfWinnings, userStatsBefore.noOfWinnings + 1);
    assertEq(userStatsAfter.noOfClaimableWinnings, userStatsBefore.noOfClaimableWinnings + 1);

    // Verify batch processing state
    assertEq(castora.poolCompletionBatchesProcessed(poolIdSinglePrediction), 1);

    // Verifiy user winner activity
    assertEq(castora.getWinnerActivityHashesForAddressPaginated(predicter1, 0, 10).length, 1);

    // Verify user claimable activities
    bytes32[] memory hashes = castora.getClaimableActivityHashesForAddressPaginated(predicter1, 0, 10);
    UserPredictionActivity[] memory userClaimableActivities = castora.getUserPredictionActivities(hashes);
    assertEq(userClaimableActivities.length, userStatsAfter.noOfClaimableWinnings);
    bool foundActivity = false;
    for (uint256 i = 0; i < userClaimableActivities.length; i++) {
      if (
        userClaimableActivities[i].poolId == poolIdSinglePrediction
          && userClaimableActivities[i].predictionId == prediction.predictionId
      ) {
        foundActivity = true;
        break;
      }
    }
    assertTrue(foundActivity);

    // User stats checker in pool
    UserInPoolPredictionStats memory userInPoolStats =
      castora.getUserInPoolPredictionStats(poolIdSinglePrediction, predicter1);
    assertEq(userInPoolStats.noOfWinnings, 1);
    assertEq(userInPoolStats.noOfClaimableWinnings, 1);

    // Verify user winner prediction IDs arrays in pool
    uint256[] memory userWinnerIds =
      castora.getWinnerPredictionIdsInPoolForUserPaginated(poolIdSinglePrediction, predicter1, 0, 10);
    assertEq(userWinnerIds.length, 1);
    assertEq(userWinnerIds[0], prediction.predictionId);

    // Verify user claimable prediction IDs arrays in pool
    uint256[] memory userClaimableIds =
      castora.getClaimableWinnerPredictionIdsInPoolForUserPaginated(poolIdSinglePrediction, predicter1, 0, 10);
    assertEq(userClaimableIds.length, 1);
    assertEq(userClaimableIds[0], prediction.predictionId);

    // Verify stake token details updated
    StakeTokenDetails memory stakeTokenDetails = castora.getStakeTokenDetails(address(cusd));
    assertEq(stakeTokenDetails.totalWon, poolBefore.winAmount);
    assertEq(stakeTokenDetails.totalClaimable, poolBefore.winAmount);
    assertEq(stakeTokenDetails.noOfWinnings, 1);
    assertEq(stakeTokenDetails.noOfClaimableWinnings, 1);

    // Verify user stake token details
    StakeTokenDetails memory userStakeTokenDetails =
      castora.getUserStakeTokenDetails(predicter1, poolBefore.seeds.stakeToken);
    assertEq(userStakeTokenDetails.noOfWinnings, 1);
    assertEq(userStakeTokenDetails.noOfClaimableWinnings, 1);
    assertEq(userStakeTokenDetails.totalWon, poolBefore.winAmount);
    assertEq(userStakeTokenDetails.totalClaimable, poolBefore.winAmount);
  }

  function _winnerAssertsAfterMultipleWinners(Prediction memory prediction1, Prediction memory prediction3)
    internal
    view
  {
    // User stats checker in pool for both users
    UserInPoolPredictionStats memory user1InPoolStats =
      castora.getUserInPoolPredictionStats(poolIdMultiplePredictions, predicter1);
    assertEq(user1InPoolStats.noOfWinnings, 1);
    assertEq(user1InPoolStats.noOfClaimableWinnings, 1);

    UserInPoolPredictionStats memory user2InPoolStats =
      castora.getUserInPoolPredictionStats(poolIdMultiplePredictions, predicter2);
    assertEq(user2InPoolStats.noOfWinnings, 1);
    assertEq(user2InPoolStats.noOfClaimableWinnings, 1);

    // Verify user winner prediction IDs arrays in pool for both users
    uint256[] memory user1WinnerIds =
      castora.getWinnerPredictionIdsInPoolForUserPaginated(poolIdMultiplePredictions, predicter1, 0, 10);
    assertEq(user1WinnerIds.length, 1);
    assertEq(user1WinnerIds[0], prediction1.predictionId);

    uint256[] memory user2WinnerIds =
      castora.getWinnerPredictionIdsInPoolForUserPaginated(poolIdMultiplePredictions, predicter2, 0, 10);
    assertEq(user2WinnerIds.length, 1);
    assertEq(user2WinnerIds[0], prediction3.predictionId);

    // Verify user claimable prediction IDs arrays in pool for both users
    uint256[] memory user1ClaimableIds =
      castora.getClaimableWinnerPredictionIdsInPoolForUserPaginated(poolIdMultiplePredictions, predicter1, 0, 10);
    assertEq(user1ClaimableIds.length, 1);
    assertEq(user1ClaimableIds[0], prediction1.predictionId);

    uint256[] memory user2ClaimableIds =
      castora.getClaimableWinnerPredictionIdsInPoolForUserPaginated(poolIdMultiplePredictions, predicter2, 0, 10);
    assertEq(user2ClaimableIds.length, 1);
    assertEq(user2ClaimableIds[0], prediction3.predictionId);
  }

  function _stakeTokenAssertsAfterMultipleWinners() internal view {
    Pool memory pool = castora.getPool(poolIdMultiplePredictions);
    // Verify stake token details globally
    StakeTokenDetails memory stakeTokenDetails = castora.getStakeTokenDetails(address(cusd));
    assertEq(stakeTokenDetails.totalWon, pool.winAmount * 2);
    assertEq(stakeTokenDetails.totalClaimable, pool.winAmount * 2);
    assertEq(stakeTokenDetails.noOfWinnings, 2);
    assertEq(stakeTokenDetails.noOfClaimableWinnings, 2);

    // Verify user stake token details for both users
    StakeTokenDetails memory user1StakeTokenDetails =
      castora.getUserStakeTokenDetails(predicter1, pool.seeds.stakeToken);
    assertEq(user1StakeTokenDetails.noOfWinnings, 1);
    assertEq(user1StakeTokenDetails.noOfClaimableWinnings, 1);
    assertEq(user1StakeTokenDetails.totalWon, pool.winAmount);
    assertEq(user1StakeTokenDetails.totalClaimable, pool.winAmount);

    StakeTokenDetails memory user2StakeTokenDetails =
      castora.getUserStakeTokenDetails(predicter2, pool.seeds.stakeToken);
    assertEq(user2StakeTokenDetails.noOfWinnings, 1);
    assertEq(user2StakeTokenDetails.noOfClaimableWinnings, 1);
    assertEq(user2StakeTokenDetails.totalWon, pool.winAmount);
    assertEq(user2StakeTokenDetails.totalClaimable, pool.winAmount);
  }

  function testSetWinnersInBatchSuccessMultipleWinners() public {
    vm.startPrank(admin);
    // batch size of 1 to intentionally call setWinners twice
    uint256 batchSize = 1;
    castora.initiatePoolCompletion(poolIdMultiplePredictions, 1550000, batchSize);
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;

    // Get initial stats
    AllPredictionStats memory statsBefore = castora.getAllStats();
    UserPredictionStats memory user1StatsBefore = castora.getUserStats(predicter1);
    UserPredictionStats memory user2StatsBefore = castora.getUserStats(predicter2);
    Pool memory poolBefore = castora.getPool(poolIdMultiplePredictions);

    // Expect event
    uint256 totalBatches = poolBefore.noOfWinners / batchSize;
    vm.expectEmit(true, false, false, true);
    emit SetWinnersInBatch(poolIdMultiplePredictions, 1, totalBatches, winners.length);
    castora.setWinnersInBatch(poolIdMultiplePredictions, winners);

    winners[0] = 3; // using prediction 3 to check a different predicter (there is bulkPredict)
    vm.expectEmit(true, false, false, true);
    emit SetWinnersInBatch(poolIdMultiplePredictions, 2, totalBatches, winners.length);
    castora.setWinnersInBatch(poolIdMultiplePredictions, winners);

    // Verify both predictions are marked as winners
    Prediction memory prediction1 = castora.getPrediction(poolIdMultiplePredictions, 1);
    Prediction memory prediction3 = castora.getPrediction(poolIdMultiplePredictions, 3);
    assertTrue(prediction1.isAWinner);
    assertTrue(prediction3.isAWinner);

    // Verify global stats updated
    AllPredictionStats memory statsAfter = castora.getAllStats();
    assertEq(statsAfter.noOfWinnings, statsBefore.noOfWinnings + 2);
    assertEq(statsAfter.noOfClaimableWinnings, statsBefore.noOfClaimableWinnings + 2);

    // Verify user stats updated for both users
    UserPredictionStats memory user1StatsAfter = castora.getUserStats(predicter1);
    UserPredictionStats memory user2StatsAfter = castora.getUserStats(predicter2);
    assertEq(user1StatsAfter.noOfWinnings, user1StatsBefore.noOfWinnings + 1);
    assertEq(user1StatsAfter.noOfClaimableWinnings, user1StatsBefore.noOfClaimableWinnings + 1);
    assertEq(user2StatsAfter.noOfWinnings, user2StatsBefore.noOfWinnings + 1);
    assertEq(user2StatsAfter.noOfClaimableWinnings, user2StatsBefore.noOfClaimableWinnings + 1);

    // Verify batch processing state
    assertEq(castora.poolCompletionBatchesProcessed(poolIdMultiplePredictions), totalBatches);

    // Verify global winner activity hashes
    assertEq(castora.getWinnerActivityHashesPaginated(0, 10).length, 2);

    // Verify user claimable activities for both users
    bytes32[] memory hashes = castora.getClaimableActivityHashesForAddressPaginated(predicter1, 0, 10);
    UserPredictionActivity[] memory user1ClaimableActivities = castora.getUserPredictionActivities(hashes);
    assertEq(user1ClaimableActivities.length, user1StatsAfter.noOfClaimableWinnings);
    bool foundUser1Activity = false;
    for (uint256 i = 0; i < user1ClaimableActivities.length; i++) {
      if (
        user1ClaimableActivities[i].poolId == poolIdMultiplePredictions
          && user1ClaimableActivities[i].predictionId == prediction1.predictionId
      ) {
        foundUser1Activity = true;
        break;
      }
    }
    assertTrue(foundUser1Activity);

    hashes = castora.getClaimableActivityHashesForAddressPaginated(predicter2, 0, 10);
    UserPredictionActivity[] memory user2ClaimableActivities = castora.getUserPredictionActivities(hashes);
    assertEq(user2ClaimableActivities.length, user2StatsAfter.noOfClaimableWinnings);
    bool foundUser2Activity = false;
    for (uint256 i = 0; i < user2ClaimableActivities.length; i++) {
      if (
        user2ClaimableActivities[i].poolId == poolIdMultiplePredictions
          && user2ClaimableActivities[i].predictionId == prediction3.predictionId
      ) {
        foundUser2Activity = true;
        break;
      }
    }
    assertTrue(foundUser2Activity);

    _winnerAssertsAfterMultipleWinners(prediction1, prediction3);
    _stakeTokenAssertsAfterMultipleWinners();
  }

  function testRevertPausedFinalizePoolCompletion() public {
    castora.pause();
    assertTrue(castora.paused());
    vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
    castora.finalizePoolCompletion(poolIdSinglePrediction);
  }

  function testRevertNotAdminFinalizePoolCompletion() public {
    vm.expectRevert(
      abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, predicter1, castora.ADMIN_ROLE())
    );
    vm.prank(predicter1);
    castora.finalizePoolCompletion(poolIdSinglePrediction);
  }

  function testRevertInvalidPoolIdFinalizePoolCompletion() public {
    vm.startPrank(admin);
    vm.expectRevert(InvalidPoolId.selector);
    castora.finalizePoolCompletion(0);

    vm.expectRevert(InvalidPoolId.selector);
    castora.finalizePoolCompletion(999);
  }

  function testRevertPoolCompletionNotInitiatedFinalizePoolCompletion() public {
    vm.prank(admin);
    vm.expectRevert(PoolCompletionNotInitiated.selector);
    castora.finalizePoolCompletion(poolIdSinglePrediction);
  }

  function testRevertPoolAlreadyCompletedFinalizePoolCompletion() public {
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;
    vm.startPrank(admin);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);
    castora.setWinnersInBatch(poolIdSinglePrediction, winners);
    castora.finalizePoolCompletion(poolIdSinglePrediction);

    // Try to finalize again
    vm.expectRevert(PoolAlreadyCompleted.selector);
    castora.finalizePoolCompletion(poolIdSinglePrediction);
  }

  function testRevertPoolCompletionBatchesNotAllProcessedFinalizePoolCompletion() public {
    // Initiate pool completion but don't process all batches
    vm.prank(admin);
    castora.initiatePoolCompletion(poolIdMultiplePredictions, 1550000, 1); // Batch size 1, but 2 winners

    // Set only one winner (need 2 for this pool)
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;

    vm.startPrank(admin);
    castora.setWinnersInBatch(poolIdMultiplePredictions, winners);

    // Try to finalize before all batches are processed
    vm.expectRevert(PoolCompletionBatchesNotAllProcessed.selector);
    castora.finalizePoolCompletion(poolIdMultiplePredictions);
  }

  function _setupForNativeTokenStake() internal returns (uint256 nativeStakePoolId) {
    // allow the castora address as a stoke token for validating native token usage
    poolsRules.updateAllowedStakeToken(address(castora), true);
    poolsRules.updateAllowedStakeAmount(address(castora), 1 ether, true);

    // Create a pool that uses the contract itself as stake token to test failed fee transfer
    nativeStakePoolId = castora.createPool(
      PoolSeeds({
        predictionToken: address(cusd),
        stakeToken: address(castora),
        stakeAmount: 1 ether,
        snapshotTime: 2100,
        windowCloseTime: 1500,
        feesPercent: 500,
        multiplier: 200,
        isUnlisted: false
      })
    );

    // Add a prediction to this pool
    vm.deal(predicter1, 2 ether);
    vm.prank(predicter1);
    castora.predict{value: 1 ether}(nativeStakePoolId, 2000000);
    vm.warp(2200); // Past snapshot time

    // Initiate and set winner
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;

    vm.startPrank(admin);
    castora.initiatePoolCompletion(nativeStakePoolId, 2050000, 1);
    castora.setWinnersInBatch(nativeStakePoolId, winners);
    vm.stopPrank();
  }

  function testRevertUnsuccessfulFeeCollectionFinalizePoolCompletion() public {
    // Set the poolsManager to a contract that will reject the fee transfer
    castora.setPoolsManager(address(new RejectETH()));

    uint256 nativeStakePoolId = _setupForNativeTokenStake();

    // This should fail due to unsuccessful fee collection from rejected ETH call
    vm.prank(admin);
    vm.expectRevert(UnsuccessfulFeeCollection.selector);
    castora.finalizePoolCompletion(nativeStakePoolId);
  }

  function testRevertERC20FailureFinalizePoolCompletion() public {
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;
    vm.startPrank(admin);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);
    castora.setWinnersInBatch(poolIdSinglePrediction, winners);

    Pool memory pool = castora.getPool(poolIdSinglePrediction);
    uint256 totalStaked = pool.seeds.stakeAmount * pool.noOfPredictions;
    uint256 fees = pool.seeds.feesPercent * totalStaked / 10000;

    // mock cusd to return false for the token transfer
    vm.mockCall(
      address(cusd), abi.encodeWithSelector(IERC20.transfer.selector, address(poolsManager), fees), abi.encode(false)
    );

    // the finalize call should fail ERC20 will fail
    vm.expectRevert(abi.encodeWithSelector(SafeERC20.SafeERC20FailedOperation.selector, address(cusd)));
    castora.finalizePoolCompletion(poolIdSinglePrediction);
  }

  function testFinalizePoolCompletionSuccessNativeTokenStake() public {
    uint256 nativeStakePoolId = _setupForNativeTokenStake();

    // Get initial balances
    uint256 feeCollectorBalanceBefore = feeCollector.balance;
    uint256 castoraBalanceBefore = address(castora).balance;

    // Get pool state before finalization
    Pool memory poolBefore = castora.getPool(nativeStakePoolId);
    assertEq(poolBefore.completionTime, 0); // Should be zero before finalization

    // Calculate expected fees
    uint256 totalStaked = poolBefore.seeds.stakeAmount * poolBefore.noOfPredictions;
    uint256 expectedFees = poolBefore.seeds.feesPercent * totalStaked / 10000;

    // Expect PoolCompleted event, expect ReceiveWasCalled event for native token fee transfer
    // to the CastoraPoolsManager contract
    vm.expectEmit(true, false, false, false);
    emit PoolCompleted(nativeStakePoolId);
    vm.expectEmit(true, false, false, true);
    emit ReceiveWasCalled(address(castora), expectedFees);
    vm.prank(admin);
    castora.finalizePoolCompletion(nativeStakePoolId);

    // Verify pool state after finalization
    Pool memory poolAfter = castora.getPool(nativeStakePoolId);
    assertGt(poolAfter.completionTime, 0); // Should be greater than zero after finalization
    assertEq(poolAfter.completionTime, block.timestamp); // Should equal current block timestamp

    // Verify balance movements - fees should go to fee collector, though they passed
    // through the PoolsManager contract
    uint256 feeCollectorBalanceAfter = feeCollector.balance;
    uint256 castoraBalanceAfter = address(castora).balance;
    assertEq(feeCollectorBalanceAfter, feeCollectorBalanceBefore + expectedFees);
    assertEq(castoraBalanceAfter, castoraBalanceBefore - expectedFees);

    // Verify the remaining balance in Castora should be the win amount for the winner
    uint256 expectedRemainingBalance = totalStaked - expectedFees; // This is the win amount
    assertEq(castoraBalanceAfter, expectedRemainingBalance);
  }

  function testFinalizePoolCompletionSuccessERC20TokenStake() public {
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;
    vm.startPrank(admin);
    castora.initiatePoolCompletion(poolIdSinglePrediction, 1550000, 1);
    castora.setWinnersInBatch(poolIdSinglePrediction, winners);

    // Get initial balances
    uint256 feeCollectorBalanceBefore = cusd.balanceOf(feeCollector);
    uint256 castoraBalanceBefore = cusd.balanceOf(address(castora));

    // Get pool state before finalization
    Pool memory poolBefore = castora.getPool(poolIdSinglePrediction);
    assertEq(poolBefore.completionTime, 0); // Should be zero before finalization

    // Calculate expected fees
    uint256 totalStaked = poolBefore.seeds.stakeAmount * poolBefore.noOfPredictions;
    uint256 expectedFees = poolBefore.seeds.feesPercent * totalStaked / 10000;

    // Expect PoolCompleted event
    vm.expectEmit(true, false, false, false);
    emit PoolCompleted(poolIdSinglePrediction);
    castora.finalizePoolCompletion(poolIdSinglePrediction);

    // Verify pool state after finalization
    Pool memory poolAfter = castora.getPool(poolIdSinglePrediction);
    assertGt(poolAfter.completionTime, 0); // Should be greater than zero after finalization
    assertEq(poolAfter.completionTime, block.timestamp); // Should equal current block timestamp

    // Verify balance movements - fees should go to fee collector
    uint256 feeCollectorBalanceAfter = cusd.balanceOf(feeCollector);
    uint256 castoraBalanceAfter = cusd.balanceOf(address(castora));
    assertEq(feeCollectorBalanceAfter, feeCollectorBalanceBefore + expectedFees);
    assertEq(castoraBalanceAfter, castoraBalanceBefore - expectedFees);
  }
}
