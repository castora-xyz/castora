// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {ERC1967Proxy} from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import {PausableUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol';
import {Test} from 'forge-std/Test.sol';
import {Castora} from '../src/Castora.sol';
import {CastoraErrors} from '../src/CastoraErrors.sol';
import {CastoraEvents} from '../src/CastoraEvents.sol';
import {CastoraPoolsManager} from '../src/CastoraPoolsManager.sol';
import {CastoraPoolsRules} from '../src/CastoraPoolsRules.sol';
import {CastoraStructs} from '../src/CastoraStructs.sol';
import {cUSD} from '../src/cUSD.sol';

contract RejectETH {}

contract CastoraClaimTest is CastoraErrors, CastoraEvents, CastoraStructs, Test {
  Castora castora;
  CastoraPoolsManager poolsManager;
  CastoraPoolsRules poolsRules;
  cUSD cusd;
  address feeCollector;
  address predicter1;
  address predicter2;
  address predicter3;
  uint256 poolIdERC20;
  uint256 poolIdNative;
  uint256 poolIdNotCompleted;
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
    predicter1 = makeAddr('predicter1');
    predicter2 = makeAddr('predicter2');
    predicter3 = makeAddr('predicter3');

    // Deploy contracts
    cusd = new cUSD();
    poolsManager = CastoraPoolsManager(payable(address(new ERC1967Proxy(address(new CastoraPoolsManager()), ''))));
    poolsManager.initialize(feeCollector, 5000);
    poolsRules = CastoraPoolsRules(address(new ERC1967Proxy(address(new CastoraPoolsRules()), '')));
    poolsRules.initialize();
    castora = Castora(payable(address(new ERC1967Proxy(address(new Castora()), ''))));
    castora.initialize(address(poolsManager), address(poolsRules));
    poolsManager.setCastora(address(castora));

    // Configure pools rules
    poolsRules.updateAllowedPredictionToken(address(cusd), true);
    poolsRules.updateAllowedStakeToken(address(cusd), true);
    poolsRules.updateAllowedStakeAmount(address(cusd), 1000000, true);
    poolsRules.updateAllowedStakeToken(address(castora), true);
    poolsRules.updateAllowedStakeAmount(address(castora), 1 ether, true);
    poolsRules.updateAllowedPoolMultiplier(200, true);

    validSeeds = getPoolSeeds();
    poolIdERC20 = castora.createPool(validSeeds);

    // Create and complete Native token pool
    PoolSeeds memory nativeSeeds = validSeeds;
    nativeSeeds.stakeToken = address(castora);
    nativeSeeds.stakeAmount = 1 ether;
    nativeSeeds.snapshotTime = 1500;
    poolIdNative = castora.createPool(nativeSeeds);

    // Create pool that won't be completed
    PoolSeeds memory notCompletedSeeds = validSeeds;
    notCompletedSeeds.snapshotTime = 1500;
    notCompletedSeeds.windowCloseTime = 1200;
    poolIdNotCompleted = castora.createPool(notCompletedSeeds);

    // Give predicters tokens
    cusd.transfer(predicter1, 10000000);
    cusd.transfer(predicter2, 10000000);
    cusd.transfer(predicter3, 10000000);
    vm.deal(predicter1, 5 ether);
    vm.deal(predicter2, 5 ether);

    // Make predictions in ERC20 pool
    vm.prank(predicter1);
    cusd.approve(address(castora), 1000000);
    vm.prank(predicter1);
    castora.predict(poolIdERC20, 1500000);

    vm.prank(predicter2);
    cusd.approve(address(castora), 1000000);
    vm.prank(predicter2);
    castora.predict(poolIdERC20, 1600000);

    // Make predictions in Native pool
    vm.prank(predicter1);
    castora.predict{value: 1 ether}(poolIdNative, 1500000);
    vm.prank(predicter2);
    castora.predict{value: 1 ether}(poolIdNative, 1600000);

    // Make predictions in not completed pool
    vm.prank(predicter1);
    cusd.approve(address(castora), 1000000);
    vm.prank(predicter1);
    castora.predict(poolIdNotCompleted, 1500000);

    vm.warp(1600); // Past all snapshot times

    // Complete ERC20 pool
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;
    castora.initiatePoolCompletion(poolIdERC20, 1550000, 1);
    castora.setWinnersInBatch(poolIdERC20, winners);
    castora.finalizePoolCompletion(poolIdERC20);

    // Complete Native pool
    castora.initiatePoolCompletion(poolIdNative, 1550000, 1);
    castora.setWinnersInBatch(poolIdNative, winners);
    castora.finalizePoolCompletion(poolIdNative);
  }

  function testRevertPausedClaimWinnings() public {
    castora.pause();
    assertTrue(castora.paused());

    vm.prank(predicter1);
    vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
    castora.claimWinnings(poolIdERC20, 1);
  }

  function testRevertInvalidPoolIdClaimWinnings() public {
    vm.prank(predicter1);
    vm.expectRevert(InvalidPoolId.selector);
    castora.claimWinnings(0, 1);

    vm.prank(predicter1);
    vm.expectRevert(InvalidPoolId.selector);
    castora.claimWinnings(999, 1);
  }

  function testRevertPoolNotYetCompletedClaimWinnings() public {
    vm.prank(predicter1);
    vm.expectRevert(PoolNotYetCompleted.selector);
    castora.claimWinnings(poolIdNotCompleted, 1);
  }

  function testRevertInvalidPredictionIdClaimWinnings() public {
    vm.prank(predicter1);
    vm.expectRevert(InvalidPredictionId.selector);
    castora.claimWinnings(poolIdERC20, 0);

    vm.prank(predicter1);
    vm.expectRevert(InvalidPredictionId.selector);
    castora.claimWinnings(poolIdERC20, 999);
  }

  function testRevertNotYourPredictionClaimWinnings() public {
    // predicter2 trying to claim predicter1's prediction
    vm.prank(predicter2);
    vm.expectRevert(NotYourPrediction.selector);
    castora.claimWinnings(poolIdERC20, 1);
  }

  function testRevertNotAWinnerClaimWinnings() public {
    // predicter2 made prediction 2 but only prediction 1 is a winner
    vm.prank(predicter2);
    vm.expectRevert(NotAWinner.selector);
    castora.claimWinnings(poolIdERC20, 2);
  }

  function testRevertAlreadyClaimedClaimWinnings() public {
    // First claim should succeed
    vm.prank(predicter1);
    castora.claimWinnings(poolIdERC20, 1);

    // Second claim should fail
    vm.prank(predicter1);
    vm.expectRevert(AlreadyClaimedWinnings.selector);
    castora.claimWinnings(poolIdERC20, 1);
  }

  function testRevertUnsuccessfulSendWinningsNativeClaimWinnings() public {
    // Change predicter1 to a contract that rejects ETH
    RejectETH rejectContract = new RejectETH();

    // We need to create a new pool and prediction with the reject contract as predicter
    PoolSeeds memory rejectSeeds = validSeeds;
    rejectSeeds.stakeToken = address(castora);
    rejectSeeds.stakeAmount = 1 ether;
    rejectSeeds.snapshotTime = 1500;
    rejectSeeds.windowCloseTime = 1200;
    uint256 rejectPoolId = castora.createPool(rejectSeeds);

    vm.warp(0); // Reset time to allow prediction

    // Fund the reject contract and make it predict
    vm.deal(address(rejectContract), 2 ether);
    vm.prank(address(rejectContract));
    castora.predict{value: 1 ether}(rejectPoolId, 1500000);

    vm.warp(1700); // Past snapshot time

    // Complete the pool with the reject contract as winner
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;
    castora.initiatePoolCompletion(rejectPoolId, 1550000, 1);
    castora.setWinnersInBatch(rejectPoolId, winners);
    castora.finalizePoolCompletion(rejectPoolId);

    // Try to claim - should fail due to ETH transfer failure
    vm.prank(address(rejectContract));
    vm.expectRevert(UnsuccessfulSendWinnings.selector);
    castora.claimWinnings(rejectPoolId, 1);
  }

  function testRevertERC20FailureClaimWinnings() public {
    // Mock the ERC20 token to fail on transfer
    Pool memory pool = castora.getPool(poolIdERC20);

    vm.mockCall(
      address(cusd), abi.encodeWithSelector(IERC20.transfer.selector, predicter1, pool.winAmount), abi.encode(false)
    );

    vm.prank(predicter1);
    vm.expectRevert(abi.encodeWithSelector(SafeERC20.SafeERC20FailedOperation.selector, address(cusd)));
    castora.claimWinnings(poolIdERC20, 1);
  }

  function _moreAssertsOnClaimSuccess(
    Pool memory poolBefore,
    Prediction memory predictionAfter,
    AllPredictionStats memory globalStatsBefore,
    UserPredictionStats memory userStatsBefore,
    UserInPoolPredictionStats memory userInPoolStatsBefore,
    StakeTokenDetails memory stakeTokenStatsBefore,
    StakeTokenDetails memory userStakeTokenStatsBefore
  ) internal view {
    // Verify prediction state changes
    assertEq(predictionAfter.claimedWinningsTime, block.timestamp);
    assertTrue(predictionAfter.claimedWinningsTime > 0);

    // Verify global stats changes
    AllPredictionStats memory globalStatsAfter = castora.getAllStats();
    assertEq(globalStatsAfter.noOfClaimableWinnings, globalStatsBefore.noOfClaimableWinnings - 1);
    assertEq(globalStatsAfter.noOfClaimedWinnings, globalStatsBefore.noOfClaimedWinnings + 1);

    // Verify user stats changes
    UserPredictionStats memory userStatsAfter = castora.getUserStats(predicter1);
    assertEq(userStatsAfter.noOfClaimedWinnings, userStatsBefore.noOfClaimedWinnings + 1);

    // Verify user in pool stats changes
    UserInPoolPredictionStats memory userInPoolStatsAfter =
      castora.getUserInPoolPredictionStats(poolBefore.poolId, predicter1);
    assertEq(userInPoolStatsAfter.noOfClaimedWinnings, userInPoolStatsBefore.noOfClaimedWinnings + 1);

    // Verify stake token stats changes
    StakeTokenDetails memory stakeTokenStatsAfter = castora.getStakeTokenDetails(poolBefore.seeds.stakeToken);
    assertEq(stakeTokenStatsAfter.noOfClaimableWinnings, stakeTokenStatsBefore.noOfClaimableWinnings - 1);
    assertEq(stakeTokenStatsAfter.noOfClaimedWinnings, stakeTokenStatsBefore.noOfClaimedWinnings + 1);
    assertEq(stakeTokenStatsAfter.totalClaimable, stakeTokenStatsBefore.totalClaimable - poolBefore.winAmount);
    assertEq(stakeTokenStatsAfter.totalClaimed, stakeTokenStatsBefore.totalClaimed + poolBefore.winAmount);

    // Verify user stake token stats changes
    StakeTokenDetails memory userStakeTokenStatsAfter =
      castora.getUserStakeTokenDetails(predicter1, poolBefore.seeds.stakeToken);
    assertEq(userStakeTokenStatsAfter.noOfClaimableWinnings, userStakeTokenStatsBefore.noOfClaimableWinnings - 1);
    assertEq(userStakeTokenStatsAfter.noOfClaimedWinnings, userStakeTokenStatsBefore.noOfClaimedWinnings + 1);
    assertEq(userStakeTokenStatsAfter.totalClaimable, userStakeTokenStatsBefore.totalClaimable - poolBefore.winAmount);
    assertEq(userStakeTokenStatsAfter.totalClaimed, userStakeTokenStatsBefore.totalClaimed + poolBefore.winAmount);

    // Verify claimable states are updated
    UserPredictionActivity[] memory claimableActivitiesAfter =
      castora.getClaimableActivitiesForAddressPaginated(predicter1, 0, 10);
    uint256[] memory claimablePredictionsAfter =
      castora.getClaimableWinnerPredictionIdsInPoolForUserPaginated(poolBefore.poolId, predicter1, 0, 10);

    assertEq(claimableActivitiesAfter.length, 1); // Should have 1 remaining (Native pool)
    assertEq(claimablePredictionsAfter.length, 0); // Should have no claimable predictions in this pool
  }

  function testClaimWinningsERC20Success() public {
    // Store balances and states before claiming
    uint256 castoraBalBefore = cusd.balanceOf(address(castora));
    uint256 predicterBalBefore = cusd.balanceOf(predicter1);
    Pool memory poolBefore = castora.getPool(poolIdERC20);

    // Get stats before claiming
    AllPredictionStats memory globalStatsBefore = castora.getAllStats();
    UserPredictionStats memory userStatsBefore = castora.getUserStats(predicter1);
    UserInPoolPredictionStats memory userInPoolStatsBefore =
      castora.getUserInPoolPredictionStats(poolIdERC20, predicter1);
    StakeTokenDetails memory stakeTokenStatsBefore = castora.getStakeTokenDetails(address(cusd));
    StakeTokenDetails memory userStakeTokenStatsBefore = castora.getUserStakeTokenDetails(predicter1, address(cusd));

    // Get claimable states before
    UserPredictionActivity[] memory claimableActivitiesBefore =
      castora.getClaimableActivitiesForAddressPaginated(predicter1, 0, 10);
    uint256[] memory claimablePredictionsBefore =
      castora.getClaimableWinnerPredictionIdsInPoolForUserPaginated(poolIdERC20, predicter1, 0, 10);

    // Verify claimable states exist
    assertEq(claimableActivitiesBefore.length, 2); // Should have 2 claimable activities (ERC20 and Native)
    assertEq(claimablePredictionsBefore.length, 1); // Should have 1 claimable prediction in this pool
    assertEq(claimablePredictionsBefore[0], 1); // Should be prediction ID 1

    // Perform the claim
    vm.prank(predicter1);
    vm.expectEmit(true, true, true, true);
    emit ClaimedWinnings(poolIdERC20, 1, predicter1, address(cusd), 1000000, poolBefore.winAmount);
    castora.claimWinnings(poolIdERC20, 1);

    // Verify balances after claiming
    uint256 castoraBalAfter = cusd.balanceOf(address(castora));
    uint256 predicterBalAfter = cusd.balanceOf(predicter1);
    assertEq(castoraBalAfter, castoraBalBefore - poolBefore.winAmount);
    assertEq(predicterBalAfter, predicterBalBefore + poolBefore.winAmount);

    // Verify pool state changes
    assertEq(castora.getPool(poolIdERC20).noOfClaimedWinnings, poolBefore.noOfClaimedWinnings + 1);

    _moreAssertsOnClaimSuccess(
      poolBefore,
      castora.getPrediction(poolIdERC20, 1),
      globalStatsBefore,
      userStatsBefore,
      userInPoolStatsBefore,
      stakeTokenStatsBefore,
      userStakeTokenStatsBefore
    );
  }

  function testClaimWinningsNativeSuccess() public {
    // Store balances and states before claiming
    uint256 castoraBalBefore = address(castora).balance;
    uint256 predicterBalBefore = predicter1.balance;
    Pool memory poolBefore = castora.getPool(poolIdNative);

    // Get stats before claiming
    AllPredictionStats memory globalStatsBefore = castora.getAllStats();
    UserPredictionStats memory userStatsBefore = castora.getUserStats(predicter1);
    UserInPoolPredictionStats memory userInPoolStatsBefore =
      castora.getUserInPoolPredictionStats(poolIdNative, predicter1);
    StakeTokenDetails memory stakeTokenStatsBefore = castora.getStakeTokenDetails(address(castora));
    StakeTokenDetails memory userStakeTokenStatsBefore = castora.getUserStakeTokenDetails(predicter1, address(castora));

    // Get claimable states before
    UserPredictionActivity[] memory claimableActivitiesBefore =
      castora.getClaimableActivitiesForAddressPaginated(predicter1, 0, 10);
    uint256[] memory claimablePredictionsBefore =
      castora.getClaimableWinnerPredictionIdsInPoolForUserPaginated(poolIdNative, predicter1, 0, 10);

    // Verify claimable states exist (should still have 2 if ERC20 hasn't been claimed, or 1 if it has)
    assertTrue(claimableActivitiesBefore.length >= 1); // Should have at least 1 claimable activity
    assertEq(claimablePredictionsBefore.length, 1); // Should have 1 claimable prediction in this pool
    assertEq(claimablePredictionsBefore[0], 1); // Should be prediction ID 1

    // Perform the claim
    vm.expectEmit(true, true, true, true);
    emit ClaimedWinnings(poolIdNative, 1, predicter1, address(castora), 1 ether, poolBefore.winAmount);

    vm.prank(predicter1);
    castora.claimWinnings(poolIdNative, 1);

    // Verify balances after claiming
    uint256 castoraBalAfter = address(castora).balance;
    uint256 predicterBalAfter = predicter1.balance;
    assertEq(castoraBalAfter, castoraBalBefore - poolBefore.winAmount);
    assertEq(predicterBalAfter, predicterBalBefore + poolBefore.winAmount);

    // Verify pool state changes
    assertEq(castora.getPool(poolIdNative).noOfClaimedWinnings, poolBefore.noOfClaimedWinnings + 1);

    _moreAssertsOnClaimSuccess(
      poolBefore,
      castora.getPrediction(poolIdNative, 1),
      globalStatsBefore,
      userStatsBefore,
      userInPoolStatsBefore,
      stakeTokenStatsBefore,
      userStakeTokenStatsBefore
    );
  }

  function testRevertPausedClaimWinningsBulk() public {
    castora.pause();
    assertTrue(castora.paused());

    uint256[] memory poolIds = new uint256[](1);
    uint256[] memory predictionIds = new uint256[](1);
    poolIds[0] = poolIdERC20;
    predictionIds[0] = 1;

    vm.prank(predicter1);
    vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
    castora.claimWinningsBulk(poolIds, predictionIds);
  }

  function testRevertUnmatchingPoolsAndPredictionsClaimWinningsBulk() public {
    uint256[] memory poolIds = new uint256[](2);
    uint256[] memory predictionIds = new uint256[](1);
    poolIds[0] = poolIdERC20;
    poolIds[1] = poolIdNative;
    predictionIds[0] = 1;

    vm.prank(predicter1);
    vm.expectRevert(UnmatchingPoolsAndPredictions.selector);
    castora.claimWinningsBulk(poolIds, predictionIds);
  }

  // function testClaimWinningsBulkNativeSuccess() public {
  //   // Create additional pools and predictions for bulk testing
  //   PoolSeeds memory bulkSeeds1 = validSeeds;
  //   bulkSeeds1.stakeToken = address(castora);
  //   bulkSeeds1.stakeAmount = 1 ether;
  //   bulkSeeds1.snapshotTime = 1800;
  //   bulkSeeds1.windowCloseTime = 1500;
  //   uint256 bulkPoolId1 = castora.createPool(bulkSeeds1);

  //   PoolSeeds memory bulkSeeds2 = validSeeds;
  //   bulkSeeds2.stakeToken = address(castora);
  //   bulkSeeds2.stakeAmount = 1 ether;
  //   bulkSeeds2.snapshotTime = 1800;
  //   bulkSeeds2.windowCloseTime = 1800;
  //   uint256 bulkPoolId2 = castora.createPool(bulkSeeds2);

  //   // Reset time and make predictions
  //   vm.warp(0);
  //   vm.prank(predicter1);
  //   castora.predict{value: 1 ether}(bulkPoolId1, 1500000);
  //   vm.prank(predicter1);
  //   castora.predict{value: 1 ether}(bulkPoolId2, 1600000);

  //   // Advance time and complete pools
  //   vm.warp(2000);
  //   uint256[] memory winners = new uint256[](1);
  //   winners[0] = 1;

  //   castora.initiatePoolCompletion(bulkPoolId1, 1550000, 1);
  //   castora.setWinnersInBatch(bulkPoolId1, winners);
  //   castora.finalizePoolCompletion(bulkPoolId1);

  //   castora.initiatePoolCompletion(bulkPoolId2, 1650000, 1);
  //   castora.setWinnersInBatch(bulkPoolId2, winners);
  //   castora.finalizePoolCompletion(bulkPoolId2);

  //   // Store states before bulk claiming
  //   uint256 predicterBalBefore = predicter1.balance;
  //   Pool memory pool1Before = castora.getPool(bulkPoolId1);
  //   Pool memory pool2Before = castora.getPool(bulkPoolId2);

  //   AllPredictionStats memory globalStatsBefore = castora.getAllStats();
  //   UserPredictionStats memory userStatsBefore = castora.getUserStats(predicter1);
  //   StakeTokenDetails memory stakeTokenStatsBefore = castora.getStakeTokenDetails(address(castora));
  //   StakeTokenDetails memory userStakeTokenStatsBefore = castora.getUserStakeTokenDetails(predicter1, address(castora));

  //   UserPredictionActivity[] memory claimableActivitiesBefore =
  //     castora.getClaimableActivitiesForAddressPaginated(predicter1, 0, 10);

  //   // Prepare bulk claim data
  //   uint256[] memory poolIds = new uint256[](2);
  //   uint256[] memory predictionIds = new uint256[](2);
  //   poolIds[0] = bulkPoolId1;
  //   poolIds[1] = bulkPoolId2;
  //   predictionIds[0] = 1;
  //   predictionIds[1] = 1;

  //   // Perform bulk claim
  //   vm.expectEmit(true, true, true, true);
  //   emit ClaimedWinnings(bulkPoolId1, 1, predicter1, address(castora), 1 ether, pool1Before.winAmount);
  //   vm.expectEmit(true, true, true, true);
  //   emit ClaimedWinnings(bulkPoolId2, 1, predicter1, address(castora), 1 ether, pool2Before.winAmount);

  //   vm.prank(predicter1);
  //   castora.claimWinningsBulk(poolIds, predictionIds);

  //   // Verify balance changes
  //   uint256 predicterBalAfter = predicter1.balance;
  //   uint256 expectedWinnings = pool1Before.winAmount + pool2Before.winAmount;
  //   assertEq(predicterBalAfter, predicterBalBefore + expectedWinnings);

  //   // Verify pool states
  //   Pool memory pool1After = castora.getPool(bulkPoolId1);
  //   Pool memory pool2After = castora.getPool(bulkPoolId2);
  //   assertEq(pool1After.noOfClaimedWinnings, pool1Before.noOfClaimedWinnings + 1);
  //   assertEq(pool2After.noOfClaimedWinnings, pool2Before.noOfClaimedWinnings + 1);

  //   // Verify prediction states
  //   Prediction memory prediction1After = castora.getPrediction(bulkPoolId1, 1);
  //   Prediction memory prediction2After = castora.getPrediction(bulkPoolId2, 1);
  //   assertTrue(prediction1After.claimedWinningsTime > 0);
  //   assertTrue(prediction2After.claimedWinningsTime > 0);

  //   // Verify global stats (should decrease by 2 claimable, increase by 2 claimed)
  //   AllPredictionStats memory globalStatsAfter = castora.getAllStats();
  //   assertEq(globalStatsAfter.noOfClaimableWinnings, globalStatsBefore.noOfClaimableWinnings - 2);
  //   assertEq(globalStatsAfter.noOfClaimedWinnings, globalStatsBefore.noOfClaimedWinnings + 2);

  //   // Verify user stats (should increase claimed by 2)
  //   UserPredictionStats memory userStatsAfter = castora.getUserStats(predicter1);
  //   assertEq(userStatsAfter.noOfClaimedWinnings, userStatsBefore.noOfClaimedWinnings + 2);

  //   // Verify stake token stats
  //   StakeTokenDetails memory stakeTokenStatsAfter = castora.getStakeTokenDetails(address(castora));
  //   assertEq(stakeTokenStatsAfter.noOfClaimableWinnings, stakeTokenStatsBefore.noOfClaimableWinnings - 2);
  //   assertEq(stakeTokenStatsAfter.noOfClaimedWinnings, stakeTokenStatsBefore.noOfClaimedWinnings + 2);
  //   assertEq(stakeTokenStatsAfter.totalClaimed, stakeTokenStatsBefore.totalClaimed + expectedWinnings);

  //   // Verify user stake token stats
  //   StakeTokenDetails memory userStakeTokenStatsAfter = castora.getUserStakeTokenDetails(predicter1, address(castora));
  //   assertEq(userStakeTokenStatsAfter.noOfClaimableWinnings, userStakeTokenStatsBefore.noOfClaimableWinnings - 2);
  //   assertEq(userStakeTokenStatsAfter.noOfClaimedWinnings, userStakeTokenStatsBefore.noOfClaimedWinnings + 2);
  //   assertEq(userStakeTokenStatsAfter.totalClaimed, userStakeTokenStatsBefore.totalClaimed + expectedWinnings);

  //   // Verify claimable activities are removed
  //   UserPredictionActivity[] memory claimableActivitiesAfter =
  //     castora.getClaimableActivitiesForAddressPaginated(predicter1, 0, 10);
  //   assertEq(claimableActivitiesAfter.length, claimableActivitiesBefore.length - 2);
  // }

  // function testClaimWinningsBulkERC20Success() public {
  //   // Create additional ERC20 pools for bulk testing
  //   PoolSeeds memory bulkSeeds1 = validSeeds;
  //   bulkSeeds1.snapshotTime = 1800;
  //   bulkSeeds1.windowCloseTime = 1700;
  //   uint256 bulkPoolId1 = castora.createPool(bulkSeeds1);

  //   PoolSeeds memory bulkSeeds2 = validSeeds;
  //   bulkSeeds2.snapshotTime = 1900;
  //   bulkSeeds2.windowCloseTime = 1800;
  //   uint256 bulkPoolId2 = castora.createPool(bulkSeeds2);

  //   // Reset time and make predictions
  //   vm.warp(0);
  //   vm.prank(predicter1);
  //   cusd.approve(address(castora), 2000000);
  //   vm.prank(predicter1);
  //   castora.predict(bulkPoolId1, 1500000);
  //   vm.prank(predicter1);
  //   castora.predict(bulkPoolId2, 1600000);

  //   // Advance time and complete pools
  //   vm.warp(2000);
  //   uint256[] memory winners = new uint256[](1);
  //   winners[0] = 1;

  //   castora.initiatePoolCompletion(bulkPoolId1, 1550000, 1);
  //   castora.setWinnersInBatch(bulkPoolId1, winners);
  //   castora.finalizePoolCompletion(bulkPoolId1);

  //   castora.initiatePoolCompletion(bulkPoolId2, 1650000, 1);
  //   castora.setWinnersInBatch(bulkPoolId2, winners);
  //   castora.finalizePoolCompletion(bulkPoolId2);

  //   // Store states before bulk claiming
  //   uint256 predicterBalBefore = cusd.balanceOf(predicter1);
  //   Pool memory pool1Before = castora.getPool(bulkPoolId1);
  //   Pool memory pool2Before = castora.getPool(bulkPoolId2);

  //   AllPredictionStats memory globalStatsBefore = castora.getAllStats();
  //   UserPredictionStats memory userStatsBefore = castora.getUserStats(predicter1);
  //   StakeTokenDetails memory stakeTokenStatsBefore = castora.getStakeTokenDetails(address(cusd));
  //   StakeTokenDetails memory userStakeTokenStatsBefore = castora.getUserStakeTokenDetails(predicter1, address(cusd));

  //   UserPredictionActivity[] memory claimableActivitiesBefore =
  //     castora.getClaimableActivitiesForAddressPaginated(predicter1, 0, 10);

  //   // Prepare bulk claim data
  //   uint256[] memory poolIds = new uint256[](2);
  //   uint256[] memory predictionIds = new uint256[](2);
  //   poolIds[0] = bulkPoolId1;
  //   poolIds[1] = bulkPoolId2;
  //   predictionIds[0] = 1;
  //   predictionIds[1] = 1;

  //   // Perform bulk claim
  //   vm.expectEmit(true, true, true, true);
  //   emit ClaimedWinnings(bulkPoolId1, 1, predicter1, address(cusd), 1000000, pool1Before.winAmount);
  //   vm.expectEmit(true, true, true, true);
  //   emit ClaimedWinnings(bulkPoolId2, 1, predicter1, address(cusd), 1000000, pool2Before.winAmount);

  //   vm.prank(predicter1);
  //   castora.claimWinningsBulk(poolIds, predictionIds);

  //   // Verify balance changes
  //   uint256 predicterBalAfter = cusd.balanceOf(predicter1);
  //   uint256 expectedWinnings = pool1Before.winAmount + pool2Before.winAmount;
  //   assertEq(predicterBalAfter, predicterBalBefore + expectedWinnings);

  //   // Verify pool states
  //   Pool memory pool1After = castora.getPool(bulkPoolId1);
  //   Pool memory pool2After = castora.getPool(bulkPoolId2);
  //   assertEq(pool1After.noOfClaimedWinnings, pool1Before.noOfClaimedWinnings + 1);
  //   assertEq(pool2After.noOfClaimedWinnings, pool2Before.noOfClaimedWinnings + 1);

  //   // Verify prediction states
  //   Prediction memory prediction1After = castora.getPrediction(bulkPoolId1, 1);
  //   Prediction memory prediction2After = castora.getPrediction(bulkPoolId2, 1);
  //   assertTrue(prediction1After.claimedWinningsTime > 0);
  //   assertTrue(prediction2After.claimedWinningsTime > 0);

  //   // Verify global stats (should decrease by 2 claimable, increase by 2 claimed)
  //   AllPredictionStats memory globalStatsAfter = castora.getAllStats();
  //   assertEq(globalStatsAfter.noOfClaimableWinnings, globalStatsBefore.noOfClaimableWinnings - 2);
  //   assertEq(globalStatsAfter.noOfClaimedWinnings, globalStatsBefore.noOfClaimedWinnings + 2);

  //   // Verify user stats (should increase claimed by 2)
  //   UserPredictionStats memory userStatsAfter = castora.getUserStats(predicter1);
  //   assertEq(userStatsAfter.noOfClaimedWinnings, userStatsBefore.noOfClaimedWinnings + 2);

  //   // Verify stake token stats
  //   StakeTokenDetails memory stakeTokenStatsAfter = castora.getStakeTokenDetails(address(cusd));
  //   assertEq(stakeTokenStatsAfter.noOfClaimableWinnings, stakeTokenStatsBefore.noOfClaimableWinnings - 2);
  //   assertEq(stakeTokenStatsAfter.noOfClaimedWinnings, stakeTokenStatsBefore.noOfClaimedWinnings + 2);
  //   assertEq(stakeTokenStatsAfter.totalClaimed, stakeTokenStatsBefore.totalClaimed + expectedWinnings);

  //   // Verify user stake token stats
  //   StakeTokenDetails memory userStakeTokenStatsAfter = castora.getUserStakeTokenDetails(predicter1, address(cusd));
  //   assertEq(userStakeTokenStatsAfter.noOfClaimableWinnings, userStakeTokenStatsBefore.noOfClaimableWinnings - 2);
  //   assertEq(userStakeTokenStatsAfter.noOfClaimedWinnings, userStakeTokenStatsBefore.noOfClaimedWinnings + 2);
  //   assertEq(userStakeTokenStatsAfter.totalClaimed, userStakeTokenStatsBefore.totalClaimed + expectedWinnings);

  //   // Verify claimable activities are removed
  //   UserPredictionActivity[] memory claimableActivitiesAfter =
  //     castora.getClaimableActivitiesForAddressPaginated(predicter1, 0, 10);
  //   assertEq(claimableActivitiesAfter.length, claimableActivitiesBefore.length - 2);
  // }
}
