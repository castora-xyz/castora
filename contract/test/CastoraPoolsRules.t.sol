// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import 'forge-std/Test.sol';
import '../src/CastoraPoolsRules.sol';
import '../src/cUSD.sol';

contract CastoraPoolsRulesTest is Test {
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
      windowCloseTime: 1000 * 300 // Multiple of 5 minutes
    });

    // Initialize invalid pool seeds for testing
    invalidSeeds = PoolSeeds({
      predictionToken: mockToken,
      stakeToken: address(cusd),
      stakeAmount: 1000000,
      snapshotTime: 1000 * 300, // Earlier than window close
      windowCloseTime: 1200 * 300 // Later than snapshot time
    });
  }

  function testDeployment() public view {
    assertEq(rules.owner(), owner);
    assertEq(rules.requiredTimeInterval(), 5 * 60); // 5 minutes default
  }

  function testUpdateAllowedStakeToken() public {
    // Initially not allowed
    assertFalse(rules.allowedStakeTokens(address(cusd)));

    // Set to allowed
    vm.expectEmit(true, false, false, true);
    emit UpdatedAllowedStakeToken(address(cusd), true);
    rules.updateAllowedStakeToken(address(cusd), true);
    assertTrue(rules.allowedStakeTokens(address(cusd)));

    // Set back to not allowed
    vm.expectEmit(true, false, false, true);
    emit UpdatedAllowedStakeToken(address(cusd), false);
    rules.updateAllowedStakeToken(address(cusd), false);
    assertFalse(rules.allowedStakeTokens(address(cusd)));
  }

  function testRevertUpdateAllowedStakeTokenNotOwner() public {
    vm.prank(user);
    vm.expectRevert();
    rules.updateAllowedStakeToken(address(cusd), true);
  }

  function testUpdateAllowedPredictionToken() public {
    // Initially not allowed
    assertFalse(rules.allowedPredictionTokens(address(cusd)));

    // Set to allowed
    vm.expectEmit(true, false, false, true);
    emit UpdatedAllowedPredictionToken(address(cusd), true);
    rules.updateAllowedPredictionToken(address(cusd), true);
    assertTrue(rules.allowedPredictionTokens(address(cusd)));

    // Set back to not allowed
    vm.expectEmit(true, false, false, true);
    emit UpdatedAllowedPredictionToken(address(cusd), false);
    rules.updateAllowedPredictionToken(address(cusd), false);
    assertFalse(rules.allowedPredictionTokens(address(cusd)));
  }

  function testRevertUpdateAllowedPredictionTokenNotOwner() public {
    vm.prank(user);
    vm.expectRevert();
    rules.updateAllowedPredictionToken(address(cusd), true);
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
      windowCloseTime: 1000 * 300 // On 5-min interval
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
      windowCloseTime: 1000 * 300 // On 5-min interval
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
}
