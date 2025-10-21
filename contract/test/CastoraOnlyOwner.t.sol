// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {IAccessControl} from '@openzeppelin/contracts/access/IAccessControl.sol';
import {IERC1967} from '@openzeppelin/contracts/interfaces/IERC1967.sol';
import {ERC1967Proxy} from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {PausableUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol';
import {UUPSUpgradeable} from '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import {Test} from 'forge-std/Test.sol';
import {Castora} from '../src/Castora.sol';
import {CastoraErrors} from '../src/CastoraErrors.sol';
import {CastoraEvents} from '../src/CastoraEvents.sol';
import {CastoraPoolsManager} from '../src/CastoraPoolsManager.sol';
import {CastoraPoolsRules} from '../src/CastoraPoolsRules.sol';
import {CastoraStructs} from '../src/CastoraStructs.sol';

contract CastoraOnlyOwnerTest is CastoraErrors, CastoraEvents, CastoraStructs, Test {
  Castora castora;
  CastoraPoolsManager poolsManager;
  CastoraPoolsRules poolsRules;
  address owner;
  address feeCollector;
  address user;

  function setUp() public {
    owner = address(this);
    feeCollector = makeAddr('feeCollector');
    user = makeAddr('user');

    poolsManager = CastoraPoolsManager(payable(address(new ERC1967Proxy(address(new CastoraPoolsManager()), ''))));
    poolsManager.initialize(feeCollector, 5000);
    poolsRules = CastoraPoolsRules(address(new ERC1967Proxy(address(new CastoraPoolsRules()), '')));
    poolsRules.initialize();
    castora = Castora(payable(address(new ERC1967Proxy(address(new Castora()), ''))));
    castora.initialize(address(poolsManager), address(poolsRules));
  }

  function testRevertNotOwnerPause() public {
    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    castora.pause();
  }

  function testPauseSuccess() public {
    vm.expectEmit(true, false, false, false);
    emit PausableUpgradeable.Paused(owner);
    castora.pause();
    assertTrue(castora.paused());
  }

  function testRevertPausedPause() public {
    castora.pause();
    assertTrue(castora.paused());

    vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
    castora.pause();
  }

  function testRevertNotOwnerUnpause() public {
    castora.pause();
    assertTrue(castora.paused());

    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    castora.unpause();
  }

  function testRevertUnpausedUnpause() public {
    vm.expectRevert(PausableUpgradeable.ExpectedPause.selector);
    castora.unpause();
  }

  function testUnpauseSuccess() public {
    castora.pause();
    assertTrue(castora.paused());

    vm.expectEmit(true, false, false, false);
    emit PausableUpgradeable.Unpaused(owner);
    castora.unpause();
    assertFalse(castora.paused());
  }

  function testRevertNotOwnerSetPoolsManager() public {
    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    castora.setPoolsManager(address(poolsManager));
  }

  function testRevertInvalidAddressSetPoolsManager() public {
    vm.expectRevert(InvalidAddress.selector);
    castora.setPoolsManager(address(0));
  }

  function testSetPoolsManagerSuccess() public {
    address oldPoolsManager = castora.poolsManager();
    address newPoolsManager = makeAddr('newPoolsManager');
    vm.expectEmit(true, true, false, false);
    emit SetPoolsManagerInCastora(oldPoolsManager, newPoolsManager);
    castora.setPoolsManager(newPoolsManager);
    assertEq(castora.poolsManager(), newPoolsManager);
  }

  function testRevertNotOwnerSetPoolsRules() public {
    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    castora.setPoolsRules(address(poolsRules));
  }

  function testRevertInvalidAddressSetPoolsRules() public {
    vm.expectRevert(InvalidAddress.selector);
    castora.setPoolsRules(address(0));
  }

  function testSetPoolsRulesSuccess() public {
    address oldPoolsRules = castora.poolsRules();
    address newPoolsRules = makeAddr('newPoolsRules');
    vm.expectEmit(true, true, false, false);
    emit SetPoolsRulesInCastora(oldPoolsRules, newPoolsRules);
    castora.setPoolsRules(newPoolsRules);
    assertEq(castora.poolsRules(), newPoolsRules);
  }

  function testRevertOnlyOnwerGrantAdminRole() public {
    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    castora.grantAdminRole(user);
  }

  function testRevertInvalidAddressGrantAdminRole() public {
    vm.expectRevert(InvalidAddress.selector);
    castora.grantAdminRole(address(0));
  }

  function testGrantAdminRoleSuccess() public {
    bytes32 adminRole = castora.ADMIN_ROLE();

    // Test successful grant
    vm.expectEmit(true, true, true, false);
    emit IAccessControl.RoleGranted(adminRole, user, owner);
    castora.grantAdminRole(user);
    assertTrue(castora.hasRole(adminRole, user));

    // Test successful grant if already granted (should not revert and not emit)
    castora.grantAdminRole(user);
    assertTrue(castora.hasRole(adminRole, user));
  }

  function testRevertInvalidAddressRevokeAdminRole() public {
    vm.expectRevert(InvalidAddress.selector);
    castora.revokeAdminRole(address(0));
  }

  function testRevertOnlyOnwerRevokeAdminRole() public {
    castora.grantAdminRole(user);
    assertTrue(castora.hasRole(castora.ADMIN_ROLE(), user));

    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    castora.revokeAdminRole(user);
  }

  function testRevokeAdminRoleSuccess() public {
    bytes32 adminRole = castora.ADMIN_ROLE();

    // Grant first
    castora.grantAdminRole(user);
    assertTrue(castora.hasRole(adminRole, user));

    // Test successful revoke
    vm.expectEmit(true, true, true, false);
    emit IAccessControl.RoleRevoked(adminRole, user, owner);
    castora.revokeAdminRole(user);
    assertFalse(castora.hasRole(adminRole, user));

    // Test successful revoke if already revoked (should not revert and not emit)
    castora.revokeAdminRole(user);
    assertFalse(castora.hasRole(adminRole, user));
  }

  function testRevertNotOwnerWhenUpgrading() public {
    address newImplementation = address(new Castora());
    vm.prank(user);
    vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user));
    castora.upgradeToAndCall(newImplementation, '');
  }

  function testRevertInvalidAddressesInitialise() public {
    castora = Castora(payable(address(new ERC1967Proxy(address(new Castora()), ''))));

    vm.expectRevert(InvalidAddress.selector);
    castora.initialize(address(0), address(poolsRules));

    vm.expectRevert(InvalidAddress.selector);
    castora.initialize(address(poolsManager), address(0));
  }

  function testUpgradeSuccessWithRetainedData() public {
    // Store some data before upgrade
    bytes32 adminRole = castora.ADMIN_ROLE();
    castora.grantAdminRole(user);
    address originalPoolsManager = castora.poolsManager();
    address originalPoolsRules = castora.poolsRules();

    // Perform upgrade
    address newImplementation = address(new Castora());
    vm.expectEmit(true, true, true, false);
    emit IERC1967.Upgraded(newImplementation);
    castora.upgradeToAndCall(newImplementation, '');

    // Verify data is retained after upgrade
    assertTrue(castora.hasRole(adminRole, user));
    assertEq(castora.poolsManager(), originalPoolsManager);
    assertEq(castora.poolsRules(), originalPoolsRules);
    assertEq(castora.owner(), owner);
  }
}
