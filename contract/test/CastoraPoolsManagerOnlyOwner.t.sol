// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {ERC1967Proxy} from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {PausableUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol';
import {Test} from 'forge-std/Test.sol';
import {Castora} from '../src/Castora.sol';
import {CastoraErrors} from '../src/CastoraErrors.sol';
import {CastoraEvents} from '../src/CastoraEvents.sol';
import {CastoraPoolsManager} from '../src/CastoraPoolsManager.sol';
import {CastoraStructs} from '../src/CastoraStructs.sol';
import {cUSD} from '../src/cUSD.sol';

contract CastoraPoolsManagerOnlyOwnerTest is CastoraErrors, CastoraEvents, CastoraStructs, Test {
  CastoraPoolsManager poolsManager;
  cUSD cusd;
  cUSD altToken;
  address owner;
  address castora;
  address feeCollector;
  address user;
  address newFeeCollector;
  uint16 splitFeesPercent;

  function setUp() public {
    owner = address(this);
    castora = makeAddr('castora');
    feeCollector = makeAddr('feeCollector');
    user = makeAddr('user');
    newFeeCollector = makeAddr('newFeeCollector');
    splitFeesPercent = 5000; // 50%

    // Deploy contracts
    cusd = new cUSD();
    altToken = new cUSD();
    poolsManager = CastoraPoolsManager(payable(address(new ERC1967Proxy(address(new CastoraPoolsManager()), ''))));
    poolsManager.initialize(feeCollector, splitFeesPercent);
    poolsManager.setCastora(castora);

    // Setup tokens and ETH for testing
    cusd.mint(address(poolsManager), 1000000 * 10 ** 6);
    vm.deal(address(poolsManager), 10 ether);
  }

  function testRevertInvalidInputsInitialize() public {
    CastoraPoolsManager newPoolsManager =
      CastoraPoolsManager(payable(address(new ERC1967Proxy(address(new CastoraPoolsManager()), ''))));

    vm.expectRevert(InvalidAddress.selector);
    newPoolsManager.initialize(address(0), 10001);

    vm.expectRevert(InvalidSplitFeesPercent.selector);
    newPoolsManager.initialize(feeCollector, 10001);
  }

  function testUpgradeAuthorization() public {
    address newImpl = address(new CastoraPoolsManager());

    // Should work for owner
    poolsManager.upgradeToAndCall(newImpl, '');

    // Should fail for not owner
    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    poolsManager.upgradeToAndCall(newImpl, '');
  }

  function testUpgradeRetainsData() public {
    // Store some data before upgrade
    address originalCastora = poolsManager.castora();
    address originalFeeCollector = poolsManager.feeCollector();
    uint16 originalSplitFeesPercent = poolsManager.creatorPoolCompletionFeesSplitPercent();

    // Upgrade
    address newImpl = address(new CastoraPoolsManager());
    poolsManager.upgradeToAndCall(newImpl, '');

    // Verify data is retained
    assertEq(poolsManager.castora(), originalCastora);
    assertEq(poolsManager.feeCollector(), originalFeeCollector);
    assertEq(poolsManager.creatorPoolCompletionFeesSplitPercent(), originalSplitFeesPercent);
  }

  function testRevertZeroAddressSetFeeCollector() public {
    vm.expectRevert(InvalidAddress.selector);
    poolsManager.setFeeCollector(address(0));
  }

  function testRevertWhenNotOwnerSetFeeCollector() public {
    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    poolsManager.setFeeCollector(newFeeCollector);
  }

  function testSetFeeCollectorSuccess() public {
    address oldFeeCollector = poolsManager.feeCollector();

    vm.expectEmit(true, true, false, false);
    emit SetFeeCollector(oldFeeCollector, newFeeCollector);
    poolsManager.setFeeCollector(newFeeCollector);

    assertEq(poolsManager.feeCollector(), newFeeCollector);
    assertEq(oldFeeCollector, feeCollector);
  }

  function testRevertWhenNotOwnerSetCreatorPoolCompletionFeesSplitPercent() public {
    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    poolsManager.setCreatorPoolCompletionFeesSplitPercent(3000);
  }

  function testRevertInvalidSplitFeesPercent() public {
    vm.expectRevert(InvalidSplitFeesPercent.selector);
    poolsManager.setCreatorPoolCompletionFeesSplitPercent(10001); // > 100%
  }

  function testSetCreatorPoolCompletionFeesSplitPercent() public {
    uint256 oldPercentage = poolsManager.creatorPoolCompletionFeesSplitPercent();
    uint16 newPercentage = 3000; // 30%

    vm.expectEmit(false, false, false, true);
    emit SetCreatorPoolCompletionFeesSplitPercent(oldPercentage, newPercentage);
    poolsManager.setCreatorPoolCompletionFeesSplitPercent(newPercentage);
    assertEq(poolsManager.creatorPoolCompletionFeesSplitPercent(), newPercentage);
    assertEq(oldPercentage, 5000); // Default 50%

    // Test 0%
    poolsManager.setCreatorPoolCompletionFeesSplitPercent(0);
    assertEq(poolsManager.creatorPoolCompletionFeesSplitPercent(), 0);

    // Test 100%
    poolsManager.setCreatorPoolCompletionFeesSplitPercent(10000);
    assertEq(poolsManager.creatorPoolCompletionFeesSplitPercent(), 10000);
  }

  function testRevertWhenNotOwnerSetCreationFees() public {
    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    poolsManager.setCreationFees(address(cusd), 1000 * 10 ** 6);
  }

  function testRevertZeroAddressSetCreationFees() public {
    vm.expectRevert(InvalidAddress.selector);
    poolsManager.setCreationFees(address(0), 1000 * 10 ** 6);
  }

  function testSetCreationFeesZeroAmount() public {
    // Contract allows zero amount creation fees, this is to allow future marketing campaigns
    // for users to freely create pools without fees.
    poolsManager.setCreationFees(address(cusd), 0);

    CreationFeesTokenInfo memory tokenInfo = poolsManager.getCreationFeesTokenInfo(address(cusd));
    assertTrue(tokenInfo.isAllowed);
    assertEq(tokenInfo.amount, 0);
  }

  function testSetCreationFeesSuccess() public {
    uint256 feeAmount = 1000 * 10 ** 6;

    // Check initial state
    CreationFeesTokenInfo memory tokenInfo = poolsManager.getCreationFeesTokenInfo(address(cusd));
    assertFalse(tokenInfo.isAllowed);
    assertEq(tokenInfo.amount, 0);

    // Check initial stats
    AllUserCreatedPoolStats memory stats = poolsManager.getAllStats();
    assertEq(stats.noOfCreationFeesTokens, 0);

    vm.expectEmit(true, false, false, false);
    emit SetCreationFees(address(cusd), feeAmount);
    poolsManager.setCreationFees(address(cusd), feeAmount);

    // Check updated state
    tokenInfo = poolsManager.getCreationFeesTokenInfo(address(cusd));
    assertTrue(tokenInfo.isAllowed);
    assertEq(tokenInfo.amount, feeAmount);

    // Check updated stats
    stats = poolsManager.getAllStats();
    assertEq(stats.noOfCreationFeesTokens, 1);

    // Check token was added to array
    assertEq(poolsManager.creationFeesTokens(0), address(cusd));
  }

  function testSetCreationFeesExistingToken() public {
    uint256 initialAmount = 1000 * 10 ** 6;
    uint256 updatedAmount = 2000 * 10 ** 6;

    // Set initial fees
    poolsManager.setCreationFees(address(cusd), initialAmount);

    // Check initial state
    AllUserCreatedPoolStats memory stats = poolsManager.getAllStats();
    assertEq(stats.noOfCreationFeesTokens, 1);

    // Update fees for same token
    poolsManager.setCreationFees(address(cusd), updatedAmount);

    // Check state - counter should not increase
    stats = poolsManager.getAllStats();
    assertEq(stats.noOfCreationFeesTokens, 1);

    // Check amount was updated
    CreationFeesTokenInfo memory tokenInfo = poolsManager.getCreationFeesTokenInfo(address(cusd));
    assertEq(tokenInfo.amount, updatedAmount);
  }

  function testSetCreationFeesMultipleTokens() public {
    uint256 cusdAmount = 1000 * 10 ** 6;
    uint256 altAmount = 500 * 10 ** 6;

    poolsManager.setCreationFees(address(cusd), cusdAmount);
    poolsManager.setCreationFees(address(altToken), altAmount);

    // Check both tokens are allowed
    CreationFeesTokenInfo memory cusdTokenInfo = poolsManager.getCreationFeesTokenInfo(address(cusd));
    CreationFeesTokenInfo memory altTokenInfo = poolsManager.getCreationFeesTokenInfo(address(altToken));

    assertTrue(cusdTokenInfo.isAllowed);
    assertTrue(altTokenInfo.isAllowed);
    assertEq(cusdTokenInfo.amount, cusdAmount);
    assertEq(altTokenInfo.amount, altAmount);

    // Check counter
    AllUserCreatedPoolStats memory stats = poolsManager.getAllStats();
    assertEq(stats.noOfCreationFeesTokens, 2);

    // Check array
    assertEq(poolsManager.creationFeesTokens(0), address(cusd));
    assertEq(poolsManager.creationFeesTokens(1), address(altToken));
  }

  function testRevertWhenNotOwnerDisallowCreationFees() public {
    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    poolsManager.disallowCreationFees(address(cusd));
  }

  function testRevertZeroAddressDisallowCreationFees() public {
    vm.expectRevert(InvalidAddress.selector);
    poolsManager.disallowCreationFees(address(0));
  }

  function testRevertDisallowedTokenDisallowCreationFees() public {
    // First set a token to be allowed
    poolsManager.setCreationFees(address(cusd), 1000 * 10 ** 6);

    // Verify it's allowed
    CreationFeesTokenInfo memory tokenInfo = poolsManager.getCreationFeesTokenInfo(address(cusd));
    assertTrue(tokenInfo.isAllowed);

    // Disallow it once
    poolsManager.disallowCreationFees(address(cusd));

    // Verify it's now disallowed
    tokenInfo = poolsManager.getCreationFeesTokenInfo(address(cusd));
    assertFalse(tokenInfo.isAllowed);

    // Try to disallow it again - should revert with CreationFeeTokenAlreadyDisallowed
    vm.expectRevert(CreationFeeTokenAlreadyDisallowed.selector);
    poolsManager.disallowCreationFees(address(cusd));
  }

  function testDisallowCreationFeesSuccess() public {
    uint256 feeAmount = 1000 * 10 ** 6;

    // First allow the token
    poolsManager.setCreationFees(address(cusd), feeAmount);
    CreationFeesTokenInfo memory tokenInfo = poolsManager.getCreationFeesTokenInfo(address(cusd));
    assertTrue(tokenInfo.isAllowed);
    assertEq(tokenInfo.amount, feeAmount);

    // Then disallow it
    vm.expectEmit(true, false, false, false);
    emit DisallowedCreationFees(address(cusd));
    poolsManager.disallowCreationFees(address(cusd));

    tokenInfo = poolsManager.getCreationFeesTokenInfo(address(cusd));
    assertFalse(tokenInfo.isAllowed);
    assertEq(tokenInfo.amount, 0);
  }

  function testRevertWhenNotOwnerPauseUnpause() public {
    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    poolsManager.pause();

    // pause as owner (this contract)
    poolsManager.pause();

    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    poolsManager.unpause();
  }

  function testPauseUnpauseSuccess() public {
    assertFalse(poolsManager.paused());

    vm.expectEmit(false, false, false, false);
    emit PausableUpgradeable.Paused(address(this));
    poolsManager.pause();
    assertTrue(poolsManager.paused());

    vm.expectEmit(false, false, false, false);
    emit PausableUpgradeable.Unpaused(address(this));
    poolsManager.unpause();
    assertFalse(poolsManager.paused());
  }

  function testRevertWhenNotOwnerSetCastora() public {
    address newCastora = makeAddr('newCastora');
    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    poolsManager.setCastora(newCastora);
  }

  function testRevertZeroAddressSetCastora() public {
    vm.expectRevert(InvalidAddress.selector);
    poolsManager.setCastora(address(0));
  }

  function testSetCastoraSuccess() public {
    address newCastora = makeAddr('newCastora');
    address oldCastora = poolsManager.castora();

    vm.expectEmit(true, false, false, false);
    emit SetCastoraInPoolsManager(oldCastora, newCastora);
    poolsManager.setCastora(newCastora);

    assertEq(poolsManager.castora(), newCastora);
    assertEq(oldCastora, castora);
  }
}
