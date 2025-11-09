// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {ERC1967Proxy} from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import {PausableUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import {Test, Vm} from 'forge-std/Test.sol';
import {Castora} from '../src/Castora.sol';
import {CastoraActivities} from '../src/CastoraActivities.sol';
import {CastoraErrors} from '../src/CastoraErrors.sol';
import {CastoraEvents} from '../src/CastoraEvents.sol';
import {CastoraGetters} from '../src/CastoraGetters.sol';
import {CastoraPoolsManager} from '../src/CastoraPoolsManager.sol';
import {CastoraPoolsRules} from '../src/CastoraPoolsRules.sol';
import {CastoraStructs} from '../src/CastoraStructs.sol';
import {cUSD} from '../src/cUSD.sol';

contract CastoraPredictTest is CastoraErrors, CastoraEvents, CastoraStructs, Test {
  CastoraActivities activities;
  Castora castora;
  CastoraGetters getters;
  CastoraPoolsManager poolsManager;
  CastoraPoolsRules poolsRules;
  cUSD cusd;
  address feeCollector;
  address predicter;
  uint256 poolIdNative;
  uint256 poolIdERC20;
  PoolSeeds validSeedsNative;
  PoolSeeds validSeedsERC20;

  // Allow test contract to receive ETH
  receive() external payable {}

  function getPoolSeeds(address stake) internal view returns (PoolSeeds memory) {
    return PoolSeeds({
      predictionToken: address(cusd),
      stakeToken: stake,
      stakeAmount: stake == address(castora) ? 1 ether : 1000000,
      snapshotTime: 1200,
      windowCloseTime: 900,
      feesPercent: 500,
      multiplier: 200,
      isUnlisted: false
    });
  }

  function setUp() public {
    feeCollector = makeAddr('feeCollector');
    predicter = makeAddr('predicter');

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
    activities.setAuthorizedLogger((address(poolsManager)), true);
    activities.setAuthorizedLogger((address(castora)), true);
    getters = new CastoraGetters(address(castora));

    // Configure pools rules
    poolsRules.updateAllowedPredictionToken(address(cusd), true);
    poolsRules.allowStakeToken(address(cusd), 1000000);
    poolsRules.allowStakeToken(address(castora), 1 ether);
    poolsRules.updateAllowedPoolMultiplier(200, true);

    // Create pools for testing
    validSeedsNative = getPoolSeeds(address(castora));
    poolIdNative = castora.createPool(validSeedsNative);
    validSeedsERC20 = getPoolSeeds(address(cusd));
    poolIdERC20 = castora.createPool(validSeedsERC20);

    // Give predicter some tokens and ETH
    cusd.transfer(predicter, 10000000);
    vm.deal(predicter, 10 ether);
  }

  function testRevertPausedPredict() public {
    castora.pause();
    assertTrue(castora.paused());

    vm.prank(predicter);
    vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
    castora.predict(poolIdNative, 1500000);
  }

  function testRevertInvalidPoolIdPredict() public {
    vm.prank(predicter);
    vm.expectRevert(InvalidPoolId.selector);
    castora.predict(0, 1500000); // Non-existent pool

    vm.prank(predicter);
    vm.expectRevert(InvalidPoolId.selector);
    castora.predict(999, 1500000); // Non-existent pool
  }

  function testRevertWindowHasClosedPredict() public {
    vm.warp(1000); // Past window close time

    vm.prank(predicter);
    vm.expectRevert(WindowHasClosed.selector);
    castora.predict(poolIdNative, 1500000);
  }

  function testRevertInsufficientStakePredict() public {
    vm.prank(predicter);
    vm.expectRevert(InsufficientStakeValue.selector);
    castora.predict{value: 0.5 ether}(poolIdNative, 1500000); // Less than required 1 ether
  }

  function testRevertIncorrectStakePredict() public {
    vm.prank(predicter);
    vm.expectRevert(IncorrectStakeValue.selector);
    castora.predict{value: 2 ether}(poolIdNative, 1500000); // More than required 1 ether
  }

  function testRevertERC20FailurePredict() public {
    // Approve tokens first
    vm.prank(predicter);
    IERC20(address(cusd)).approve(address(castora), 1000000);

    // mock cusd to return false for the token transfer
    vm.mockCall(
      address(cusd),
      abi.encodeWithSelector(IERC20.transferFrom.selector, predicter, address(castora), 1000000),
      abi.encode(false)
    );

    vm.prank(predicter);
    vm.expectRevert(abi.encodeWithSelector(SafeERC20.SafeERC20FailedOperation.selector, address(cusd)));
    castora.predict(poolIdERC20, 1500000);
  }

  // splitted out the function to overcome "stack too deep" error
  function _moreAssertionsOnPredictNativeStakeSuccess(uint256 expectedPredictionId) internal view {
    // Verify user in pool prediction stats
    UserInPoolPredictionStats memory userInPoolStats = getters.userInPoolPredictionStats(poolIdNative, predicter);
    assertEq(userInPoolStats.noOfPredictions, 1);
    assertEq(userInPoolStats.noOfWinnings, 0);
    assertEq(userInPoolStats.noOfClaimableWinnings, 0);
    assertEq(userInPoolStats.noOfClaimedWinnings, 0);

    // Verify user prediction activity was recorded
    PredictionRecord memory expectedRecord = PredictionRecord(poolIdNative, expectedPredictionId);
    bytes32 recordHash = castora.hashPredictionRecord(expectedRecord);
    PredictionRecord memory actualRecord = getters.predictionRecord(recordHash);
    assertEq(actualRecord.poolId, poolIdNative);
    assertEq(actualRecord.predictionId, expectedPredictionId);

    // Verify user prediction IDs tracking
    uint256[] memory userPredictionIds = getters.userInPoolPredictionIdsPaginated(poolIdNative, predicter, 0, 10);
    assertEq(userPredictionIds.length, 1);
    assertEq(userPredictionIds[0], expectedPredictionId);

    // Verify user activities tracking
    PredictionRecord[] memory userRecords = getters.userPredictionRecordsPaginated(predicter, 0, 10);
    assertEq(userRecords.length, 1);
    assertEq(userRecords[0].poolId, poolIdNative);
    assertEq(userRecords[0].predictionId, expectedPredictionId);

    // Verify global prediction activities tracking
    PredictionRecord[] memory allRecords = getters.predictionRecordsPaginated(0, 10);
    assertEq(allRecords.length, 1);
    assertEq(allRecords[0].poolId, poolIdNative);
    assertEq(allRecords[0].predictionId, expectedPredictionId);

    // Verify user token arrays were updated
    address[] memory userPredictionTokens = getters.userPredictionTokensPaginated(predicter, 0, 10);
    assertEq(userPredictionTokens.length, 1);
    assertEq(userPredictionTokens[0], validSeedsNative.predictionToken);

    address[] memory userStakeTokens = getters.userStakeTokensPaginated(predicter, 0, 10);
    assertEq(userStakeTokens.length, 1);
    assertEq(userStakeTokens[0], validSeedsNative.stakeToken);

    // Verify joined pools tracking
    uint256[] memory joinedPools = getters.userJoinedPoolIdsPaginated(predicter, 0, 10);
    assertEq(joinedPools.length, 1);
    assertEq(joinedPools[0], poolIdNative);
  }

  function testPredictNativeStakeSuccess() public {
    AllPredictionStats memory statsBefore = getters.allStats();
    UserPredictionStats memory userStatsBefore = getters.userStats(predicter);
    uint256 castoraBalBefore = address(castora).balance;
    uint256 predicterBalBefore = address(predicter).balance;
    uint256 predictionPrice = 1500000;
    uint256 expectedPredictionId = 1;

    // successful prediction with expected events
    vm.prank(predicter);
    vm.expectEmit(true, true, true, false);
    emit NewUserPredicted(predicter, poolIdNative, 1);
    vm.expectEmit(true, true, true, true);
    emit Predicted(poolIdNative, expectedPredictionId, predicter, predictionPrice);
    uint256 predictionId = castora.predict{value: 1 ether}(poolIdNative, predictionPrice);
    assertEq(predictionId, expectedPredictionId);
    uint256 castoraBalAfter = address(castora).balance;
    uint256 predicterBalAfter = address(predicter).balance;

    // Verify balances
    assertEq(castoraBalAfter, castoraBalBefore + 1 ether);
    assertEq(predicterBalAfter, predicterBalBefore - 1 ether);

    // Verify prediction data
    Prediction memory prediction = getters.prediction(poolIdNative, predictionId);
    assertEq(prediction.predicter, predicter);
    assertEq(prediction.poolId, poolIdNative);
    assertEq(prediction.predictionId, expectedPredictionId);
    assertEq(prediction.predictionPrice, predictionPrice);
    assertEq(prediction.predictionTime, block.timestamp);
    assertEq(prediction.claimedWinningsTime, 0);
    assertFalse(prediction.isAWinner);

    // Verify global stats
    AllPredictionStats memory statsAfter = getters.allStats();
    assertEq(statsAfter.noOfUsers, statsBefore.noOfUsers + 1);
    assertEq(statsAfter.noOfPredictions, statsBefore.noOfPredictions + 1);

    // Verify user stats
    UserPredictionStats memory userStatsAfter = getters.userStats(predicter);
    assertEq(userStatsAfter.nthUserCount, 1);
    assertEq(userStatsAfter.noOfJoinedPools, userStatsBefore.noOfJoinedPools + 1);
    assertEq(userStatsAfter.noOfPredictions, userStatsBefore.noOfPredictions + 1);

    // Verify pool stats
    Pool memory pool = getters.pool(poolIdNative);
    assertEq(pool.noOfPredictions, 1);

    // Verify stake token details were updated
    StakeTokenDetails memory stakeTokenDetails = getters.stakeTokenDetails(validSeedsNative.stakeToken);
    assertEq(stakeTokenDetails.noOfPredictions, 1);
    assertEq(stakeTokenDetails.totalStaked, 1 ether);

    // Verify prediction token details were updated
    PredictionTokenDetails memory predictionTokenDetails =
      getters.predictionTokenDetails(validSeedsNative.predictionToken);
    assertEq(predictionTokenDetails.noOfPredictions, 1);

    // Verify user-specific token details
    StakeTokenDetails memory userStakeTokenDetails =
      getters.userStakeTokenDetails(predicter, validSeedsNative.stakeToken);
    assertEq(userStakeTokenDetails.noOfPredictions, 1);
    assertEq(userStakeTokenDetails.totalStaked, 1 ether);

    PredictionTokenDetails memory userPredictionTokenDetails =
      getters.userPredictionTokenDetails(predicter, validSeedsNative.predictionToken);
    assertEq(userPredictionTokenDetails.noOfPredictions, 1);

    // more assertions
    _moreAssertionsOnPredictNativeStakeSuccess(expectedPredictionId);
  }

  function testPredictERC20StakeSuccess() public {
    // Approve tokens first
    vm.prank(predicter);
    cusd.approve(address(castora), 1000000);

    AllPredictionStats memory statsBefore = getters.allStats();
    uint256 castoraBalBefore = cusd.balanceOf(address(castora));
    uint256 predicterBalBefore = cusd.balanceOf(predicter);
    uint256 predictionPrice = 1500000;
    uint256 expectedPredictionId = 1;

    vm.prank(predicter);
    vm.expectEmit(true, true, true, false);
    emit NewUserPredicted(predicter, poolIdERC20, statsBefore.noOfUsers + 1);
    vm.expectEmit(true, true, true, true);
    emit Predicted(poolIdERC20, expectedPredictionId, predicter, predictionPrice);
    uint256 predictionId = castora.predict(poolIdERC20, predictionPrice);
    assertEq(predictionId, expectedPredictionId);

    // Verify prediction data
    Prediction memory prediction = getters.prediction(poolIdERC20, predictionId);
    assertEq(prediction.predicter, predicter);
    assertEq(prediction.predictionPrice, predictionPrice);

    // Verify tokens were transferred
    uint256 castoraBalAfter = cusd.balanceOf(address(castora));
    uint256 predicterBalAfter = cusd.balanceOf(predicter);
    assertEq(castoraBalAfter, castoraBalBefore + 1000000);
    assertEq(predicterBalAfter, predicterBalBefore - 1000000);

    // Verify stake token details (this will be the second pool using cUSD as stake token)
    StakeTokenDetails memory stakeTokenDetails = getters.stakeTokenDetails(validSeedsERC20.stakeToken);
    assertEq(stakeTokenDetails.noOfPredictions, 1);
    assertEq(stakeTokenDetails.totalStaked, 1000000);

    // Verify prediction token details (this will be the second pool using cUSD as prediction token)
    PredictionTokenDetails memory predictionTokenDetails =
      getters.predictionTokenDetails(validSeedsERC20.predictionToken);
    assertEq(predictionTokenDetails.noOfPredictions, 1);

    // Verify user-specific token details
    StakeTokenDetails memory userStakeTokenDetails =
      getters.userStakeTokenDetails(predicter, validSeedsERC20.stakeToken);
    assertEq(userStakeTokenDetails.noOfPredictions, 1);
    assertEq(userStakeTokenDetails.totalStaked, 1000000);

    PredictionTokenDetails memory userPredictionTokenDetails =
      getters.userPredictionTokenDetails(predicter, validSeedsERC20.predictionToken);
    assertEq(userPredictionTokenDetails.noOfPredictions, 1);

    // Verify user in pool prediction stats
    UserInPoolPredictionStats memory userInPoolStats = getters.userInPoolPredictionStats(poolIdERC20, predicter);
    assertEq(userInPoolStats.noOfPredictions, 1);
    assertEq(userInPoolStats.noOfWinnings, 0);
    assertEq(userInPoolStats.noOfClaimableWinnings, 0);
    assertEq(userInPoolStats.noOfClaimedWinnings, 0);

    // Verify prediction activity tracking
    PredictionRecord memory expectedRecord = PredictionRecord(poolIdERC20, expectedPredictionId);
    bytes32 recordHash = castora.hashPredictionRecord(expectedRecord);
    PredictionRecord memory actualRecord = getters.predictionRecord(recordHash);
    assertEq(actualRecord.poolId, poolIdERC20);
    assertEq(actualRecord.predictionId, expectedPredictionId);
  }

  function testRevertZeroPredictionsCountBulkPredict() public {
    vm.prank(predicter);
    vm.expectRevert(ZeroAmountSpecified.selector);
    castora.bulkPredict{value: 1 ether}(poolIdNative, 1500000, 0);
  }

  function testRevertInvalidPoolIdBulkPredict() public {
    vm.prank(predicter);
    vm.expectRevert(InvalidPoolId.selector);
    castora.bulkPredict{value: 2 ether}(999, 1500000, 2);
  }

  function testRevertWindowHasClosedBulkPredict() public {
    vm.warp(1000); // Past window close time

    vm.prank(predicter);
    vm.expectRevert(WindowHasClosed.selector);
    castora.bulkPredict{value: 2 ether}(poolIdNative, 1500000, 2);
  }

  function testRevertInsufficientStakeBulkPredict() public {
    vm.prank(predicter);
    vm.expectRevert(InsufficientStakeValue.selector);
    castora.bulkPredict{value: 1 ether}(poolIdNative, 1500000, 2); // Need 2 ether for 2 predictions
  }

  function testRevertIncorrectStakeBulkPredict() public {
    vm.prank(predicter);
    vm.expectRevert(IncorrectStakeValue.selector);
    castora.bulkPredict{value: 5 ether}(poolIdNative, 1500000, 2);
  }

  function testRevertERC20FailureBulkPredict() public {
    // Approve tokens first
    vm.prank(predicter);
    IERC20(address(cusd)).approve(address(castora), 2000000);

    // mock cusd to return false for the token transfer
    vm.mockCall(
      address(cusd),
      abi.encodeWithSelector(IERC20.transferFrom.selector, predicter, address(castora), 2000000),
      abi.encode(false)
    );

    vm.prank(predicter);
    vm.expectRevert(abi.encodeWithSelector(SafeERC20.SafeERC20FailedOperation.selector, address(cusd)));
    castora.bulkPredict(poolIdERC20, 1500000, 2);
  }

  function _moreAssertionsOnBulkPredictNativeStakeSuccess(uint256 predictionsCount) internal view {
    // Verify pool stats
    Pool memory pool = getters.pool(poolIdNative);
    assertEq(pool.noOfPredictions, predictionsCount);

    // Verify stake token details for bulk predictions
    StakeTokenDetails memory stakeTokenDetails = getters.stakeTokenDetails(validSeedsNative.stakeToken);
    assertEq(stakeTokenDetails.noOfPredictions, predictionsCount);
    assertEq(stakeTokenDetails.totalStaked, 1 ether * predictionsCount);

    // Verify user stake token details
    StakeTokenDetails memory userStakeTokenDetails =
      getters.userStakeTokenDetails(predicter, validSeedsNative.stakeToken);
    assertEq(userStakeTokenDetails.noOfPredictions, predictionsCount);
    assertEq(userStakeTokenDetails.totalStaked, 1 ether * predictionsCount);

    // Verify user in pool stats
    UserInPoolPredictionStats memory userInPoolStats = getters.userInPoolPredictionStats(poolIdNative, predicter);
    assertEq(userInPoolStats.noOfPredictions, predictionsCount);

    // Verify all prediction activities were recorded
    PredictionRecord[] memory userRecords = getters.userPredictionRecordsPaginated(predicter, 0, 10);
    assertEq(userRecords.length, predictionsCount);

    // Verify user prediction IDs tracking
    uint256[] memory userPredictionIds = getters.userInPoolPredictionIdsPaginated(poolIdNative, predicter, 0, 10);
    assertEq(userPredictionIds.length, predictionsCount);
    for (uint256 i = 0; i < predictionsCount; i++) {
      assertEq(userPredictionIds[i], i + 1);
    }
  }

  function testBulkPredictNativeStakeSuccess() public {
    AllPredictionStats memory statsBefore = getters.allStats();
    uint256 castoraBalBefore = address(castora).balance;
    uint256 predicterBalBefore = address(predicter).balance;
    uint256 predictionPrice = 1500000;
    uint16 predictionsCount = 3;
    uint256 expectedFirstId = 1;
    uint256 expectedLastId = 3;

    // Expect multiple Predicted events
    vm.expectEmit(true, true, true, false);
    emit NewUserPredicted(predicter, poolIdNative, statsBefore.noOfUsers + 1);
    vm.expectEmit(true, true, true, true);
    emit Predicted(poolIdNative, 1, predicter, predictionPrice);
    vm.expectEmit(true, true, true, true);
    emit Predicted(poolIdNative, 2, predicter, predictionPrice);
    vm.expectEmit(true, true, true, true);
    emit Predicted(poolIdNative, 3, predicter, predictionPrice);
    vm.prank(predicter);
    (uint256 firstId, uint256 lastId) =
      castora.bulkPredict{value: 3 ether}(poolIdNative, predictionPrice, predictionsCount);
    assertEq(firstId, expectedFirstId);
    assertEq(lastId, expectedLastId);

    // Verify all predictions were created
    for (uint256 i = firstId; i <= lastId; i++) {
      Prediction memory prediction = getters.prediction(poolIdNative, i);
      assertEq(prediction.predicter, predicter);
      assertEq(prediction.predictionPrice, predictionPrice);
    }

    // Verify balances
    uint256 castoraBalAfter = address(castora).balance;
    uint256 predicterBalAfter = address(predicter).balance;
    assertEq(castoraBalAfter, castoraBalBefore + 1 ether * predictionsCount);
    assertEq(predicterBalAfter, predicterBalBefore - 1 ether * predictionsCount);

    // Verify global stats
    AllPredictionStats memory statsAfter = getters.allStats();
    assertEq(statsAfter.noOfPredictions, statsBefore.noOfPredictions + predictionsCount);

    PredictionRecord[] memory globalRecords = getters.predictionRecordsPaginated(0, 10);
    assertEq(globalRecords.length, statsAfter.noOfPredictions);
    PredictionRecord memory firstRecord = globalRecords[0];
    assertEq(firstRecord.predictionId, expectedFirstId);
    PredictionRecord memory lastRecord = globalRecords[globalRecords.length - 1];
    assertEq(lastRecord.predictionId, expectedLastId);

    _moreAssertionsOnBulkPredictNativeStakeSuccess(predictionsCount);
  }

  function testBulkPredictERC20StakeSuccess() public {
    // Approve tokens first
    vm.prank(predicter);
    cusd.approve(address(castora), 3000000);
    uint256 castoraBalBefore = cusd.balanceOf(address(castora));
    uint256 predicterBalBefore = cusd.balanceOf(predicter);

    uint256 predictionPrice = 1500000;
    uint16 predictionsCount = 3;
    vm.prank(predicter);
    (uint256 firstId, uint256 lastId) = castora.bulkPredict(poolIdERC20, predictionPrice, predictionsCount);

    assertEq(firstId, 1);
    assertEq(lastId, 3);

    // Verify tokens were transferred
    uint256 castoraBalAfter = cusd.balanceOf(address(castora));
    uint256 predicterBalAfter = cusd.balanceOf(predicter);
    assertEq(castoraBalAfter, castoraBalBefore + 1000000 * predictionsCount);
    assertEq(predicterBalAfter, predicterBalBefore - 1000000 * predictionsCount);

    // Verify stake token details for bulk ERC20 predictions
    StakeTokenDetails memory stakeTokenDetails = getters.stakeTokenDetails(validSeedsERC20.stakeToken);
    assertEq(stakeTokenDetails.noOfPredictions, predictionsCount);
    assertEq(stakeTokenDetails.totalStaked, 1000000 * predictionsCount);

    // Verify user stake token details
    StakeTokenDetails memory userStakeTokenDetails =
      getters.userStakeTokenDetails(predicter, validSeedsERC20.stakeToken);
    assertEq(userStakeTokenDetails.noOfPredictions, predictionsCount);
    assertEq(userStakeTokenDetails.totalStaked, 1000000 * predictionsCount);

    // Verify user in pool stats
    UserInPoolPredictionStats memory userInPoolStats = getters.userInPoolPredictionStats(poolIdERC20, predicter);
    assertEq(userInPoolStats.noOfPredictions, predictionsCount);

    //  Verify all activities were recorded
    PredictionRecord[] memory userRecords = getters.userPredictionRecordsPaginated(predicter, 0, 10);
    assertEq(userRecords.length, predictionsCount);
  }

  function testNewUserPredictedOnlyOnFirstPredict() public {
    // Ensure no users initially
    assertEq(getters.allStats().noOfUsers, 0);
    assertEq(getters.usersPaginated(0, 10).length, 0);

    // First prediction should emit NewUserPredicted
    vm.expectEmit(true, true, true, false);
    emit NewUserPredicted(predicter, poolIdNative, 1);
    vm.prank(predicter);
    castora.predict{value: 1 ether}(poolIdNative, 1500000);
    assertEq(getters.allStats().noOfUsers, 1);
    assertEq(getters.userStats(predicter).nthUserCount, 1);

    // Confirm new user count
    assertEq(getters.allStats().noOfUsers, 1);
    assertEq(getters.usersPaginated(0, 10).length, 1);
    assertEq(getters.usersPaginated(0, 10)[0], predicter);
    assertEq(getters.userStats(predicter).nthUserCount, 1);

    // Second prediction should NOT emit NewUserPredicted
    vm.prank(predicter);
    cusd.approve(address(castora), 1000000);

    vm.recordLogs();
    vm.prank(predicter);
    castora.predict(poolIdERC20, 1600000);

    // Check that NewUserPredicted was not emitted
    Vm.Log[] memory logs = vm.getRecordedLogs();
    bool newUserEventFound = false;
    for (uint256 i = 0; i < logs.length; i++) {
      if (logs[i].topics[0] == keccak256('NewUserPredicted(address,uint256,uint256)')) {
        newUserEventFound = true;
        break;
      }
    }
    assertFalse(newUserEventFound);

    // Confirm new user count remains the same
    assertEq(getters.allStats().noOfUsers, 1);
    assertEq(getters.usersPaginated(0, 10).length, 1);
    assertEq(getters.usersPaginated(0, 10)[0], predicter);
    assertEq(getters.userStats(predicter).nthUserCount, 1);

    // Test same behavior with bulkPredict
    // Give another user tokens
    address anotherNewUser = makeAddr('anotherNewUser');
    vm.deal(anotherNewUser, 10 ether);

    // First bulk predict should emit NewUserPredicted
    vm.prank(anotherNewUser);
    vm.expectEmit(true, true, true, false);
    emit NewUserPredicted(anotherNewUser, poolIdNative, 2);
    castora.bulkPredict{value: 2 ether}(poolIdNative, 1700000, 2);
    assertEq(getters.allStats().noOfUsers, 2);
    assertEq(getters.usersPaginated(0, 10).length, 2);
    assertEq(getters.usersPaginated(0, 10)[1], anotherNewUser);
    assertEq(getters.userStats(anotherNewUser).nthUserCount, 2);

    // Second bulk predict should NOT emit NewUserPredicted
    vm.recordLogs();
    vm.prank(anotherNewUser);
    castora.bulkPredict{value: 1 ether}(poolIdNative, 1800000, 1);

    logs = vm.getRecordedLogs();
    newUserEventFound = false;
    for (uint256 i = 0; i < logs.length; i++) {
      if (logs[i].topics[0] == keccak256('NewUserPredicted(address,uint256,uint256)')) {
        newUserEventFound = true;
        break;
      }
    }
    assertFalse(newUserEventFound);

    // Confirm new user count remains the same
    assertEq(getters.allStats().noOfUsers, 2);
    assertEq(getters.usersPaginated(0, 10).length, 2);
    assertEq(getters.usersPaginated(0, 10)[1], anotherNewUser);
    assertEq(getters.userStats(anotherNewUser).nthUserCount, 2);
  }

  function testGetPredictions() public {
    uint256 predictionPrice = 1500000;

    vm.prank(predicter);
    castora.bulkPredict{value: 3 ether}(poolIdNative, predictionPrice, 3);

    // Verify all predictions were created
    uint256[] memory predictionIds = new uint256[](3);
    predictionIds[0] = 1;
    predictionIds[1] = 2;
    predictionIds[2] = 3;

    Prediction[] memory predictions = getters.predictions(poolIdNative, predictionIds);
    for (uint256 i = 0; i < predictionIds.length; i++) {
      Prediction memory prediction = predictions[i];
      assertEq(prediction.predictionId, predictionIds[i]);
      assertEq(prediction.predicter, predicter);
      assertEq(prediction.predictionPrice, predictionPrice);
    }
  }

  function testRevertsInCastoraGetters() public {
    vm.expectRevert(InvalidAddress.selector);
    new CastoraGetters(address(0));

    vm.expectRevert(InvalidPoolId.selector);
    castora.getPool(0);

    vm.expectRevert(InvalidPoolId.selector);
    castora.getPool(999);

    vm.expectRevert(InvalidRecordHash.selector);
    getters.predictionRecord(bytes32(0));

    vm.expectRevert(InvalidAddress.selector);
    getters.userStats(address(0));

    vm.expectRevert(InvalidAddress.selector);
    getters.userJoinedPoolIdsPaginated(address(0), 0, 10);

    vm.expectRevert(InvalidAddress.selector);
    getters.userPredictionRecordsPaginated(address(0), 0, 10);

    vm.expectRevert(InvalidAddress.selector);
    getters.userWinnerRecordsPaginated(address(0), 0, 10);

    vm.expectRevert(InvalidAddress.selector);
    getters.userClaimableRecordsPaginated(address(0), 0, 10);

    vm.expectRevert(InvalidPoolId.selector);
    getters.pool(0);

    vm.expectRevert(InvalidPoolId.selector);
    getters.pool(999);

    vm.expectRevert(InvalidPoolId.selector);
    getters.prediction(0, 0);

    vm.expectRevert(InvalidPoolId.selector);
    getters.prediction(999, 0);

    vm.expectRevert(InvalidPredictionId.selector);
    getters.prediction(poolIdNative, 0);

    vm.expectRevert(InvalidPredictionId.selector);
    getters.prediction(poolIdNative, 999);

    uint256[] memory pools = new uint256[](1);
    pools[0] = 0;
    vm.expectRevert(InvalidPoolId.selector);
    getters.pools(pools);

    pools[0] = 999;
    vm.expectRevert(InvalidPoolId.selector);
    getters.pools(pools);

    uint256[] memory predictions = new uint256[](1);
    predictions[0] = 0;
    vm.expectRevert(InvalidPoolId.selector);
    getters.predictions(0, predictions);

    vm.expectRevert(InvalidPoolId.selector);
    getters.predictions(999, predictions);

    vm.expectRevert(InvalidPredictionId.selector);
    getters.predictions(poolIdNative, predictions);

    predictions[0] = 999;
    vm.expectRevert(InvalidPredictionId.selector);
    getters.predictions(poolIdNative, predictions);

    vm.expectRevert(InvalidPoolId.selector);
    getters.userInPoolPredictionStats(0, address(0));

    vm.expectRevert(InvalidPoolId.selector);
    getters.userInPoolPredictionStats(999, address(0));

    vm.expectRevert(InvalidAddress.selector);
    getters.userInPoolPredictionStats(poolIdNative, address(0));

    vm.expectRevert(InvalidPoolId.selector);
    getters.userInPoolPredictionIdsPaginated(0, address(0), 0, 10);

    vm.expectRevert(InvalidPoolId.selector);
    getters.userInPoolPredictionIdsPaginated(999, address(0), 0, 10);

    vm.expectRevert(InvalidAddress.selector);
    getters.userInPoolPredictionIdsPaginated(poolIdNative, address(0), 0, 10);

    vm.expectRevert(InvalidPoolId.selector);
    getters.userInPoolWinnerPredictionIdsPaginated(0, address(0), 0, 10);

    vm.expectRevert(InvalidPoolId.selector);
    getters.userInPoolWinnerPredictionIdsPaginated(999, address(0), 0, 10);

    vm.expectRevert(InvalidAddress.selector);
    getters.userInPoolWinnerPredictionIdsPaginated(poolIdNative, address(0), 0, 10);

    vm.expectRevert(InvalidPoolId.selector);
    getters.userInPoolClaimablePredictionIdsPaginated(0, address(0), 0, 10);

    vm.expectRevert(InvalidPoolId.selector);
    getters.userInPoolClaimablePredictionIdsPaginated(999, address(0), 0, 10);

    vm.expectRevert(InvalidAddress.selector);
    getters.userInPoolClaimablePredictionIdsPaginated(poolIdNative, address(0), 0, 10);

    vm.expectRevert(InvalidAddress.selector);
    getters.predictionTokenDetails(address(0));

    vm.expectRevert(InvalidAddress.selector);
    getters.stakeTokenDetails(address(0));

    vm.expectRevert(InvalidAddress.selector);
    getters.userPredictionTokensPaginated(address(0), 0, 10);

    vm.expectRevert(InvalidAddress.selector);
    getters.userStakeTokensPaginated(address(0), 0, 10);

    vm.expectRevert(InvalidAddress.selector);
    getters.userPredictionTokenDetails(address(0), address(0));

    vm.expectRevert(InvalidAddress.selector);
    getters.userPredictionTokenDetails(predicter, address(0));

    vm.expectRevert(InvalidAddress.selector);
    getters.userStakeTokenDetails(address(0), address(0));

    vm.expectRevert(InvalidAddress.selector);
    getters.userStakeTokenDetails(predicter, address(0));
  }
}
