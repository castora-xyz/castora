// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {IAccessControl} from '@openzeppelin/contracts/access/IAccessControl.sol';
import {ERC1967Proxy} from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import {PausableUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import {Test} from 'forge-std/Test.sol';
import {Castora} from '../src/Castora.sol';
import {CastoraActivities} from '../src/CastoraActivities.sol';
import {CastoraErrors} from '../src/CastoraErrors.sol';
import {CastoraEvents} from '../src/CastoraEvents.sol';
import {CastoraGetters} from '../src/CastoraGetters.sol';
import {CastoraPoolsManager} from '../src/CastoraPoolsManager.sol';
import {CastoraPoolsRules} from '../src/CastoraPoolsRules.sol';
import {CastoraStructs} from '../src/CastoraStructs.sol';
import {cUSD} from '../src/cUSD.sol';

contract CastoraCreatePoolTest is CastoraErrors, CastoraEvents, CastoraStructs, Test {
  CastoraActivities activities;
  Castora castora;
  CastoraGetters getters;
  CastoraPoolsManager poolsManager;
  CastoraPoolsRules poolsRules;
  cUSD cusd;
  address feeCollector;
  address admin;
  address user;
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
    feeCollector = makeAddr('feeCollector');
    admin = makeAddr('admin');
    user = makeAddr('user');

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

    // Grant admin role to admin address
    castora.grantAdminRole(admin);

    // Set up valid pool seeds
    validSeedsERC20 = getPoolSeeds(address(cusd));
    validSeedsNative = getPoolSeeds(address(castora));

    // Configure pools rules to allow these tokens and amounts
    poolsRules.updateAllowedPredictionToken(address(cusd), true);
    poolsRules.allowStakeToken(address(cusd), 1000000);
    poolsRules.allowStakeToken(address(castora), 1 ether);
    poolsRules.updateAllowedPoolMultiplier(200, true);
  }

  function testRevertPausedCreatePool() public {
    castora.pause();
    assertTrue(castora.paused());

    vm.prank(admin);
    vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
    castora.createPool(validSeedsERC20);
  }

  function testRevertNotAdminCreatePool() public {
    vm.expectRevert(
      abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, user, castora.ADMIN_ROLE())
    );
    vm.prank(user);
    castora.createPool(validSeedsERC20);
  }

  function testRevertExistingPoolCreatePool() public {
    // Create the first pool
    vm.prank(admin);
    uint256 poolId1 = castora.createPool(validSeedsERC20);
    assertEq(poolId1, 1);

    // Try to create the same pool again (same seeds)
    vm.prank(admin);
    vm.expectRevert(PoolExistsAlready.selector);
    castora.createPool(validSeedsERC20);
  }

  function testCreatePoolSuccessNativeTokenStake() public {
    // Get initial stats
    AllPredictionStats memory statsBefore = getters.allStats();

    // Expected pool ID
    uint256 expectedPoolId = statsBefore.noOfPools + 1;

    // Calculate expected seeds hash
    bytes32 expectedSeedsHash = castora.hashPoolSeeds(validSeedsNative);

    // Create pool and expect events
    vm.prank(admin);
    vm.expectEmit(true, true, false, false);
    emit PoolCreated(expectedPoolId, expectedSeedsHash);
    uint256 poolId = castora.createPool(validSeedsNative);

    // Verify pool creation
    assertEq(poolId, expectedPoolId);

    // Verify pool data
    Pool memory pool = castora.getPool(poolId);
    assertEq(pool.poolId, expectedPoolId);
    assertEq(pool.seeds.predictionToken, validSeedsNative.predictionToken);
    assertEq(pool.seeds.stakeToken, validSeedsNative.stakeToken);
    assertEq(pool.seeds.stakeAmount, validSeedsNative.stakeAmount);
    assertEq(pool.seeds.snapshotTime, validSeedsNative.snapshotTime);
    assertEq(pool.seeds.windowCloseTime, validSeedsNative.windowCloseTime);
    assertEq(pool.seeds.feesPercent, validSeedsNative.feesPercent);
    assertEq(pool.seeds.multiplier, validSeedsNative.multiplier);
    assertEq(pool.seedsHash, expectedSeedsHash);
    assertEq(pool.creationTime, block.timestamp);
    assertEq(pool.noOfPredictions, 0);
    assertEq(pool.completionTime, 0);

    // Verify global stats updated
    AllPredictionStats memory statsAfter = getters.allStats();
    assertEq(statsAfter.noOfPools, statsBefore.noOfPools + 1);

    // Verify prediction token arrays
    address[] memory predictionTokens = getters.predictionTokensPaginated(0, 10);
    assertEq(predictionTokens.length, 1);
    assertEq(predictionTokens[0], validSeedsNative.predictionToken);

    // Verify prediction token details
    PredictionTokenDetails memory predictionTokenDetails =
      getters.predictionTokenDetails(validSeedsNative.predictionToken);
    assertEq(predictionTokenDetails.noOfPools, 1);

    // Verify stake token arrays
    address[] memory stakeTokens = getters.stakeTokensPaginated(0, 10);
    assertEq(stakeTokens.length, 1);
    assertEq(stakeTokens[0], validSeedsNative.stakeToken);

    // Verify stake token details
    StakeTokenDetails memory stakeTokenDetails = getters.stakeTokenDetails(validSeedsNative.stakeToken);
    assertEq(stakeTokenDetails.noOfPools, 1);

    // Verify pools can be retrieved by seeds hash
    bytes32 seedsHash = castora.hashPoolSeeds(validSeedsNative);
    uint256 retrievedPoolId = castora.poolIdsBySeedsHashes(seedsHash);
    assertEq(retrievedPoolId, poolId);
  }

  function testCreatePoolSuccessERC20TokenStake() public {
    // Get initial stats
    AllPredictionStats memory statsBefore = getters.allStats();

    // Expected pool ID
    uint256 expectedPoolId = statsBefore.noOfPools + 1;

    // Calculate expected seeds hash
    bytes32 expectedSeedsHash = castora.hashPoolSeeds(validSeedsERC20);

    // Create pool and expect events
    // not pranking to allow owner (this Test contract) to create pool as owner has admin role,
    // like testing that flow
    vm.expectEmit(true, true, false, false);
    emit PoolCreated(expectedPoolId, expectedSeedsHash);
    uint256 poolId = castora.createPool(validSeedsERC20);

    // Verify pool creation
    assertEq(poolId, expectedPoolId);

    // Verify pool data
    Pool memory pool = castora.getPool(poolId);
    assertEq(pool.poolId, expectedPoolId);
    assertEq(pool.seeds.predictionToken, validSeedsERC20.predictionToken);
    assertEq(pool.seeds.stakeToken, validSeedsERC20.stakeToken);
    assertEq(pool.seeds.stakeAmount, validSeedsERC20.stakeAmount);
    assertEq(pool.seeds.snapshotTime, validSeedsERC20.snapshotTime);
    assertEq(pool.seeds.windowCloseTime, validSeedsERC20.windowCloseTime);
    assertEq(pool.seeds.feesPercent, validSeedsERC20.feesPercent);
    assertEq(pool.seeds.multiplier, validSeedsERC20.multiplier);
    assertEq(pool.seedsHash, expectedSeedsHash);
    assertEq(pool.creationTime, block.timestamp);

    // Verify global stats updated
    AllPredictionStats memory statsAfter = getters.allStats();
    assertEq(statsAfter.noOfPools, statsBefore.noOfPools + 1);

    // Verify token arrays updated if this is first time using these tokens
    if (statsBefore.noOfPredictionTokens == 0) {
      assertEq(statsAfter.noOfPredictionTokens, 1);
    }
    if (statsBefore.noOfStakeTokens == 0) {
      assertEq(statsAfter.noOfStakeTokens, 1);
    }

    // Verify prediction token arrays
    address[] memory predictionTokens = getters.predictionTokensPaginated(0, 10);
    assertEq(predictionTokens.length, 1);
    assertEq(predictionTokens[0], validSeedsERC20.predictionToken);

    // Verify prediction token details
    PredictionTokenDetails memory predictionTokenDetails =
      getters.predictionTokenDetails(validSeedsERC20.predictionToken);
    assertEq(predictionTokenDetails.noOfPools, 1);

    // Verify stake token arrays
    address[] memory stakeTokens = getters.stakeTokensPaginated(0, 10);
    assertEq(stakeTokens.length, 1);
    assertEq(stakeTokens[0], validSeedsERC20.stakeToken);

    // Verify stake token details
    StakeTokenDetails memory stakeTokenDetails = getters.stakeTokenDetails(validSeedsERC20.stakeToken);
    assertEq(stakeTokenDetails.noOfPools, 1);

    // Verify pools can be retrieved by seeds hash
    bytes32 seedsHash = castora.hashPoolSeeds(validSeedsERC20);
    uint256 retrievedPoolId = castora.poolIdsBySeedsHashes(seedsHash);
    assertEq(retrievedPoolId, poolId);
  }

  function testGetPools() public {
    uint256 poolId1 = castora.createPool(validSeedsNative);
    uint256 poolId2 = castora.createPool(validSeedsERC20);
    uint256[] memory poolIds = new uint256[](2);
    poolIds[0] = poolId1;
    poolIds[1] = poolId2;
    Pool[] memory pools = getters.pools(poolIds);
    assertEq(pools.length, 2);
    assertEq(pools[0].poolId, poolId1);
    assertEq(pools[1].poolId, poolId2);
  }
}
