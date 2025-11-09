// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {IERC1967} from '@openzeppelin/contracts/interfaces/IERC1967.sol';
import {ERC1967Proxy} from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {Test, console} from 'forge-std/Test.sol';
import {Castora} from '../src/Castora.sol';
import {CastoraActivities} from '../src/CastoraActivities.sol';
import {CastoraErrors} from '../src/CastoraErrors.sol';
import {CastoraEvents} from '../src/CastoraEvents.sol';
import {CastoraPoolsManager} from '../src/CastoraPoolsManager.sol';
import {CastoraPoolsRules} from '../src/CastoraPoolsRules.sol';
import {CastoraStructs} from '../src/CastoraStructs.sol';
import {cUSD} from '../src/cUSD.sol';

contract CastoraActivitiesTest is CastoraErrors, CastoraEvents, CastoraStructs, Test {
  CastoraActivities activities;
  Castora castora;
  CastoraPoolsManager poolsManager;
  CastoraPoolsRules poolsRules;
  cUSD cusd;

  address owner;
  address feeCollector;
  address admin;
  address user1;
  address user2;
  address user3;
  address unauthorizedContract;

  PoolSeeds validSeedsERC20;
  PoolSeeds validSeedsNative;

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
    owner = address(this);
    feeCollector = makeAddr('feeCollector');
    admin = makeAddr('admin');
    user1 = makeAddr('user1');
    user2 = makeAddr('user2');
    user3 = makeAddr('user3');
    unauthorizedContract = makeAddr('unauthorizedContract');

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

    // Authorize contracts
    activities.setAuthorizedLogger(address(castora), true);
    activities.setAuthorizedLogger(address(poolsManager), true);

    // Grant admin role
    castora.grantAdminRole(admin);
    castora.grantAdminRole(address(poolsManager));

    // Set up pool seeds
    validSeedsERC20 = getPoolSeeds(address(cusd));
    validSeedsNative = getPoolSeeds(address(castora));

    // Configure pools rules
    poolsRules.updateAllowedPredictionToken(address(cusd), true);
    poolsRules.allowStakeToken(address(cusd), 1000000);
    poolsRules.allowStakeToken(address(castora), 1 ether);
    poolsRules.updateAllowedPoolMultiplier(200, true);

    // Configure pool creation fees
    poolsManager.setCreationFees(address(poolsManager), 0.01 ether);

    // Give users tokens and ETH
    cusd.transfer(user1, 10000000);
    cusd.transfer(user2, 10000000);
    cusd.transfer(user3, 10000000);
    vm.deal(user1, 10 ether);
    vm.deal(user2, 10 ether);
    vm.deal(user3, 10 ether);
  }

  // Helper function to validate activity at all 4 levels
  function validateActivityAt4Levels(
    address user,
    ActivityType activityType,
    uint256 expectedGlobalCount,
    uint256 expectedTypeCount,
    uint256 expectedUserCount,
    uint256 expectedUserTypeCount,
    uint256 poolId
  ) internal view {
    // Level 1: Global
    assertEq(activities.noOfActivities(), expectedGlobalCount);
    CastoraActivity[] memory globalActivities = activities.getPaginated(0, 100);
    assertEq(globalActivities.length, expectedGlobalCount);
    if (expectedGlobalCount > 0) {
      CastoraActivity memory lastActivity = globalActivities[expectedGlobalCount - 1];
      assertEq(lastActivity.user, user);
      assertEq(uint256(lastActivity.activityType), uint256(activityType));
      assertEq(lastActivity.poolId, poolId);
    }

    // Level 2: By Type
    assertEq(activities.noOfActivitiesByType(activityType), expectedTypeCount);
    CastoraActivity[] memory typeActivities = activities.getByTypePaginated(activityType, 0, 100);
    assertEq(typeActivities.length, expectedTypeCount);
    if (expectedTypeCount > 0) {
      CastoraActivity memory lastTypeActivity = typeActivities[expectedTypeCount - 1];
      assertEq(uint256(lastTypeActivity.activityType), uint256(activityType));
    }

    // Level 3: For Address
    assertEq(activities.userActivityIdsCount(user), expectedUserCount);
    CastoraActivity[] memory userActivities = activities.getForUserPaginated(user, 0, 100);
    assertEq(userActivities.length, expectedUserCount);
    if (expectedUserCount > 0) {
      CastoraActivity memory lastUserActivity = userActivities[expectedUserCount - 1];
      assertEq(lastUserActivity.user, user);
    }

    // Level 4: For Address By Type
    assertEq(activities.getActivityTypeCountForUser(user, activityType), expectedUserTypeCount);
    CastoraActivity[] memory userTypeActivities = activities.getForUserByTypePaginated(user, activityType, 0, 100);
    assertEq(userTypeActivities.length, expectedUserTypeCount);
    if (expectedUserTypeCount > 0) {
      CastoraActivity memory lastUserTypeActivity = userTypeActivities[expectedUserTypeCount - 1];
      assertEq(lastUserTypeActivity.user, user);
      assertEq(uint256(lastUserTypeActivity.activityType), uint256(activityType));
    }
  }

  function testRevertNotOwnerWhenUpgrading() public {
    address newImplementation = address(new CastoraActivities());
    vm.prank(user1);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user1));
    activities.upgradeToAndCall(newImplementation, '');
  }

  function testUpgradeSuccessWithRetainedData() public {
    // Set up some state before upgrade
    activities.setAuthorizedLogger(user1, true);
    assertTrue(activities.isAuthorizedLogger(user1));

    // Perform upgrade
    address newImplementation = address(new CastoraActivities());
    vm.expectEmit(true, true, true, false);
    emit IERC1967.Upgraded(newImplementation);
    activities.upgradeToAndCall(newImplementation, '');

    // Verify data is retained after upgrade
    assertTrue(activities.isAuthorizedLogger(user1));
    assertEq(activities.owner(), owner);
  }

  function testRevertNotOwnerSetAuthorizedLogger() public {
    vm.prank(user1);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user1));
    activities.setAuthorizedLogger(user1, true);
  }

  function testSetAuthorizedLoggerSuccess() public {
    // Test setting authorization
    assertFalse(activities.isAuthorizedLogger(user1));

    vm.expectEmit(true, false, false, true);
    emit AuthorizedContractUpdated(user1, true);
    activities.setAuthorizedLogger(user1, true);

    assertTrue(activities.isAuthorizedLogger(user1));

    // Test removing authorization
    vm.expectEmit(true, false, false, true);
    emit AuthorizedContractUpdated(user1, false);
    activities.setAuthorizedLogger(user1, false);

    assertFalse(activities.isAuthorizedLogger(user1));

    // Test revert with zero address
    vm.expectRevert(InvalidAddress.selector);
    activities.setAuthorizedLogger(address(0), true);
  }

  function testLogPoolCreated() public {
    uint256 initialGlobal = activities.noOfActivities();
    uint256 initialTypeCount = activities.noOfActivitiesByType(ActivityType.POOL_CREATED);
    uint256 initialUserCount = activities.userActivityIdsCount(admin);
    uint256 initialUserTypeCount = activities.getActivityTypeCountForUser(admin, ActivityType.POOL_CREATED);

    // Admin creates a pool - this should log POOL_CREATED activity
    vm.prank(admin);
    uint256 poolId = castora.createPool(validSeedsERC20);

    // Validate at all 4 levels
    validateActivityAt4Levels(
      admin,
      ActivityType.POOL_CREATED,
      initialGlobal + 1,
      initialTypeCount + 1,
      initialUserCount + 1,
      initialUserTypeCount + 1,
      poolId
    );

    // Verify activity details
    CastoraActivity memory activity = activities.getOne(1);
    assertEq(activity.user, admin);
    assertEq(activity.poolId, poolId);
    assertEq(uint256(activity.activityType), uint256(ActivityType.POOL_CREATED));
    assertEq(activity.sourceContract, address(castora));
    assertTrue(activity.timestamp > 0);
  }

  function testLogUserHasCreatedPool() public {
    // let the user first create a pool to record the new
    // user activity and the user created pool in one call
    vm.prank(user1);
    poolsManager.createPool{value: 0.01 ether}(validSeedsERC20, address(poolsManager));

    // Now test USER_HAS_CREATED_POOL activity logging
    uint256 initialGlobal = activities.noOfActivities();
    uint256 initialTypeCount = activities.noOfActivitiesByType(ActivityType.USER_HAS_CREATED_POOL);
    uint256 initialUserCount = activities.userActivityIdsCount(user1);
    uint256 initialUserTypeCount = activities.getActivityTypeCountForUser(user1, ActivityType.USER_HAS_CREATED_POOL);

    // User creates a pool via PoolsManager
    vm.prank(user1);
    uint256 poolId = poolsManager.createPool{value: 0.01 ether}(validSeedsNative, address(poolsManager));

    // Should log USER_HAS_CREATED_POOL activity
    validateActivityAt4Levels(
      user1,
      ActivityType.USER_HAS_CREATED_POOL,
      initialGlobal + 2, // user created pool and castora's created pool
      initialTypeCount + 1,
      initialUserCount + 1,
      initialUserTypeCount + 1,
      poolId
    );
  }

  function testLogPredicted() public {
    // Create a pool first
    vm.prank(admin);
    uint256 poolId = castora.createPool(validSeedsNative);

    // let the user first predict to record the new
    // user activity and the user made a prediction in one call
    vm.prank(user1);
    castora.predict{value: 1 ether}(poolId, 1500000);

    // Record initial stats
    uint256 initialGlobal = activities.noOfActivities();
    uint256 initialTypeCount = activities.noOfActivitiesByType(ActivityType.PREDICTED);
    uint256 initialUserCount = activities.userActivityIdsCount(user1);
    uint256 initialUserTypeCount = activities.getActivityTypeCountForUser(user1, ActivityType.PREDICTED);

    // User1 makes another prediction - should log PREDICTED
    vm.prank(user1);
    castora.predict{value: 1 ether}(poolId, 1500000);

    // Check PREDICTED activity
    validateActivityAt4Levels(
      user1,
      ActivityType.PREDICTED,
      initialGlobal + 1,
      initialTypeCount + 1,
      initialUserCount + 1,
      initialUserTypeCount + 1,
      poolId
    );
  }

  function testLogPoolCompletionInitiated() public {
    // Create pool and add predictions
    vm.prank(admin);
    uint256 poolId = castora.createPool(validSeedsNative);

    vm.prank(user1);
    castora.predict{value: 1 ether}(poolId, 1500000);

    vm.prank(user2);
    castora.predict{value: 1 ether}(poolId, 1600000);

    // Fast forward past snapshot time
    vm.warp(1300);

    uint256 initialGlobal = activities.noOfActivities();
    uint256 initialTypeCount = activities.noOfActivitiesByType(ActivityType.POOL_COMPLETION_INITIATED);
    uint256 initialUserCount = activities.userActivityIdsCount(admin);
    uint256 initialUserTypeCount = activities.getActivityTypeCountForUser(admin, ActivityType.POOL_COMPLETION_INITIATED);

    // Admin initiates pool completion
    vm.prank(admin);
    castora.initiatePoolCompletion(poolId, 1550000, 1 /* batch size */ );

    // Should log POOL_COMPLETION_INITIATED
    validateActivityAt4Levels(
      admin,
      ActivityType.POOL_COMPLETION_INITIATED,
      initialGlobal + 1,
      initialTypeCount + 1,
      initialUserCount + 1,
      initialUserTypeCount + 1,
      poolId
    );
  }

  function testLogPoolCompleted() public {
    // Set up completed pool scenario
    vm.prank(admin);
    uint256 poolId = castora.createPool(validSeedsNative);

    vm.prank(user1);
    castora.predict{value: 1 ether}(poolId, 1500000);

    vm.prank(user2);
    castora.predict{value: 1 ether}(poolId, 1600000);

    vm.warp(1300);
    vm.startPrank(admin);
    castora.initiatePoolCompletion(poolId, 1550000, 1 /* batch size */ );

    uint256 initialGlobal = activities.noOfActivities();
    uint256 initialTypeCount = activities.noOfActivitiesByType(ActivityType.POOL_COMPLETED);
    uint256 initialUserCount = activities.userActivityIdsCount(admin);
    uint256 initialUserTypeCount = activities.getActivityTypeCountForUser(admin, ActivityType.POOL_COMPLETED);

    // Complete pool processing
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;
    castora.setWinnersInBatch(poolId, winners);
    castora.finalizePoolCompletion(poolId);
    vm.stopPrank();

    // Should log POOL_COMPLETED
    validateActivityAt4Levels(
      admin,
      ActivityType.POOL_COMPLETED,
      initialGlobal + 1,
      initialTypeCount + 1,
      initialUserCount + 1,
      initialUserTypeCount + 1,
      poolId
    );
  }

  function testLogClaimedWinnings() public {
    // Set up scenario where user1 wins
    vm.prank(admin);
    uint256 poolId = castora.createPool(validSeedsNative);

    vm.prank(user1);
    castora.predict{value: 1 ether}(poolId, 1550000); // Close to final price

    vm.prank(user2);
    castora.predict{value: 1 ether}(poolId, 1700000); // Far from final price

    // Complete pool with user1 as winner
    vm.warp(1300);
    vm.startPrank(admin);
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;
    castora.initiatePoolCompletion(poolId, 1550000, 1);
    castora.setWinnersInBatch(poolId, winners);
    castora.finalizePoolCompletion(poolId);
    vm.stopPrank();

    uint256 initialGlobal = activities.noOfActivities();
    uint256 initialTypeCount = activities.noOfActivitiesByType(ActivityType.CLAIMED_WINNINGS);
    uint256 initialUserCount = activities.userActivityIdsCount(user1);
    uint256 initialUserTypeCount = activities.getActivityTypeCountForUser(user1, ActivityType.CLAIMED_WINNINGS);

    // User1 claims winnings
    vm.prank(user1);
    castora.claimWinnings(poolId, 1);

    // Should log CLAIMED_WINNINGS
    validateActivityAt4Levels(
      user1,
      ActivityType.CLAIMED_WINNINGS,
      initialGlobal + 1,
      initialTypeCount + 1,
      initialUserCount + 1,
      initialUserTypeCount + 1,
      poolId
    );
  }

  function testLogClaimedCompletionFees() public {
    // Create pool via PoolsManager (user-created)
    vm.prank(user1);
    cusd.approve(address(poolsManager), 1000000);
    vm.prank(user1);
    uint256 poolId = poolsManager.createPool{value: 0.01 ether}(validSeedsERC20, address(poolsManager));

    // Add predictions
    vm.prank(user2);
    cusd.approve(address(castora), 1000000);
    vm.prank(user2);
    castora.predict(poolId, 1500000);

    vm.prank(user3);
    cusd.approve(address(castora), 1000000);
    vm.prank(user3);
    castora.predict(poolId, 1600000);

    // Complete pool
    vm.warp(1300);
    vm.startPrank(admin);
    uint256[] memory winners = new uint256[](1);
    winners[0] = 1;
    castora.initiatePoolCompletion(poolId, 1550000, 1);
    castora.setWinnersInBatch(poolId, winners);
    castora.finalizePoolCompletion(poolId);
    vm.stopPrank();

    uint256 initialGlobal = activities.noOfActivities();
    uint256 initialTypeCount = activities.noOfActivitiesByType(ActivityType.CLAIMED_COMPLETION_FEES);
    uint256 initialUserCount = activities.userActivityIdsCount(user1);
    uint256 initialUserTypeCount = activities.getActivityTypeCountForUser(user1, ActivityType.CLAIMED_COMPLETION_FEES);

    // Pool creator claims completion fees
    vm.prank(user1);
    poolsManager.claimPoolCompletionFees(poolId);

    // Should log CLAIMED_COMPLETION_FEES
    validateActivityAt4Levels(
      user1,
      ActivityType.CLAIMED_COMPLETION_FEES,
      initialGlobal + 1,
      initialTypeCount + 1,
      initialUserCount + 1,
      initialUserTypeCount + 1,
      poolId
    );
  }

  function testTimeRangesPaginated() public {
    // Create multiple activities across different time periods
    vm.warp(0);
    uint256 startTime = 0;

    // Time period 1: Create pools
    vm.prank(admin);
    uint256 pool1 = castora.createPool(validSeedsNative);

    vm.warp(100);
    vm.prank(admin);
    uint256 pool2 = castora.createPool(validSeedsERC20);

    // Time period 2: Users make predictions
    vm.warp(200);
    uint256 midTime = 200;
    vm.prank(user1);
    castora.predict{value: 1 ether}(pool1, 1500000);

    vm.prank(user2);
    cusd.approve(address(castora), 1000000);
    vm.prank(user2);
    castora.predict(pool2, 1600000);

    vm.warp(300);
    vm.prank(user3);
    castora.predict{value: 1 ether}(pool1, 1700000);

    vm.warp(400);
    uint256 endTime = 450;

    // Test global time range queries
    CastoraActivity[] memory activitiesInRange = activities.getByTimeRangePaginated(startTime, endTime, 0, 10);
    assertTrue(activitiesInRange.length > 0);

    // Test activities only in first period
    CastoraActivity[] memory firstPeriodActivities = activities.getByTimeRangePaginated(startTime, midTime, 0, 10);
    assertEq(firstPeriodActivities.length, 2); // 2 pool creations

    // Test by type time range
    CastoraActivity[] memory poolCreatedInRange =
      activities.getByTypeByTimeRangePaginated(ActivityType.POOL_CREATED, startTime, midTime, 0, 10);
    assertEq(poolCreatedInRange.length, 2);

    // Test by type time range second period
    CastoraActivity[] memory predictedInRange =
      activities.getByTypeByTimeRangePaginated(ActivityType.PREDICTED, 250, endTime, 0, 10);
    assertEq(predictedInRange.length, 1);

    // Test user time range
    CastoraActivity[] memory user1ActivitiesInRange =
      activities.getForUserByTimeRangePaginated(user1, startTime, endTime, 0, 10);
    assertEq(user1ActivitiesInRange.length, 2); // NEW_USER_ACTIVITY + PREDICTED

    // Test user by type time range
    CastoraActivity[] memory user1PredictedInRange =
      activities.getForUserByTypeByTimeRangePaginated(user1, ActivityType.PREDICTED, startTime, endTime, 0, 10);
    assertEq(user1PredictedInRange.length, 1);

    // Test edge cases
    // Empty range
    CastoraActivity[] memory emptyRange = activities.getByTimeRangePaginated(endTime + 100, endTime + 200, 0, 10);
    assertEq(emptyRange.length, 0);

    // Invalid range (start > end)
    vm.expectRevert(InvalidTimeRange.selector);
    activities.getByTimeRangePaginated(endTime, startTime, 0, 10);

    // Offset beyond available activities
    CastoraActivity[] memory beyondOffset = activities.getByTimeRangePaginated(startTime, endTime, 100, 10);
    assertEq(beyondOffset.length, 0);
    beyondOffset = activities.getByTypeByTimeRangePaginated(ActivityType.PREDICTED, startTime, endTime, 100, 10);
    assertEq(beyondOffset.length, 0);
  }

  function testRecentsPaginated() public {
    // Create several activities
    vm.prank(admin);
    uint256 pool1 = castora.createPool(validSeedsNative);

    vm.prank(admin);
    uint256 pool2 = castora.createPool(validSeedsERC20);

    vm.prank(user1);
    castora.predict{value: 1 ether}(pool1, 1500000);

    vm.prank(user2);
    cusd.approve(address(castora), 1000000);
    vm.prank(user2);
    castora.predict(pool2, 1600000);

    // ensure getActivities works correctly
    uint256[] memory ids = new uint256[](2);
    ids[0] = 1;
    ids[1] = 2;
    assertEq(activities.getMany(ids).length, 2);

    // Test global recent activities
    CastoraActivity[] memory recentGlobal = activities.getRecentActivities(3);
    assertEq(recentGlobal.length, 3);
    // Should be in chronological order (most recent last)
    assertTrue(recentGlobal[2].timestamp >= recentGlobal[1].timestamp);
    assertTrue(recentGlobal[1].timestamp >= recentGlobal[0].timestamp);

    // Test recent by type
    CastoraActivity[] memory recentPoolCreated = activities.getRecentActivitiesByType(ActivityType.POOL_CREATED, 4);
    assertEq(recentPoolCreated.length, 2);
    for (uint256 i = 0; i < recentPoolCreated.length; i++) {
      assertEq(uint256(recentPoolCreated[i].activityType), uint256(ActivityType.POOL_CREATED));
    }

    // Test recent for address
    CastoraActivity[] memory recentUser1 = activities.getRecentActivitiesForUser(user1, 5);
    assertEq(recentUser1.length, 2); // NEW_USER_ACTIVITY + PREDICTED
    for (uint256 i = 0; i < recentUser1.length; i++) {
      assertEq(recentUser1[i].user, user1);
    }

    // Test recent for address by type
    CastoraActivity[] memory recentUser2Predicted =
      activities.getRecentActivitiesForUserByType(user2, ActivityType.PREDICTED, 5);
    assertEq(recentUser2Predicted.length, 1);
    assertEq(recentUser2Predicted[0].user, user2);
    assertEq(uint256(recentUser2Predicted[0].activityType), uint256(ActivityType.PREDICTED));

    // Test edge cases for recents
    // More than available
    CastoraActivity[] memory moreThanAvailable = activities.getRecentActivities(100);
    assertTrue(moreThanAvailable.length <= activities.noOfActivities());

    // Zero limit
    CastoraActivity[] memory zeroLimit = activities.getRecentActivities(0);
    assertEq(zeroLimit.length, 0);

    // User with no activities
    CastoraActivity[] memory noActivities = activities.getRecentActivitiesForUser(user3, 5);
    assertEq(noActivities.length, 0);
  }

  function testRevertsInActivitiesGetters() public {
    // Test getActivity with invalid IDs
    vm.expectRevert(InvalidActivityId.selector);
    activities.getOne(0);

    vm.expectRevert(InvalidActivityId.selector);
    activities.getOne(999);

    // Test getActivities with invalid IDs
    uint256[] memory invalidIds = new uint256[](2);
    invalidIds[0] = 0;
    invalidIds[1] = 1;
    vm.expectRevert(InvalidActivityId.selector);
    activities.getMany(invalidIds);

    // Test address-related functions with zero address
    vm.expectRevert(InvalidAddress.selector);
    activities.getForUserPaginated(address(0), 0, 10);

    vm.expectRevert(InvalidAddress.selector);
    activities.getForUserByTypePaginated(address(0), ActivityType.POOL_CREATED, 0, 10);

    vm.expectRevert(InvalidAddress.selector);
    activities.getActivityTypeCountForUser(address(0), ActivityType.POOL_CREATED);

    vm.expectRevert(InvalidAddress.selector);
    activities.getRecentActivitiesForUser(address(0), 5);

    vm.expectRevert(InvalidAddress.selector);
    activities.getRecentActivitiesForUserByType(address(0), ActivityType.POOL_CREATED, 5);

    // Test time range functions with invalid ranges
    vm.expectRevert(InvalidTimeRange.selector);
    activities.getByTimeRangePaginated(100, 50, 0, 10);

    vm.expectRevert(InvalidTimeRange.selector);
    activities.getByTypeByTimeRangePaginated(ActivityType.POOL_CREATED, 100, 50, 0, 10);

    // Test log function access control and validation
    vm.prank(unauthorizedContract);
    vm.expectRevert(UnauthorizedActivityLogger.selector);
    activities.log(1, user1, ActivityType.POOL_CREATED, 1);

    // Test log with invalid parameters (as authorized contract)
    vm.prank(address(castora));
    vm.expectRevert(InvalidPoolId.selector);
    activities.log(0, user1, ActivityType.POOL_CREATED, 1);

    vm.prank(address(castora));
    vm.expectRevert(InvalidAddress.selector);
    activities.log(1, address(0), ActivityType.POOL_CREATED, 1);

    vm.prank(address(castora));
    vm.expectRevert(InvalidActivityId.selector);
    activities.log(1, user1, ActivityType.POOL_CREATED, 0);
  }
}
