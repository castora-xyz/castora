// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {ERC1967Proxy} from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import {Test} from 'forge-std/Test.sol';
import {Castora} from '../src/Castora.sol';
import {CastoraErrors} from '../src/CastoraErrors.sol';
import {CastoraEvents} from '../src/CastoraEvents.sol';
import {CastoraPoolsRules} from '../src/CastoraPoolsRules.sol';
import {CastoraStructs} from '../src/CastoraStructs.sol';
import {cUSD} from '../src/cUSD.sol';

contract CastoraPoolsRulesTest is CastoraErrors, CastoraEvents, CastoraStructs, Test {
  CastoraPoolsRules rules;
  cUSD cusd;
  address owner;
  address user;
  address mockToken;
  PoolSeeds validSeeds;
  PoolSeeds invalidSeeds;

  function setUp() public {
    owner = address(this);
    user = makeAddr('user');
    mockToken = makeAddr('mockToken');

    rules = CastoraPoolsRules(payable(address(new ERC1967Proxy(address(new CastoraPoolsRules()), ''))));
    rules.initialize();
    cusd = new cUSD();

    // Initialize valid pool seeds for testing
    validSeeds = PoolSeeds({
      predictionToken: mockToken,
      stakeToken: address(cusd),
      stakeAmount: 1000000,
      snapshotTime: 1200 * 300, // Multiple of 5 minutes, later than window close
      windowCloseTime: 1000 * 300, // Multiple of 5 minutes
      feesPercent: 500,
      multiplier: 200,
      isUnlisted: false
    });

    // Initialize invalid pool seeds for testing
    invalidSeeds = PoolSeeds({
      predictionToken: mockToken,
      stakeToken: address(cusd),
      stakeAmount: 1000000,
      snapshotTime: 1000 * 300, // Earlier than window close
      windowCloseTime: 1200 * 300, // Later than snapshot time
      feesPercent: 500,
      multiplier: 200,
      isUnlisted: false
    });
  }

  function testDeployment() public view {
    assertEq(rules.owner(), owner);
    assertEq(rules.requiredTimeInterval(), 5 * 60); // 5 minutes default
  }

  function testUpdateAllowedStakeToken() public {
    // Initially not allowed
    assertFalse(rules.allowedStakeTokens(address(cusd)));
    assertEq(rules.everAllowedStakeTokensCount(), 0);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 0);

    // Set to allowed
    vm.expectEmit(true, false, false, true);
    emit UpdatedAllowedStakeToken(address(cusd), true);
    rules.updateAllowedStakeToken(address(cusd), true);
    assertTrue(rules.allowedStakeTokens(address(cusd)));
    assertEq(rules.everAllowedStakeTokensCount(), 1);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 1);
    assertTrue(rules.hasEverBeenAllowedStakeToken(address(cusd)));

    // Set back to not allowed
    vm.expectEmit(true, false, false, true);
    emit UpdatedAllowedStakeToken(address(cusd), false);
    rules.updateAllowedStakeToken(address(cusd), false);
    assertFalse(rules.allowedStakeTokens(address(cusd)));
    assertEq(rules.everAllowedStakeTokensCount(), 1); // Should remain in ever allowed
    assertEq(rules.currentlyAllowedStakeTokensCount(), 0); // Should be removed from currently allowed
    assertTrue(rules.hasEverBeenAllowedStakeToken(address(cusd))); // Should still be marked as ever allowed
  }

  function testRevertUpdateAllowedStakeTokenNotOwner() public {
    vm.prank(user);
    vm.expectRevert();
    rules.updateAllowedStakeToken(address(cusd), true);
  }

  function testRevertUpdateAllowedStakeTokenAddressZero() public {
    vm.expectRevert(InvalidAddress.selector);
    rules.updateAllowedStakeToken(address(0), true);
  }

  function testUpdateAllowedPredictionToken() public {
    // Initially not allowed
    assertFalse(rules.allowedPredictionTokens(address(cusd)));
    assertEq(rules.everAllowedPredictionTokensCount(), 0);
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 0);

    // Set to allowed
    vm.expectEmit(true, false, false, true);
    emit UpdatedAllowedPredictionToken(address(cusd), true);
    rules.updateAllowedPredictionToken(address(cusd), true);
    assertTrue(rules.allowedPredictionTokens(address(cusd)));
    assertEq(rules.everAllowedPredictionTokensCount(), 1);
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 1);
    assertTrue(rules.hasEverBeenAllowedPredictionToken(address(cusd)));

    // Set back to not allowed
    vm.expectEmit(true, false, false, true);
    emit UpdatedAllowedPredictionToken(address(cusd), false);
    rules.updateAllowedPredictionToken(address(cusd), false);
    assertFalse(rules.allowedPredictionTokens(address(cusd)));
    assertEq(rules.everAllowedPredictionTokensCount(), 1); // Should remain in ever allowed
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 0); // Should be removed from currently allowed
    assertTrue(rules.hasEverBeenAllowedPredictionToken(address(cusd))); // Should still be marked as ever allowed
  }

  function testRevertUpdateAllowedPredictionTokenNotOwner() public {
    vm.prank(user);
    vm.expectRevert();
    rules.updateAllowedPredictionToken(address(cusd), true);
  }

  function testRevertUpdateAllowedPredictionTokenAddressZero() public {
    vm.expectRevert(InvalidAddress.selector);
    rules.updateAllowedPredictionToken(address(0), true);
  }

  function testUpdateAllowedStakeAmount() public {
    uint256 amount = 1000000;

    // Initially not allowed
    assertFalse(rules.allowedStakeAmounts(address(cusd), amount));

    // Set to allowed
    vm.expectEmit(true, false, false, true);
    emit UpdatedAllowedStakeAmount(address(cusd), amount, true);
    rules.updateAllowedStakeAmount(address(cusd), amount, true);
    assertTrue(rules.allowedStakeAmounts(address(cusd), amount));

    // Set back to not allowed
    vm.expectEmit(true, false, false, true);
    emit UpdatedAllowedStakeAmount(address(cusd), amount, false);
    rules.updateAllowedStakeAmount(address(cusd), amount, false);
    assertFalse(rules.allowedStakeAmounts(address(cusd), amount));
  }

  function testRevertUpdateAllowedStakeAmountNotOwner() public {
    vm.prank(user);
    vm.expectRevert();
    rules.updateAllowedStakeAmount(address(cusd), 1000000, true);
  }

  function testValidatePoolTimesSuccess() public view {
    // Test valid times (both on 5-minute intervals, snapshot >= window close)
    uint256 windowCloseTime = 1000 * 300; // Multiple of 5 minutes
    uint256 snapshotTime = 1200 * 300; // Multiple of 5 minutes, later than window close

    // Should not revert
    rules.validatePoolTimes(windowCloseTime, snapshotTime);
  }

  function testValidatePoolTimesEqualTimes() public view {
    // Test valid times when they are equal
    uint256 time = 1000 * 300; // Multiple of 5 minutes

    // Should not revert
    rules.validatePoolTimes(time, time);
  }

  function testRevertValidatePoolTimesSnapshotBeforeWindow() public {
    uint256 windowCloseTime = 1200 * 300; // Multiple of 5 minutes
    uint256 snapshotTime = 1000 * 300; // Multiple of 5 minutes, but earlier than window close

    vm.expectRevert(InvalidPoolTimes.selector);
    rules.validatePoolTimes(windowCloseTime, snapshotTime);
  }

  function testRevertValidatePoolTimesInvalidWindowInterval() public {
    uint256 windowCloseTime = 1000 * 300 + 60; // Not a multiple of 5 minutes
    uint256 snapshotTime = 1200 * 300; // Multiple of 5 minutes

    vm.expectRevert(InvalidPoolTimeInterval.selector);
    rules.validatePoolTimes(windowCloseTime, snapshotTime);
  }

  function testRevertValidatePoolTimesInvalidSnapshotInterval() public {
    uint256 windowCloseTime = 1000 * 300; // Multiple of 5 minutes
    uint256 snapshotTime = 1200 * 300 + 120; // Not a multiple of 5 minutes

    vm.expectRevert(InvalidPoolTimeInterval.selector);
    rules.validatePoolTimes(windowCloseTime, snapshotTime);
  }

  function testRevertValidatePoolTimesBothInvalidIntervals() public {
    uint256 windowCloseTime = 1000 * 300 + 60; // Not a multiple of 5 minutes
    uint256 snapshotTime = 1200 * 300 + 120; // Not a multiple of 5 minutes

    vm.expectRevert(InvalidPoolTimeInterval.selector);
    rules.validatePoolTimes(windowCloseTime, snapshotTime);
  }

  function testValidateStakeTokenSuccess() public {
    // Allow the token first
    rules.updateAllowedStakeToken(address(cusd), true);

    // Should not revert
    rules.validateStakeToken(address(cusd));
  }

  function testRevertValidateStakeTokenNotAllowed() public {
    // Token is not allowed by default
    vm.expectRevert(StakeTokenNotAllowed.selector);
    rules.validateStakeToken(address(cusd));
  }

  function testValidatePredictionTokenSuccess() public {
    // Allow the token first
    rules.updateAllowedPredictionToken(address(cusd), true);

    // Should not revert
    rules.validatePredictionToken(address(cusd));
  }

  function testRevertValidatePredictionTokenNotAllowed() public {
    // Token is not allowed by default
    vm.expectRevert(PredictionTokenNotAllowed.selector);
    rules.validatePredictionToken(address(cusd));
  }

  function testValidateStakeAmountSuccess() public {
    uint256 amount = 1000000;

    // Allow the amount first
    rules.updateAllowedStakeAmount(address(cusd), amount, true);

    // Should not revert
    rules.validateStakeAmount(address(cusd), amount);
  }

  function testRevertValidateStakeAmountNotAllowed() public {
    uint256 amount = 1000000;

    // Amount is not allowed by default
    vm.expectRevert(StakeAmountNotAllowed.selector);
    rules.validateStakeAmount(address(cusd), amount);
  }

  function testUpdateRequiredTimeInterval() public {
    uint256 newInterval = 10 * 60; // 10 minutes
    uint256 oldInterval = rules.requiredTimeInterval();

    // Update the interval
    vm.expectEmit(true, false, false, true);
    emit UpdatedRequiredTimeInterval(oldInterval, newInterval);
    rules.updateRequiredTimeInterval(newInterval);

    // Verify the change
    assertEq(rules.requiredTimeInterval(), newInterval);
  }

  function testUpdateRequiredTimeIntervalToZero() public {
    uint256 newInterval = 0;
    uint256 oldInterval = rules.requiredTimeInterval();

    // Update the interval to zero (should be allowed now)
    vm.expectEmit(true, false, false, true);
    emit UpdatedRequiredTimeInterval(oldInterval, newInterval);
    rules.updateRequiredTimeInterval(newInterval);

    // Verify the change
    assertEq(rules.requiredTimeInterval(), newInterval);
  }

  function testRevertUpdateRequiredTimeIntervalNotOwner() public {
    vm.prank(user);
    vm.expectRevert();
    rules.updateRequiredTimeInterval(10 * 60);
  }

  function testValidatePoolTimesWithCustomInterval() public {
    // Update to 10-minute intervals
    rules.updateRequiredTimeInterval(10 * 60);

    // Test valid times (both on 10-minute intervals)
    uint256 windowCloseTime = 1000 * 600; // Multiple of 10 minutes
    uint256 snapshotTime = 1200 * 600; // Multiple of 10 minutes, later than window close

    // Should not revert
    rules.validatePoolTimes(windowCloseTime, snapshotTime);
  }

  function testRevertValidatePoolTimesWithCustomInterval() public {
    // Update to 10-minute intervals
    rules.updateRequiredTimeInterval(10 * 60);

    // Test invalid times (not on 10-minute intervals)
    uint256 windowCloseTime = 1000 * 300 + 60; // 5 min multiple + 1 min = not 10 min multiple
    uint256 snapshotTime = 1200 * 600; // Multiple of 10 minutes

    vm.expectRevert(InvalidPoolTimeInterval.selector);
    rules.validatePoolTimes(windowCloseTime, snapshotTime);
  }

  function testValidatePoolTimesWithZeroInterval() public {
    // Set interval to zero (no time restrictions)
    rules.updateRequiredTimeInterval(0);

    // Test times that would be invalid with non-zero interval
    uint256 windowCloseTime = 1000 * 300 + 60; // Not on any specific interval
    uint256 snapshotTime = 1200 * 300 + 120; // Not on any specific interval

    // Should not revert since interval checking is disabled
    rules.validatePoolTimes(windowCloseTime, snapshotTime);
  }

  function testRevertValidatePoolTimesWithNonZeroInterval() public {
    // Ensure interval is non-zero (default 5 minutes)
    assertEq(rules.requiredTimeInterval(), 5 * 60);

    // Test times that are not on 5-minute intervals
    uint256 windowCloseTime = 1000 * 300 + 60; // 5 min multiple + 1 min = invalid
    uint256 snapshotTime = 1200 * 300; // Valid 5 min multiple

    vm.expectRevert(InvalidPoolTimeInterval.selector);
    rules.validatePoolTimes(windowCloseTime, snapshotTime);
  }

  // Tests for boolean validation functions
  function testIsValidPoolTimesSuccess() public view {
    uint256 windowCloseTime = 1000 * 300; // Multiple of 5 minutes
    uint256 snapshotTime = 1200 * 300; // Multiple of 5 minutes, later than window close

    assertTrue(rules.isValidPoolTimes(windowCloseTime, snapshotTime));
  }

  function testIsValidPoolTimesEqualTimes() public view {
    uint256 time = 1000 * 300; // Multiple of 5 minutes

    assertTrue(rules.isValidPoolTimes(time, time));
  }

  function testIsValidPoolTimesSnapshotBeforeWindow() public view {
    uint256 windowCloseTime = 1200 * 300; // Multiple of 5 minutes
    uint256 snapshotTime = 1000 * 300; // Multiple of 5 minutes, but earlier than window close

    assertFalse(rules.isValidPoolTimes(windowCloseTime, snapshotTime));
  }

  function testIsValidPoolTimesInvalidWindowInterval() public view {
    uint256 windowCloseTime = 1000 * 300 + 60; // Not a multiple of 5 minutes
    uint256 snapshotTime = 1200 * 300; // Multiple of 5 minutes

    assertFalse(rules.isValidPoolTimes(windowCloseTime, snapshotTime));
  }

  function testIsValidPoolTimesInvalidSnapshotInterval() public view {
    uint256 windowCloseTime = 1000 * 300; // Multiple of 5 minutes
    uint256 snapshotTime = 1200 * 300 + 120; // Not a multiple of 5 minutes

    assertFalse(rules.isValidPoolTimes(windowCloseTime, snapshotTime));
  }

  function testIsValidPoolTimesWithZeroInterval() public {
    // Set interval to zero (no time restrictions)
    rules.updateRequiredTimeInterval(0);

    uint256 windowCloseTime = 1000 * 300 + 60; // Not on any specific interval
    uint256 snapshotTime = 1200 * 300 + 120; // Not on any specific interval

    assertTrue(rules.isValidPoolTimes(windowCloseTime, snapshotTime));
  }

  function testIsValidStakeTokenAllowed() public {
    rules.updateAllowedStakeToken(address(cusd), true);
    assertTrue(rules.isValidStakeToken(address(cusd)));
  }

  function testIsValidStakeTokenNotAllowed() public view {
    assertFalse(rules.isValidStakeToken(address(cusd)));
  }

  function testIsValidPredictionTokenAllowed() public {
    rules.updateAllowedPredictionToken(address(cusd), true);
    assertTrue(rules.isValidPredictionToken(address(cusd)));
  }

  function testIsValidPredictionTokenNotAllowed() public view {
    assertFalse(rules.isValidPredictionToken(address(cusd)));
  }

  function testIsValidStakeAmountAllowed() public {
    uint256 amount = 1000000;
    rules.updateAllowedStakeAmount(address(cusd), amount, true);
    assertTrue(rules.isValidStakeAmount(address(cusd), amount));
  }

  function testIsValidStakeAmountNotAllowed() public view {
    uint256 amount = 1000000;
    assertFalse(rules.isValidStakeAmount(address(cusd), amount));
  }

  function testValidateCreatePoolSuccess() public {
    // Set up all required allowances
    rules.updateAllowedStakeToken(validSeeds.stakeToken, true);
    rules.updateAllowedPredictionToken(validSeeds.predictionToken, true);
    rules.updateAllowedStakeAmount(validSeeds.stakeToken, validSeeds.stakeAmount, true);
    rules.updateAllowedPoolMultiplier(validSeeds.multiplier, true);

    // Should not revert
    rules.validateCreatePool(validSeeds);
  }

  function testRevertValidateCreatePoolStakeTokenNotAllowed() public {
    // Set up other allowances but not stake token
    rules.updateAllowedPredictionToken(validSeeds.predictionToken, true);
    rules.updateAllowedStakeAmount(validSeeds.stakeToken, validSeeds.stakeAmount, true);

    vm.expectRevert(StakeTokenNotAllowed.selector);
    rules.validateCreatePool(validSeeds);
  }

  function testRevertValidateCreatePoolPredictionTokenNotAllowed() public {
    // Set up other allowances but not prediction token
    rules.updateAllowedStakeToken(validSeeds.stakeToken, true);
    rules.updateAllowedStakeAmount(validSeeds.stakeToken, validSeeds.stakeAmount, true);

    vm.expectRevert(PredictionTokenNotAllowed.selector);
    rules.validateCreatePool(validSeeds);
  }

  function testRevertValidateCreatePoolStakeAmountNotAllowed() public {
    // Set up other allowances but not stake amount
    rules.updateAllowedStakeToken(validSeeds.stakeToken, true);
    rules.updateAllowedPredictionToken(validSeeds.predictionToken, true);

    vm.expectRevert(StakeAmountNotAllowed.selector);
    rules.validateCreatePool(validSeeds);
  }

  function testRevertValidateCreatePoolInvalidTimes() public {
    // Set up all allowances
    rules.updateAllowedStakeToken(invalidSeeds.stakeToken, true);
    rules.updateAllowedPredictionToken(invalidSeeds.predictionToken, true);
    rules.updateAllowedStakeAmount(invalidSeeds.stakeToken, invalidSeeds.stakeAmount, true);

    vm.expectRevert(InvalidPoolTimes.selector);
    rules.validateCreatePool(invalidSeeds);
  }

  function testRevertValidateCreatePoolInvalidTimeInterval() public {
    // Create seeds with invalid time intervals
    PoolSeeds memory invalidIntervalSeeds = PoolSeeds({
      predictionToken: mockToken,
      stakeToken: address(cusd),
      stakeAmount: 1000000,
      snapshotTime: 1200 * 300 + 120, // Not on 5-min interval
      windowCloseTime: 1000 * 300, // On 5-min interval
      feesPercent: 500,
      multiplier: 200,
      isUnlisted: false
    });

    // Set up all allowances
    rules.updateAllowedStakeToken(invalidIntervalSeeds.stakeToken, true);
    rules.updateAllowedPredictionToken(invalidIntervalSeeds.predictionToken, true);
    rules.updateAllowedStakeAmount(invalidIntervalSeeds.stakeToken, invalidIntervalSeeds.stakeAmount, true);

    vm.expectRevert(InvalidPoolTimeInterval.selector);
    rules.validateCreatePool(invalidIntervalSeeds);
  }

  function testIsValidCreatePoolSuccess() public {
    // Set up all required allowances
    rules.updateAllowedStakeToken(validSeeds.stakeToken, true);
    rules.updateAllowedPredictionToken(validSeeds.predictionToken, true);
    rules.updateAllowedStakeAmount(validSeeds.stakeToken, validSeeds.stakeAmount, true);
    rules.updateAllowedPoolMultiplier(validSeeds.multiplier, true);

    assertTrue(rules.isValidCreatePool(validSeeds));
  }

  function testIsValidCreatePoolStakeTokenNotAllowed() public {
    // Set up other allowances but not stake token
    rules.updateAllowedPredictionToken(validSeeds.predictionToken, true);
    rules.updateAllowedStakeAmount(validSeeds.stakeToken, validSeeds.stakeAmount, true);

    assertFalse(rules.isValidCreatePool(validSeeds));
  }

  function testIsValidCreatePoolPredictionTokenNotAllowed() public {
    // Set up other allowances but not prediction token
    rules.updateAllowedStakeToken(validSeeds.stakeToken, true);
    rules.updateAllowedStakeAmount(validSeeds.stakeToken, validSeeds.stakeAmount, true);

    assertFalse(rules.isValidCreatePool(validSeeds));
  }

  function testIsValidCreatePoolStakeAmountNotAllowed() public {
    // Set up other allowances but not stake amount
    rules.updateAllowedStakeToken(validSeeds.stakeToken, true);
    rules.updateAllowedPredictionToken(validSeeds.predictionToken, true);

    assertFalse(rules.isValidCreatePool(validSeeds));
  }

  function testIsValidCreatePoolInvalidTimes() public {
    // Set up all allowances
    rules.updateAllowedStakeToken(invalidSeeds.stakeToken, true);
    rules.updateAllowedPredictionToken(invalidSeeds.predictionToken, true);
    rules.updateAllowedStakeAmount(invalidSeeds.stakeToken, invalidSeeds.stakeAmount, true);

    assertFalse(rules.isValidCreatePool(invalidSeeds));
  }

  function testIsValidCreatePoolInvalidTimeInterval() public {
    // Create seeds with invalid time intervals
    PoolSeeds memory invalidIntervalSeeds = PoolSeeds({
      predictionToken: mockToken,
      stakeToken: address(cusd),
      stakeAmount: 1000000,
      snapshotTime: 1200 * 300 + 120, // Not on 5-min interval
      windowCloseTime: 1000 * 300, // On 5-min interval
      feesPercent: 500,
      multiplier: 200,
      isUnlisted: false
    });

    // Set up all allowances
    rules.updateAllowedStakeToken(invalidIntervalSeeds.stakeToken, true);
    rules.updateAllowedPredictionToken(invalidIntervalSeeds.predictionToken, true);
    rules.updateAllowedStakeAmount(invalidIntervalSeeds.stakeToken, invalidIntervalSeeds.stakeAmount, true);

    assertFalse(rules.isValidCreatePool(invalidIntervalSeeds));
  }

  function testRevertWhenNotOwnerUpgrading() public {
    address impl = address(new CastoraPoolsRules());
    vm.prank(user);
    vm.expectRevert();
    rules.upgradeToAndCall(impl, '');
  }

  function testUpgrade() public {
    // Store initial state
    uint256 initialTimeInterval = rules.requiredTimeInterval();
    address initialOwner = rules.owner();

    // Allow some tokens and amounts
    rules.updateAllowedStakeToken(address(cusd), true);
    rules.updateAllowedPredictionToken(mockToken, true);
    rules.updateAllowedStakeAmount(address(cusd), 1000000, true);

    // Verify initial state
    assertTrue(rules.allowedStakeTokens(address(cusd)));
    assertTrue(rules.allowedPredictionTokens(mockToken));
    assertTrue(rules.allowedStakeAmounts(address(cusd), 1000000));

    // Deploy new implementation
    address newImpl = address(new CastoraPoolsRules());

    // Upgrade the contract
    rules.upgradeToAndCall(newImpl, '');

    // Verify state is preserved after upgrade
    assertEq(rules.requiredTimeInterval(), initialTimeInterval);
    assertEq(rules.owner(), initialOwner);
    assertTrue(rules.allowedStakeTokens(address(cusd)));
    assertTrue(rules.allowedPredictionTokens(mockToken));
    assertTrue(rules.allowedStakeAmounts(address(cusd), 1000000));

    // Verify functionality still works after upgrade
    rules.updateRequiredTimeInterval(10 * 60); // 10 minutes
    assertEq(rules.requiredTimeInterval(), 10 * 60);
  }

  // Tests for tracking ever allowed and currently allowed tokens
  function testTrackingEverAllowedStakeTokens() public {
    address token1 = makeAddr('token1');
    address token2 = makeAddr('token2');
    address token3 = makeAddr('token3');

    // Initially no tokens should be tracked
    assertEq(rules.everAllowedStakeTokensCount(), 0);

    // Allow first token
    rules.updateAllowedStakeToken(token1, true);
    assertEq(rules.everAllowedStakeTokensCount(), 1);
    assertTrue(rules.hasEverBeenAllowedStakeToken(token1));
    assertEq(rules.everAllowedStakeTokens(0), token1);

    // Allow second token
    rules.updateAllowedStakeToken(token2, true);
    assertEq(rules.everAllowedStakeTokensCount(), 2);
    assertTrue(rules.hasEverBeenAllowedStakeToken(token2));
    assertEq(rules.everAllowedStakeTokens(1), token2);

    // Disallow first token - should still be in ever allowed
    rules.updateAllowedStakeToken(token1, false);
    assertEq(rules.everAllowedStakeTokensCount(), 2);
    assertTrue(rules.hasEverBeenAllowedStakeToken(token1));

    // Re-allow first token - should not increase count
    rules.updateAllowedStakeToken(token1, true);
    assertEq(rules.everAllowedStakeTokensCount(), 2);

    // Allow third token
    rules.updateAllowedStakeToken(token3, true);
    assertEq(rules.everAllowedStakeTokensCount(), 3);
    assertTrue(rules.hasEverBeenAllowedStakeToken(token3));
    assertEq(rules.everAllowedStakeTokens(2), token3);
  }

  function testTrackingCurrentlyAllowedStakeTokens() public {
    address token1 = makeAddr('token1');
    address token2 = makeAddr('token2');
    address token3 = makeAddr('token3');

    // Initially no tokens should be currently allowed
    assertEq(rules.currentlyAllowedStakeTokensCount(), 0);

    // Allow first token
    rules.updateAllowedStakeToken(token1, true);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 1);
    assertEq(rules.currentlyAllowedStakeTokens(0), token1);

    // Allow second token
    rules.updateAllowedStakeToken(token2, true);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 2);
    assertEq(rules.currentlyAllowedStakeTokens(1), token2);

    // Allow third token
    rules.updateAllowedStakeToken(token3, true);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 3);
    assertEq(rules.currentlyAllowedStakeTokens(2), token3);

    // Disallow middle token (token2) - should be removed from currently allowed
    rules.updateAllowedStakeToken(token2, false);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 2);
    // token3 should have moved to index 1
    assertEq(rules.currentlyAllowedStakeTokens(0), token1);
    assertEq(rules.currentlyAllowedStakeTokens(1), token3);

    // Re-allow token2
    rules.updateAllowedStakeToken(token2, true);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 3);
    assertEq(rules.currentlyAllowedStakeTokens(2), token2);

    // Disallow all tokens
    rules.updateAllowedStakeToken(token1, false);
    rules.updateAllowedStakeToken(token2, false);
    rules.updateAllowedStakeToken(token3, false);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 0);
  }

  function testTrackingEverAllowedPredictionTokens() public {
    address token1 = makeAddr('predToken1');
    address token2 = makeAddr('predToken2');
    address token3 = makeAddr('predToken3');

    // Initially no tokens should be tracked
    assertEq(rules.everAllowedPredictionTokensCount(), 0);

    // Allow first token
    rules.updateAllowedPredictionToken(token1, true);
    assertEq(rules.everAllowedPredictionTokensCount(), 1);
    assertTrue(rules.hasEverBeenAllowedPredictionToken(token1));
    assertEq(rules.everAllowedPredictionTokens(0), token1);

    // Allow second token
    rules.updateAllowedPredictionToken(token2, true);
    assertEq(rules.everAllowedPredictionTokensCount(), 2);
    assertTrue(rules.hasEverBeenAllowedPredictionToken(token2));
    assertEq(rules.everAllowedPredictionTokens(1), token2);

    // Disallow first token - should still be in ever allowed
    rules.updateAllowedPredictionToken(token1, false);
    assertEq(rules.everAllowedPredictionTokensCount(), 2);
    assertTrue(rules.hasEverBeenAllowedPredictionToken(token1));

    // Re-allow first token - should not increase count
    rules.updateAllowedPredictionToken(token1, true);
    assertEq(rules.everAllowedPredictionTokensCount(), 2);

    // Allow third token
    rules.updateAllowedPredictionToken(token3, true);
    assertEq(rules.everAllowedPredictionTokensCount(), 3);
    assertTrue(rules.hasEverBeenAllowedPredictionToken(token3));
    assertEq(rules.everAllowedPredictionTokens(2), token3);
  }

  function testTrackingCurrentlyAllowedPredictionTokens() public {
    address token1 = makeAddr('predToken1');
    address token2 = makeAddr('predToken2');
    address token3 = makeAddr('predToken3');

    // Initially no tokens should be currently allowed
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 0);

    // Allow first token
    rules.updateAllowedPredictionToken(token1, true);
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 1);
    assertEq(rules.currentlyAllowedPredictionTokens(0), token1);

    // Allow second token
    rules.updateAllowedPredictionToken(token2, true);
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 2);
    assertEq(rules.currentlyAllowedPredictionTokens(1), token2);

    // Allow third token
    rules.updateAllowedPredictionToken(token3, true);
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 3);
    assertEq(rules.currentlyAllowedPredictionTokens(2), token3);

    // Disallow middle token (token2) - should be removed from currently allowed
    rules.updateAllowedPredictionToken(token2, false);
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 2);
    // token3 should have moved to index 1
    assertEq(rules.currentlyAllowedPredictionTokens(0), token1);
    assertEq(rules.currentlyAllowedPredictionTokens(1), token3);

    // Re-allow token2
    rules.updateAllowedPredictionToken(token2, true);
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 3);
    assertEq(rules.currentlyAllowedPredictionTokens(2), token2);

    // Disallow all tokens
    rules.updateAllowedPredictionToken(token1, false);
    rules.updateAllowedPredictionToken(token2, false);
    rules.updateAllowedPredictionToken(token3, false);
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 0);
  }

  function testTrackingAfterUpgrade() public {
    address stakeToken1 = makeAddr('stakeToken1');
    address stakeToken2 = makeAddr('stakeToken2');
    address predToken1 = makeAddr('predToken1');
    address predToken2 = makeAddr('predToken2');

    // Allow some tokens before upgrade
    rules.updateAllowedStakeToken(stakeToken1, true);
    rules.updateAllowedStakeToken(stakeToken2, true);
    rules.updateAllowedPredictionToken(predToken1, true);
    rules.updateAllowedPredictionToken(predToken2, true);

    // Verify tracking before upgrade
    assertEq(rules.everAllowedStakeTokensCount(), 2);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 2);
    assertEq(rules.everAllowedPredictionTokensCount(), 2);
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 2);

    // Disallow one of each type
    rules.updateAllowedStakeToken(stakeToken2, false);
    rules.updateAllowedPredictionToken(predToken2, false);

    // Verify state before upgrade
    assertEq(rules.everAllowedStakeTokensCount(), 2);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 1);
    assertEq(rules.everAllowedPredictionTokensCount(), 2);
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 1);

    // Deploy new implementation and upgrade
    address newImpl = address(new CastoraPoolsRules());
    rules.upgradeToAndCall(newImpl, '');

    // Verify state is preserved after upgrade
    assertEq(rules.everAllowedStakeTokensCount(), 2);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 1);
    assertEq(rules.everAllowedPredictionTokensCount(), 2);
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 1);

    // Verify arrays are preserved
    assertEq(rules.everAllowedStakeTokensCount(), 2);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 1);
    assertEq(rules.everAllowedPredictionTokensCount(), 2);
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 1);

    assertEq(rules.currentlyAllowedStakeTokens(0), stakeToken1);
    assertEq(rules.currentlyAllowedPredictionTokens(0), predToken1);

    // Verify functionality still works after upgrade
    address newStakeToken = makeAddr('newStakeToken');
    rules.updateAllowedStakeToken(newStakeToken, true);
    assertEq(rules.everAllowedStakeTokensCount(), 3);
    assertEq(rules.currentlyAllowedStakeTokensCount(), 2);
  }

  function testArrayIndexManagementForStakeTokens() public {
    address token1 = makeAddr('indexToken1');
    address token2 = makeAddr('indexToken2');
    address token3 = makeAddr('indexToken3');
    address token4 = makeAddr('indexToken4');

    // Add 4 tokens
    rules.updateAllowedStakeToken(token1, true);
    rules.updateAllowedStakeToken(token2, true);
    rules.updateAllowedStakeToken(token3, true);
    rules.updateAllowedStakeToken(token4, true);

    assertEq(rules.currentlyAllowedStakeTokensCount(), 4);
    assertEq(rules.currentlyAllowedStakeTokens(0), token1);
    assertEq(rules.currentlyAllowedStakeTokens(1), token2);
    assertEq(rules.currentlyAllowedStakeTokens(2), token3);
    assertEq(rules.currentlyAllowedStakeTokens(3), token4);

    // Remove token2 (middle element)
    rules.updateAllowedStakeToken(token2, false);

    assertEq(rules.currentlyAllowedStakeTokensCount(), 3);
    assertEq(rules.currentlyAllowedStakeTokens(0), token1);
    assertEq(rules.currentlyAllowedStakeTokens(1), token4); // token4 should have moved to position 1
    assertEq(rules.currentlyAllowedStakeTokens(2), token3);

    // Verify that index mapping is correct for token4
    assertEq(rules.currentlyAllowedStakeTokenIndex(token4), 1);
    assertEq(rules.currentlyAllowedStakeTokenIndex(token3), 2);

    // Remove token1 (first element)
    rules.updateAllowedStakeToken(token1, false);

    assertEq(rules.currentlyAllowedStakeTokensCount(), 2);
    assertEq(rules.currentlyAllowedStakeTokens(0), token3); // token3 should have moved to position 0
    assertEq(rules.currentlyAllowedStakeTokens(1), token4);

    // Verify index mappings are updated
    assertEq(rules.currentlyAllowedStakeTokenIndex(token3), 0);
    assertEq(rules.currentlyAllowedStakeTokenIndex(token4), 1);
  }

  function testArrayIndexManagementForPredictionTokens() public {
    address token1 = makeAddr('predIndexToken1');
    address token2 = makeAddr('predIndexToken2');
    address token3 = makeAddr('predIndexToken3');
    address token4 = makeAddr('predIndexToken4');

    // Add 4 tokens
    rules.updateAllowedPredictionToken(token1, true);
    rules.updateAllowedPredictionToken(token2, true);
    rules.updateAllowedPredictionToken(token3, true);
    rules.updateAllowedPredictionToken(token4, true);

    assertEq(rules.currentlyAllowedPredictionTokensCount(), 4);
    assertEq(rules.currentlyAllowedPredictionTokens(0), token1);
    assertEq(rules.currentlyAllowedPredictionTokens(1), token2);
    assertEq(rules.currentlyAllowedPredictionTokens(2), token3);
    assertEq(rules.currentlyAllowedPredictionTokens(3), token4);

    // Remove token3 (middle element)
    rules.updateAllowedPredictionToken(token3, false);

    assertEq(rules.currentlyAllowedPredictionTokensCount(), 3);
    assertEq(rules.currentlyAllowedPredictionTokens(0), token1);
    assertEq(rules.currentlyAllowedPredictionTokens(1), token2);
    assertEq(rules.currentlyAllowedPredictionTokens(2), token4); // token4 should have moved to position 2

    // Verify that index mapping is correct for token4
    assertEq(rules.currentlyAllowedPredictionTokenIndex(token4), 2);
    assertEq(rules.currentlyAllowedPredictionTokenIndex(token2), 1);

    // Remove token2 (middle element again)
    rules.updateAllowedPredictionToken(token2, false);

    assertEq(rules.currentlyAllowedPredictionTokensCount(), 2);
    assertEq(rules.currentlyAllowedPredictionTokens(0), token1);
    assertEq(rules.currentlyAllowedPredictionTokens(1), token4); // token4 should have moved to position 1

    // Verify index mappings are updated
    assertEq(rules.currentlyAllowedPredictionTokenIndex(token1), 0);
    assertEq(rules.currentlyAllowedPredictionTokenIndex(token4), 1);
  }

  // Tests for paginated getters
  function testEverAllowedStakeTokensPagination() public {
    // Create 10 tokens for testing pagination
    address[] memory testTokens = new address[](10);
    for (uint256 i = 0; i < 10; i++) {
      testTokens[i] = makeAddr(string(abi.encodePacked('stakeToken', vm.toString(i))));
      rules.updateAllowedStakeToken(testTokens[i], true);
    }

    // Confirm length to be 10
    assertEq(rules.everAllowedStakeTokensCount(), 10);

    // Test first page (offset 0, limit 3)
    address[] memory tokens = rules.getEverAllowedStakeTokensPaginated(0, 3);
    assertEq(tokens.length, 3);
    assertEq(tokens[0], testTokens[0]);
    assertEq(tokens[1], testTokens[1]);
    assertEq(tokens[2], testTokens[2]);

    // Test middle page (offset 3, limit 4)
    tokens = rules.getEverAllowedStakeTokensPaginated(3, 4);
    assertEq(tokens.length, 4);
    assertEq(tokens[0], testTokens[3]);
    assertEq(tokens[1], testTokens[4]);
    assertEq(tokens[2], testTokens[5]);
    assertEq(tokens[3], testTokens[6]);

    // Test last page (offset 8, limit 5 - should only return 2)
    tokens = rules.getEverAllowedStakeTokensPaginated(8, 5);
    assertEq(tokens.length, 2);
    assertEq(tokens[0], testTokens[8]);
    assertEq(tokens[1], testTokens[9]);

    // Test offset beyond array length
    tokens = rules.getEverAllowedStakeTokensPaginated(15, 5);
    assertEq(tokens.length, 0);

    // Test offset at exact array length
    tokens = rules.getEverAllowedStakeTokensPaginated(10, 5);
    assertEq(tokens.length, 0);

    // Test limit 0
    tokens = rules.getEverAllowedStakeTokensPaginated(0, 0);
    assertEq(tokens.length, 0);

    // Test getting all tokens at once
    tokens = rules.getEverAllowedStakeTokensPaginated(0, 20);
    assertEq(rules.everAllowedStakeTokensCount(), 10);
    assertEq(tokens.length, 10);
    for (uint256 i = 0; i < 10; i++) {
      assertEq(tokens[i], testTokens[i]);
    }
  }

  function testEverAllowedPredictionTokensPagination() public {
    // Create 7 tokens for testing pagination
    address[] memory testTokens = new address[](7);
    for (uint256 i = 0; i < 7; i++) {
      testTokens[i] = makeAddr(string(abi.encodePacked('predToken', vm.toString(i))));
      rules.updateAllowedPredictionToken(testTokens[i], true);
    }

    // Confirm length to be 7
    assertEq(rules.everAllowedPredictionTokensCount(), 7);

    // Test first page (offset 0, limit 3)
    address[] memory tokens = rules.getEverAllowedPredictionTokensPaginated(0, 3);
    assertEq(tokens.length, 3);
    assertEq(tokens[0], testTokens[0]);
    assertEq(tokens[1], testTokens[1]);
    assertEq(tokens[2], testTokens[2]);

    // Test middle page (offset 2, limit 3)
    tokens = rules.getEverAllowedPredictionTokensPaginated(2, 3);
    assertEq(tokens.length, 3);
    assertEq(tokens[0], testTokens[2]);
    assertEq(tokens[1], testTokens[3]);
    assertEq(tokens[2], testTokens[4]);

    // Test last page (offset 5, limit 5 - should only return 2)
    tokens = rules.getEverAllowedPredictionTokensPaginated(5, 5);
    assertEq(tokens.length, 2);
    assertEq(tokens[0], testTokens[5]);
    assertEq(tokens[1], testTokens[6]);

    // Test empty result for offset beyond array
    tokens = rules.getEverAllowedPredictionTokensPaginated(10, 3);
    assertEq(tokens.length, 0);
  }

  function testCurrentlyAllowedStakeTokensPagination() public {
    // Create 8 tokens and allow all of them
    address[] memory testTokens = new address[](8);
    for (uint256 i = 0; i < 8; i++) {
      testTokens[i] = makeAddr(string(abi.encodePacked('currentStakeToken', vm.toString(i))));
      rules.updateAllowedStakeToken(testTokens[i], true);
    }

    // Verify all are currently allowed
    assertEq(rules.currentlyAllowedStakeTokensCount(), 8);

    // Test pagination (offset 1, limit 3)
    address[] memory tokens = rules.getCurrentlyAllowedStakeTokensPaginated(1, 3);
    assertEq(tokens.length, 3);
    assertEq(tokens[0], testTokens[1]);
    assertEq(tokens[1], testTokens[2]);
    assertEq(tokens[2], testTokens[3]);

    // Disable some tokens to test dynamic behavior
    rules.updateAllowedStakeToken(testTokens[2], false);
    rules.updateAllowedStakeToken(testTokens[5], false);

    // Verify count decreased
    assertEq(rules.currentlyAllowedStakeTokensCount(), 6);

    // Test pagination after removals (offset 0, limit 4)
    tokens = rules.getCurrentlyAllowedStakeTokensPaginated(0, 4);
    assertEq(tokens.length, 4);

    // Get all currently allowed tokens to verify they're correct
    tokens = rules.getCurrentlyAllowedStakeTokensPaginated(0, 10);
    assertEq(tokens.length, 6);

    // Verify disabled tokens are not in currently allowed
    bool found2 = false;
    bool found5 = false;
    for (uint256 i = 0; i < tokens.length; i++) {
      if (tokens[i] == testTokens[2]) found2 = true;
      if (tokens[i] == testTokens[5]) found5 = true;
    }
    assertFalse(found2);
    assertFalse(found5);
  }

  function testCurrentlyAllowedPredictionTokensPagination() public {
    // Create 6 tokens and allow all of them
    address[] memory testTokens = new address[](6);
    for (uint256 i = 0; i < 6; i++) {
      testTokens[i] = makeAddr(string(abi.encodePacked('currentPredToken', vm.toString(i))));
      rules.updateAllowedPredictionToken(testTokens[i], true);
    }

    // Verify that there are 6 currently allowed prediction tokens
    assertEq(rules.currentlyAllowedPredictionTokensCount(), 6);

    // Test pagination (offset 2, limit 2)
    address[] memory tokens = rules.getCurrentlyAllowedPredictionTokensPaginated(2, 2);
    assertEq(tokens.length, 2);
    assertEq(tokens[0], testTokens[2]);
    assertEq(tokens[1], testTokens[3]);

    // Test edge case: offset at last element
    tokens = rules.getCurrentlyAllowedPredictionTokensPaginated(5, 2);
    assertEq(tokens.length, 1);
    assertEq(tokens[0], testTokens[5]);

    // Disable all tokens
    for (uint256 i = 0; i < 6; i++) {
      rules.updateAllowedPredictionToken(testTokens[i], false);
    }

    // Test pagination with empty array
    tokens = rules.getCurrentlyAllowedPredictionTokensPaginated(0, 5);
    assertEq(tokens.length, 0);
  }

  function testPaginationWithMixedOperations() public {
    address token1 = makeAddr('mixedToken1');
    address token2 = makeAddr('mixedToken2');
    address token3 = makeAddr('mixedToken3');
    address token4 = makeAddr('mixedToken4');

    // Add tokens one by one and test pagination
    rules.updateAllowedStakeToken(token1, true);
    address[] memory tokens = rules.getEverAllowedStakeTokensPaginated(0, 5);
    assertEq(tokens.length, 1);
    assertEq(tokens[0], token1);

    rules.updateAllowedStakeToken(token2, true);
    rules.updateAllowedStakeToken(token3, true);

    // Test ever allowed pagination
    tokens = rules.getEverAllowedStakeTokensPaginated(0, 2);
    assertEq(tokens.length, 2);
    assertEq(tokens[0], token1);
    assertEq(tokens[1], token2);

    // Test currently allowed pagination
    tokens = rules.getCurrentlyAllowedStakeTokensPaginated(1, 2);
    assertEq(tokens.length, 2);
    assertEq(tokens[0], token2);
    assertEq(tokens[1], token3);

    // Disable middle token
    rules.updateAllowedStakeToken(token2, false);

    // Ever allowed should still contain all 3
    tokens = rules.getEverAllowedStakeTokensPaginated(0, 5);
    assertEq(tokens.length, 3);

    // Currently allowed should only contain 2
    tokens = rules.getCurrentlyAllowedStakeTokensPaginated(0, 5);
    assertEq(tokens.length, 2);

    // Add another token and test
    rules.updateAllowedStakeToken(token4, true);

    // Ever allowed should now have 4
    tokens = rules.getEverAllowedStakeTokensPaginated(0, 10);
    assertEq(tokens.length, 4);

    // Currently allowed should have 3
    tokens = rules.getCurrentlyAllowedStakeTokensPaginated(0, 10);
    assertEq(tokens.length, 3);

    // Re-enable token2
    rules.updateAllowedStakeToken(token2, true);

    // Ever allowed should still be 4 (no duplicates)
    tokens = rules.getEverAllowedStakeTokensPaginated(0, 10);
    assertEq(tokens.length, 4);

    // Currently allowed should now be 4
    tokens = rules.getCurrentlyAllowedStakeTokensPaginated(0, 10);
    assertEq(tokens.length, 4);
  }

  function testUpdatedExistingTestWithPagination() public {
    // Update the existing testUpdateAllowedStakeToken to also use pagination
    address token1 = address(cusd);
    address token2 = makeAddr('additionalToken');

    // Initially no tokens
    address[] memory tokens = rules.getEverAllowedStakeTokensPaginated(0, 100);
    assertEq(tokens.length, 0);

    // Add first token
    rules.updateAllowedStakeToken(token1, true);

    // Check pagination shows 1 token
    tokens = rules.getEverAllowedStakeTokensPaginated(0, 10);
    assertEq(tokens.length, 1);
    assertEq(tokens[0], token1);

    // Add second token
    rules.updateAllowedStakeToken(token2, true);

    // Check pagination shows 2 tokens with limit 1
    tokens = rules.getEverAllowedStakeTokensPaginated(0, 1);
    assertEq(tokens.length, 1);
    assertEq(tokens[0], token1);

    // Get second page
    tokens = rules.getEverAllowedStakeTokensPaginated(1, 1);
    assertEq(tokens.length, 1);
    assertEq(tokens[0], token2);

    // Disable first token
    rules.updateAllowedStakeToken(token1, false);

    // Ever allowed should still show both
    tokens = rules.getEverAllowedStakeTokensPaginated(0, 10);
    assertEq(tokens.length, 2);

    // Currently allowed should show only token2
    tokens = rules.getCurrentlyAllowedStakeTokensPaginated(0, 10);
    assertEq(tokens.length, 1);
    assertEq(tokens[0], token2);
  }

  // ========== MULTIPLIER VALIDATION TESTS ==========
  function testUpdateAllowedPoolMultiplier() public {
    uint16 multiplier = 5;

    // Initially not allowed
    assertFalse(rules.allowedPoolMultipliers(multiplier));
    assertEq(rules.everAllowedPoolMultipliersCount(), 0);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 0);

    // Set to allowed
    vm.expectEmit(true, false, false, true);
    emit UpdatedAllowedPoolMultiplier(multiplier, true);
    rules.updateAllowedPoolMultiplier(multiplier, true);

    assertTrue(rules.allowedPoolMultipliers(multiplier));
    assertEq(rules.everAllowedPoolMultipliersCount(), 1);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 1);
    assertTrue(rules.hasEverBeenAllowedPoolMultiplier(multiplier));

    // Set back to not allowed
    vm.expectEmit(true, false, false, true);
    emit UpdatedAllowedPoolMultiplier(multiplier, false);
    rules.updateAllowedPoolMultiplier(multiplier, false);

    assertFalse(rules.allowedPoolMultipliers(multiplier));
    assertEq(rules.everAllowedPoolMultipliersCount(), 1); // Should remain in ever allowed
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 0); // Should be removed from currently allowed
    assertTrue(rules.hasEverBeenAllowedPoolMultiplier(multiplier)); // Should still be marked as ever allowed
  }

  function testRevertUpdateAllowedPoolMultiplierNotOwner() public {
    vm.prank(user);
    vm.expectRevert();
    rules.updateAllowedPoolMultiplier(5, true);
  }

  function testUpdateAllowedPoolMultiplierZeroValue() public {
    uint16 multiplier = 0;

    // Allow zero multiplier
    rules.updateAllowedPoolMultiplier(multiplier, true);
    assertTrue(rules.allowedPoolMultipliers(multiplier));
    assertEq(rules.everAllowedPoolMultipliersCount(), 1);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 1);

    // Disallow zero multiplier
    rules.updateAllowedPoolMultiplier(multiplier, false);
    assertFalse(rules.allowedPoolMultipliers(multiplier));
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 0);
  }

  function testUpdateAllowedPoolMultiplierMaxValue() public {
    uint16 multiplier = type(uint16).max; // 65535

    // Allow maximum multiplier
    rules.updateAllowedPoolMultiplier(multiplier, true);
    assertTrue(rules.allowedPoolMultipliers(multiplier));
    assertEq(rules.everAllowedPoolMultipliersCount(), 1);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 1);

    // Disallow maximum multiplier
    rules.updateAllowedPoolMultiplier(multiplier, false);
    assertFalse(rules.allowedPoolMultipliers(multiplier));
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 0);
  }

  function testUpdateAllowedPoolMultiplierSameValueTwice() public {
    uint16 multiplier = 10;

    // Allow multiplier
    rules.updateAllowedPoolMultiplier(multiplier, true);
    assertTrue(rules.allowedPoolMultipliers(multiplier));
    assertEq(rules.everAllowedPoolMultipliersCount(), 1);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 1);

    // Allow same multiplier again - should not increase counts
    rules.updateAllowedPoolMultiplier(multiplier, true);
    assertTrue(rules.allowedPoolMultipliers(multiplier));
    assertEq(rules.everAllowedPoolMultipliersCount(), 1);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 1);
  }

  function testUpdateAllowedPoolMultiplierDisallowTwice() public {
    uint16 multiplier = 10;

    // Allow then disallow multiplier
    rules.updateAllowedPoolMultiplier(multiplier, true);
    rules.updateAllowedPoolMultiplier(multiplier, false);
    assertFalse(rules.allowedPoolMultipliers(multiplier));
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 0);

    // Disallow same multiplier again - should not change counts
    rules.updateAllowedPoolMultiplier(multiplier, false);
    assertFalse(rules.allowedPoolMultipliers(multiplier));
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 0);
  }

  function testValidateMultiplierSuccess() public {
    uint16 multiplier = 3;

    // Allow the multiplier first
    rules.updateAllowedPoolMultiplier(multiplier, true);

    // Should not revert
    rules.validateMultiplier(multiplier);
  }

  function testRevertValidateMultiplierNotAllowed() public {
    uint16 multiplier = 7;

    // Multiplier is not allowed by default
    vm.expectRevert(InvalidPoolMultiplier.selector);
    rules.validateMultiplier(multiplier);
  }

  function testRevertValidateMultiplierZero() public {
    uint16 multiplier = 0;

    // Zero multiplier not allowed by default
    vm.expectRevert(InvalidPoolMultiplier.selector);
    rules.validateMultiplier(multiplier);
  }

  function testRevertValidateMultiplierMaxValue() public {
    uint16 multiplier = type(uint16).max;

    // Max multiplier not allowed by default
    vm.expectRevert(InvalidPoolMultiplier.selector);
    rules.validateMultiplier(multiplier);
  }

  function testIsValidMultiplierAllowed() public {
    uint16 multiplier = 4;

    rules.updateAllowedPoolMultiplier(multiplier, true);
    assertTrue(rules.isValidMultiplier(multiplier));
  }

  function testIsValidMultiplierZero() public {
    uint16 multiplier = 0;

    // Zero is not allowed by default
    assertFalse(rules.isValidMultiplier(multiplier));

    // Allow zero and test again
    rules.updateAllowedPoolMultiplier(multiplier, true);
    assertTrue(rules.isValidMultiplier(multiplier));
  }

  function testIsValidMultiplierMaxValue() public {
    uint16 multiplier = type(uint16).max;

    // Max value is not allowed by default
    assertFalse(rules.isValidMultiplier(multiplier));

    // Allow max value and test again
    rules.updateAllowedPoolMultiplier(multiplier, true);
    assertTrue(rules.isValidMultiplier(multiplier));
  }

  // ========== MULTIPLIER ARRAY MANAGEMENT TESTS ==========

  function testTrackingEverAllowedPoolMultipliers() public {
    uint16 mult1 = 2;
    uint16 mult2 = 3;
    uint16 mult3 = 5;

    // Initially no multipliers should be tracked
    assertEq(rules.everAllowedPoolMultipliersCount(), 0);

    // Allow first multiplier
    rules.updateAllowedPoolMultiplier(mult1, true);
    assertEq(rules.everAllowedPoolMultipliersCount(), 1);
    assertTrue(rules.hasEverBeenAllowedPoolMultiplier(mult1));
    assertEq(rules.everAllowedPoolMultipliers(0), mult1);

    // Allow second multiplier
    rules.updateAllowedPoolMultiplier(mult2, true);
    assertEq(rules.everAllowedPoolMultipliersCount(), 2);
    assertTrue(rules.hasEverBeenAllowedPoolMultiplier(mult2));
    assertEq(rules.everAllowedPoolMultipliers(1), mult2);

    // Disallow first multiplier - should still be in ever allowed
    rules.updateAllowedPoolMultiplier(mult1, false);
    assertEq(rules.everAllowedPoolMultipliersCount(), 2);
    assertTrue(rules.hasEverBeenAllowedPoolMultiplier(mult1));

    // Re-allow first multiplier - should not increase count
    rules.updateAllowedPoolMultiplier(mult1, true);
    assertEq(rules.everAllowedPoolMultipliersCount(), 2);

    // Allow third multiplier
    rules.updateAllowedPoolMultiplier(mult3, true);
    assertEq(rules.everAllowedPoolMultipliersCount(), 3);
    assertTrue(rules.hasEverBeenAllowedPoolMultiplier(mult3));
    assertEq(rules.everAllowedPoolMultipliers(2), mult3);
  }

  function testTrackingCurrentlyAllowedPoolMultipliers() public {
    uint16 mult1 = 2;
    uint16 mult2 = 4;
    uint16 mult3 = 10;

    // Initially no multipliers should be currently allowed
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 0);

    // Allow first multiplier
    rules.updateAllowedPoolMultiplier(mult1, true);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 1);
    assertEq(rules.currentlyAllowedPoolMultipliers(0), mult1);

    // Allow second multiplier
    rules.updateAllowedPoolMultiplier(mult2, true);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 2);
    assertEq(rules.currentlyAllowedPoolMultipliers(1), mult2);

    // Allow third multiplier
    rules.updateAllowedPoolMultiplier(mult3, true);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 3);
    assertEq(rules.currentlyAllowedPoolMultipliers(2), mult3);

    // Disallow middle multiplier (mult2) - should be removed from currently allowed
    rules.updateAllowedPoolMultiplier(mult2, false);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 2);
    // mult3 should have moved to index 1
    assertEq(rules.currentlyAllowedPoolMultipliers(0), mult1);
    assertEq(rules.currentlyAllowedPoolMultipliers(1), mult3);

    // Re-allow mult2
    rules.updateAllowedPoolMultiplier(mult2, true);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 3);
    assertEq(rules.currentlyAllowedPoolMultipliers(2), mult2);

    // Disallow all multipliers
    rules.updateAllowedPoolMultiplier(mult1, false);
    rules.updateAllowedPoolMultiplier(mult2, false);
    rules.updateAllowedPoolMultiplier(mult3, false);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 0);
  }

  function testArrayIndexManagementForPoolMultipliers() public {
    uint16 mult1 = 2;
    uint16 mult2 = 3;
    uint16 mult3 = 5;
    uint16 mult4 = 10;

    // Add 4 multipliers
    rules.updateAllowedPoolMultiplier(mult1, true);
    rules.updateAllowedPoolMultiplier(mult2, true);
    rules.updateAllowedPoolMultiplier(mult3, true);
    rules.updateAllowedPoolMultiplier(mult4, true);

    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 4);
    assertEq(rules.currentlyAllowedPoolMultipliers(0), mult1);
    assertEq(rules.currentlyAllowedPoolMultipliers(1), mult2);
    assertEq(rules.currentlyAllowedPoolMultipliers(2), mult3);
    assertEq(rules.currentlyAllowedPoolMultipliers(3), mult4);

    // Remove mult2 (middle element)
    rules.updateAllowedPoolMultiplier(mult2, false);

    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 3);
    assertEq(rules.currentlyAllowedPoolMultipliers(0), mult1);
    assertEq(rules.currentlyAllowedPoolMultipliers(1), mult4); // mult4 should have moved to position 1
    assertEq(rules.currentlyAllowedPoolMultipliers(2), mult3);

    // Verify that index mapping is correct for mult4
    assertEq(rules.currentlyAllowedPoolMultiplierIndex(mult4), 1);
    assertEq(rules.currentlyAllowedPoolMultiplierIndex(mult3), 2);

    // Remove mult1 (first element)
    rules.updateAllowedPoolMultiplier(mult1, false);

    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 2);
    assertEq(rules.currentlyAllowedPoolMultipliers(0), mult3); // mult3 should have moved to position 0
    assertEq(rules.currentlyAllowedPoolMultipliers(1), mult4);

    // Verify index mappings are updated
    assertEq(rules.currentlyAllowedPoolMultiplierIndex(mult3), 0);
    assertEq(rules.currentlyAllowedPoolMultiplierIndex(mult4), 1);
  }

  function testMultiplierArrayIndexRemovalEdgeCases() public {
    uint16 mult = 7;

    // Add and remove single multiplier
    rules.updateAllowedPoolMultiplier(mult, true);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 1);

    rules.updateAllowedPoolMultiplier(mult, false);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 0);

    // Add two multipliers and remove the last one
    uint16 mult1 = 2;
    uint16 mult2 = 5;

    rules.updateAllowedPoolMultiplier(mult1, true);
    rules.updateAllowedPoolMultiplier(mult2, true);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 2);

    // Remove last element
    rules.updateAllowedPoolMultiplier(mult2, false);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 1);
    assertEq(rules.currentlyAllowedPoolMultipliers(0), mult1);
  }

  function testMultiplierDuplicateValuesEdgeCases() public {
    uint16 mult = 3;

    // Allow same multiplier multiple times - should only track once
    rules.updateAllowedPoolMultiplier(mult, true);
    rules.updateAllowedPoolMultiplier(mult, true);
    rules.updateAllowedPoolMultiplier(mult, true);

    assertEq(rules.everAllowedPoolMultipliersCount(), 1);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 1);
    assertTrue(rules.hasEverBeenAllowedPoolMultiplier(mult));

    // Disallow and re-allow - should not create duplicates
    rules.updateAllowedPoolMultiplier(mult, false);
    rules.updateAllowedPoolMultiplier(mult, true);

    assertEq(rules.everAllowedPoolMultipliersCount(), 1);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 1);
  }

  function testMultiplierBoundaryValues() public {
    uint16[] memory boundaryValues = new uint16[](5);
    boundaryValues[0] = 0;
    boundaryValues[1] = 1;
    boundaryValues[2] = 2;
    boundaryValues[3] = type(uint16).max - 1;
    boundaryValues[4] = type(uint16).max;

    for (uint256 i = 0; i < boundaryValues.length; i++) {
      uint16 mult = boundaryValues[i];

      // Test allowing boundary value
      rules.updateAllowedPoolMultiplier(mult, true);
      assertTrue(rules.allowedPoolMultipliers(mult));
      assertTrue(rules.isValidMultiplier(mult));

      // Should not revert when validating
      rules.validateMultiplier(mult);

      // Test disallowing boundary value
      rules.updateAllowedPoolMultiplier(mult, false);
      assertFalse(rules.allowedPoolMultipliers(mult));
      assertFalse(rules.isValidMultiplier(mult));

      // Should revert when validating
      vm.expectRevert(InvalidPoolMultiplier.selector);
      rules.validateMultiplier(mult);
    }
  }

  function testMultiplierCommonValues() public {
    uint16[] memory commonValues = new uint16[](5);
    commonValues[0] = 2; // Common multiplier from README
    commonValues[1] = 3; // Common multiplier from README
    commonValues[2] = 4; // Common multiplier from README
    commonValues[3] = 5; // Common multiplier from README
    commonValues[4] = 10; // Common multiplier from README

    for (uint256 i = 0; i < commonValues.length; i++) {
      uint16 mult = commonValues[i];

      // Initially not allowed
      assertFalse(rules.isValidMultiplier(mult));

      // Allow multiplier
      rules.updateAllowedPoolMultiplier(mult, true);
      assertTrue(rules.isValidMultiplier(mult));

      // Validate should not revert
      rules.validateMultiplier(mult);
    }

    // Verify all are tracked correctly
    assertEq(rules.everAllowedPoolMultipliersCount(), 5);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 5);
  }

  function testMultiplierAfterUpgrade() public {
    uint16 mult1 = 3;
    uint16 mult2 = 7;

    // Allow some multipliers before upgrade
    rules.updateAllowedPoolMultiplier(mult1, true);
    rules.updateAllowedPoolMultiplier(mult2, true);

    // Verify tracking before upgrade
    assertEq(rules.everAllowedPoolMultipliersCount(), 2);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 2);

    // Disallow one multiplier
    rules.updateAllowedPoolMultiplier(mult2, false);

    // Verify state before upgrade
    assertEq(rules.everAllowedPoolMultipliersCount(), 2);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 1);

    // Deploy new implementation and upgrade
    address newImpl = address(new CastoraPoolsRules());
    rules.upgradeToAndCall(newImpl, '');

    // Verify state is preserved after upgrade
    assertEq(rules.everAllowedPoolMultipliersCount(), 2);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 1);
    assertTrue(rules.allowedPoolMultipliers(mult1));
    assertFalse(rules.allowedPoolMultipliers(mult2));

    // Verify functionality still works after upgrade
    uint16 newMult = 15;
    rules.updateAllowedPoolMultiplier(newMult, true);
    assertEq(rules.everAllowedPoolMultipliersCount(), 3);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 2);
  }

  // ========== EDGE CASE STRESS TESTS ==========

  function testMassMultiplierOperations() public {
    // Add many multipliers at once
    uint16[] memory multipliers = new uint16[](100);
    for (uint16 i = 0; i < 100; i++) {
      multipliers[i] = i + 1; // 1 to 100
      rules.updateAllowedPoolMultiplier(multipliers[i], true);
    }

    assertEq(rules.everAllowedPoolMultipliersCount(), 100);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 100);

    // Remove every other multiplier
    for (uint16 i = 0; i < 100; i += 2) {
      rules.updateAllowedPoolMultiplier(multipliers[i], false);
    }

    assertEq(rules.everAllowedPoolMultipliersCount(), 100);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 50);

    // Verify remaining multipliers are still valid
    for (uint16 i = 1; i < 100; i += 2) {
      assertTrue(rules.isValidMultiplier(multipliers[i]));
    }
  }

  function testRandomOrderMultiplierOperations() public {
    uint16[] memory multipliers = new uint16[](10);
    multipliers[0] = 50;
    multipliers[1] = 1;
    multipliers[2] = 100;
    multipliers[3] = 25;
    multipliers[4] = 75;
    multipliers[5] = 10;
    multipliers[6] = 90;
    multipliers[7] = 5;
    multipliers[8] = 95;
    multipliers[9] = 15;

    // Add in random order
    for (uint256 i = 0; i < multipliers.length; i++) {
      rules.updateAllowedPoolMultiplier(multipliers[i], true);
    }

    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 10);

    // Remove in different order (remove indices 1, 3, 5, 7, 9)
    uint256[] memory removeIndices = new uint256[](5);
    removeIndices[0] = 1; // mult = 1
    removeIndices[1] = 3; // mult = 25
    removeIndices[2] = 5; // mult = 10
    removeIndices[3] = 7; // mult = 5
    removeIndices[4] = 9; // mult = 15

    for (uint256 i = 0; i < removeIndices.length; i++) {
      rules.updateAllowedPoolMultiplier(multipliers[removeIndices[i]], false);
    }

    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 5);

    // Verify remaining multipliers
    assertTrue(rules.isValidMultiplier(50));
    assertTrue(rules.isValidMultiplier(100));
    assertTrue(rules.isValidMultiplier(75));
    assertTrue(rules.isValidMultiplier(90));
    assertTrue(rules.isValidMultiplier(95));
  }

  function testGasOptimizationMultiplierArrayManagement() public {
    uint16 mult1 = 2;
    uint16 mult2 = 5;

    // Test that removing and re-adding doesn't create gas issues
    for (uint256 i = 0; i < 10; i++) {
      rules.updateAllowedPoolMultiplier(mult1, true);
      rules.updateAllowedPoolMultiplier(mult2, true);
      rules.updateAllowedPoolMultiplier(mult1, false);
      rules.updateAllowedPoolMultiplier(mult2, false);
    }

    // Should still have correct tracking
    assertEq(rules.everAllowedPoolMultipliersCount(), 2);
    assertEq(rules.currentlyAllowedPoolMultipliersCount(), 0);
  }
}
