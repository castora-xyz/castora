// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {ERC1967Proxy} from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {Test} from 'forge-std/Test.sol';
import {Castora} from '../src/Castora.sol';
import {CastoraErrors} from '../src/CastoraErrors.sol';
import {CastoraEvents} from '../src/CastoraEvents.sol';
import {CastoraPoolsManager} from '../src/CastoraPoolsManager.sol';
import {CastoraPoolsRules} from '../src/CastoraPoolsRules.sol';
import {CastoraStructs} from '../src/CastoraStructs.sol';
import {cUSD} from '../src/cUSD.sol';

contract CastoraPoolsManagerUserTest is CastoraErrors, CastoraEvents, CastoraStructs, Test {
  CastoraPoolsManager poolsManager;
  Castora mockCastora;
  CastoraPoolsRules mockPoolsRules;
  cUSD creationFeeToken;
  cUSD predictionToken;
  cUSD stakeToken;

  address owner;
  address user1;
  address user2;
  address feeCollector;
  uint256 constant SPLIT_PERCENT = 5000; // 50%
  uint256 constant CREATION_FEE_AMOUNT = 100 * 10 ** 6; // 100 tokens with 6 decimals

  PoolSeeds validSeeds;

  function setUp() public {
    owner = address(this);
    user1 = makeAddr('user1');
    user2 = makeAddr('user2');
    feeCollector = makeAddr('feeCollector');

    // Deploy mock contracts
    mockCastora = Castora(payable(makeAddr('mockCastora')));
    mockPoolsRules = CastoraPoolsRules(makeAddr('mockPoolsRules'));

    // Deploy real tokens for testing
    creationFeeToken = new cUSD();
    predictionToken = new cUSD();
    stakeToken = new cUSD();

    // Deploy CastoraPoolsManager with proxy
    poolsManager = CastoraPoolsManager(payable(address(new ERC1967Proxy(address(new CastoraPoolsManager()), ''))));
    poolsManager.initialize(address(mockCastora), address(mockPoolsRules), feeCollector, SPLIT_PERCENT);

    // Set up creation fees for the token
    poolsManager.setCreationFees(address(creationFeeToken), CREATION_FEE_AMOUNT);

    // Set up valid pool seeds
    validSeeds = PoolSeeds({
      predictionToken: address(predictionToken),
      stakeToken: address(stakeToken),
      stakeAmount: 1000000, // 1 token with 6 decimals
      snapshotTime: block.timestamp + 1200,
      windowCloseTime: block.timestamp + 900
    });

    // Mint tokens to users
    creationFeeToken.mint(user1, 1000 * 10 ** 6);
    creationFeeToken.mint(user2, 1000 * 10 ** 6);

    // Give users approval to spend tokens
    vm.prank(user1);
    creationFeeToken.approve(address(poolsManager), type(uint256).max);
    vm.prank(user2);
    creationFeeToken.approve(address(poolsManager), type(uint256).max);
  }

  function testCreatePoolSuccess() public {
    uint256 expectedPoolId = 1;

    // Mock the rules validation to pass
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );

    // Mock the Castora contract to return a pool ID
    vm.mockCall(
      address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, validSeeds), abi.encode(expectedPoolId)
    );

    uint256 initialBalance = creationFeeToken.balanceOf(user1);

    // Expect the event to be emitted
    vm.expectEmit(true, true, true, true);
    emit UserHasCreatedPool(expectedPoolId, user1, address(creationFeeToken), CREATION_FEE_AMOUNT);

    // User creates a pool
    vm.prank(user1);
    uint256 poolId = poolsManager.createPool(validSeeds, address(creationFeeToken), 200, false);

    // Verify return value
    assertEq(poolId, expectedPoolId);

    // Verify token transfer
    assertEq(creationFeeToken.balanceOf(user1), initialBalance - CREATION_FEE_AMOUNT);
    assertEq(creationFeeToken.balanceOf(feeCollector), CREATION_FEE_AMOUNT);

    // Verify global statistics
    AllStats memory stats = poolsManager.getAllStats();
    assertEq(stats.noOfUsers, 1);
    assertEq(stats.noOfUserCreatedPools, 1);

    // Verify user statistics
    UserStats memory userStats = poolsManager.getUserStats(user1);
    assertEq(userStats.nthUserCount, 1);
    assertEq(userStats.noOfPoolsCreated, 1);
    assertEq(userStats.noOfPaidCreationFeesPools, 1);
    assertEq(userStats.noOfCreationFeeTokens, 1);

    // Verify user created pool details
    UserCreatedPool memory userPool = poolsManager.getUserCreatedPool(poolId);
    assertEq(userPool.creator, user1);
    assertEq(userPool.creationFeesToken, address(creationFeeToken));
    assertEq(userPool.completionFeesToken, address(stakeToken));
    assertEq(userPool.nthPoolCount, 1);
    assertEq(userPool.creationFeesAmount, CREATION_FEE_AMOUNT);
    assertEq(userPool.completionFeesPercent, SPLIT_PERCENT);
    assertTrue(userPool.creationTime > 0);
    assertEq(userPool.completionTime, 0);
    assertEq(userPool.creatorClaimTime, 0);
    assertEq(userPool.completionFeesAmount, 0);

    // Verify creation fee token statistics
    CreationFeesTokenInfo memory tokenInfo = poolsManager.getCreationFeesTokenInfo(address(creationFeeToken));
    assertEq(tokenInfo.totalUseCount, 1);
    assertEq(tokenInfo.totalAmountUsed, CREATION_FEE_AMOUNT);

    // Verify user creation token fees info
    UserCreationTokenFeesInfo memory userTokenInfo =
      poolsManager.getUserCreationTokenFeesInfo(user1, address(creationFeeToken));
    assertEq(userTokenInfo.amount, CREATION_FEE_AMOUNT);
    assertEq(userTokenInfo.count, 1);
  }

  function testCreatePoolMultipleUsers() public {
    uint256 poolId1 = 1;
    uint256 poolId2 = 2;

    // Mock the rules validation to pass
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );

    // Mock the Castora contract to return sequential pool IDs
    vm.mockCall(
      address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, validSeeds), abi.encode(poolId1)
    );

    // User1 creates a pool
    vm.prank(user1);
    uint256 returnedPoolId1 = poolsManager.createPool(validSeeds, address(creationFeeToken), 200, false);
    assertEq(returnedPoolId1, poolId1);

    // Mock for second pool
    vm.mockCall(
      address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, validSeeds), abi.encode(poolId2)
    );

    // User2 creates a pool
    vm.prank(user2);
    uint256 returnedPoolId2 = poolsManager.createPool(validSeeds, address(creationFeeToken), 200, false);
    assertEq(returnedPoolId2, poolId2);

    // Verify global statistics
    AllStats memory stats = poolsManager.getAllStats();
    assertEq(stats.noOfUsers, 2);
    assertEq(stats.noOfUserCreatedPools, 2);

    // Verify user1 is the 1st user
    UserStats memory user1Stats = poolsManager.getUserStats(user1);
    assertEq(user1Stats.nthUserCount, 1);

    // Verify user2 is the 2nd user
    UserStats memory user2Stats = poolsManager.getUserStats(user2);
    assertEq(user2Stats.nthUserCount, 2);
  }

  function testCreatePoolSameUserMultiplePools() public {
    // Mock the rules validation to pass
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );

    // Mock for first pool
    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, validSeeds), abi.encode(1));

    // User1 creates first pool
    vm.prank(user1);
    poolsManager.createPool(validSeeds, address(creationFeeToken), 200, false);

    // Mock for second pool
    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, validSeeds), abi.encode(2));

    // User1 creates second pool
    vm.prank(user1);
    poolsManager.createPool(validSeeds, address(creationFeeToken), 200, false);

    // Verify global statistics (only 1 unique user)
    AllStats memory stats = poolsManager.getAllStats();
    assertEq(stats.noOfUsers, 1);
    assertEq(stats.noOfUserCreatedPools, 2);

    // Verify user statistics
    UserStats memory userStats = poolsManager.getUserStats(user1);
    assertEq(userStats.nthUserCount, 1); // Still the 1st user
    assertEq(userStats.noOfPoolsCreated, 2); // But created 2 pools
    assertEq(userStats.noOfPaidCreationFeesPools, 2);

    // Verify user creation token fees (doubled)
    UserCreationTokenFeesInfo memory userTokenInfo =
      poolsManager.getUserCreationTokenFeesInfo(user1, address(creationFeeToken));
    assertEq(userTokenInfo.amount, CREATION_FEE_AMOUNT * 2);
    assertEq(userTokenInfo.count, 2);
  }

  function testCreatePoolWithNativeToken() public {
    // Set up native token as creation fee token, using contract address
    poolsManager.setCreationFees(address(poolsManager), 1 ether);

    // Mock the rules validation to pass
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );

    // Mock the Castora contract
    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, validSeeds), abi.encode(1));

    // Give user1 some ETH
    vm.deal(user1, 10 ether);

    uint256 initialBalance = user1.balance;

    // User creates a pool with ETH
    vm.prank(user1);
    uint256 poolId = poolsManager.createPool{value: 1 ether}(validSeeds, address(poolsManager), 200, false);

    // Verify ETH transfer
    assertEq(user1.balance, initialBalance - 1 ether);
    assertEq(feeCollector.balance, 1 ether);

    // Verify pool creation
    assertEq(poolId, 1);

    // Verify user created pool details
    UserCreatedPool memory userPool = poolsManager.getUserCreatedPool(poolId);
    assertEq(userPool.creationFeesToken, address(poolsManager));
    assertEq(userPool.creationFeesAmount, 1 ether);
  }

  function testCreatePoolFailsWhenPaused() public {
    // Pause the contract
    poolsManager.pause();

    // Attempt to create pool should fail
    vm.prank(user1);
    vm.expectRevert();
    poolsManager.createPool(validSeeds, address(creationFeeToken), 200, false);
  }

  function testCreatePoolFailsWithInvalidCreationFeeToken() public {
    vm.prank(user1);
    vm.expectRevert(InvalidAddress.selector);
    poolsManager.createPool(validSeeds, address(0), 200, false);
  }

  function testCreatePoolFailsWithDisallowedCreationFeeToken() public {
    address disallowedToken = makeAddr('disallowedToken');

    // Mock the rules validation to pass since we want to test the creation fee token validation
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );

    vm.prank(user1);
    vm.expectRevert(CreationFeeTokenNotAllowed.selector);
    poolsManager.createPool(validSeeds, disallowedToken, 200, false);
  }

  function testCreatePoolFailsWhenRulesValidationFails() public {
    // Mock the rules validation to fail
    vm.mockCallRevert(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encodeWithSignature('InvalidPoolTimes()')
    );

    vm.prank(user1);
    vm.expectRevert();
    poolsManager.createPool(validSeeds, address(creationFeeToken), 200, false);
  }

  function testCreatePoolFailsWithInsufficientNativeToken() public {
    // Set up native token as creation fee token, using contract address
    poolsManager.setCreationFees(address(poolsManager), 1 ether);

    // Mock the rules validation to pass
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );

    // Give user1 some ETH but send insufficient amount
    vm.deal(user1, 10 ether);

    vm.prank(user1);
    vm.expectRevert(InsufficientCreationFeeValue.selector);
    poolsManager.createPool{value: 0.5 ether}(validSeeds, address(poolsManager), 200, false);
  }

  function testCreatePoolFailsWithInsufficientERC20Allowance() public {
    // Remove approval
    vm.prank(user1);
    creationFeeToken.approve(address(poolsManager), 0);

    // Mock the rules validation to pass
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );

    vm.prank(user1);
    vm.expectRevert();
    poolsManager.createPool(validSeeds, address(creationFeeToken), 200, false);
  }

  function testCreatePoolFailsWhenCastoraCallFails() public {
    // Mock the rules validation to pass
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );

    // Mock the Castora contract to revert
    vm.mockCallRevert(
      address(mockCastora),
      abi.encodeWithSelector(Castora.createPool.selector, validSeeds),
      abi.encodeWithSignature('PoolExistsAlready()')
    );

    vm.prank(user1);
    vm.expectRevert();
    poolsManager.createPool(validSeeds, address(creationFeeToken), 200, false);
  }

  function testCreatePoolFailsForNonExistentPool() public {
    vm.expectRevert(InvalidPoolId.selector);
    poolsManager.getUserCreatedPool(999);
  }

  function testCreatePoolWithZeroFeeAmount() public {
    // Set up a token with zero fee
    address zeroFeeToken = makeAddr('zeroFeeToken');
    poolsManager.setCreationFees(zeroFeeToken, 0);

    // Mock the rules validation to pass
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );

    // Mock the Castora contract
    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, validSeeds), abi.encode(1));

    // User creates a pool with zero fee
    vm.prank(user1);
    uint256 poolId = poolsManager.createPool(validSeeds, zeroFeeToken, 200, false);

    // Verify pool creation
    assertEq(poolId, 1);

    // Verify user statistics for zero fee
    UserStats memory userStats = poolsManager.getUserStats(user1);
    assertEq(userStats.noOfPaidCreationFeesPools, 0); // No paid fees since it was zero

    // Verify user created pool details
    UserCreatedPool memory userPool = poolsManager.getUserCreatedPool(poolId);
    assertEq(userPool.creationFeesAmount, 0);
  }

  function testCreatePoolFailsWithIncorrectNativeTokenValue() public {
    // Set up native token as creation fee token, using contract address
    poolsManager.setCreationFees(address(poolsManager), 1 ether);

    // Mock the rules validation to pass
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );

    // Give user1 some ETH but send too much
    vm.deal(user1, 10 ether);

    vm.prank(user1);
    vm.expectRevert(IncorrectCreationFeeValue.selector);
    poolsManager.createPool{value: 2 ether}(validSeeds, address(poolsManager), 200, false);
  }

  function testCreatePoolComprehensiveGetters() public {
    uint256 expectedPoolId = 1;

    // Mock the rules validation to pass
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );

    // Mock the Castora contract to return a pool ID
    vm.mockCall(
      address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, validSeeds), abi.encode(expectedPoolId)
    );

    // User creates a pool
    vm.prank(user1);
    uint256 poolId = poolsManager.createPool(validSeeds, address(creationFeeToken), 200, false);

    // Test all getter functions for comprehensive coverage

    // Test getAllConfig
    AllConfig memory config = poolsManager.getAllConfig();
    assertEq(config.castora, address(mockCastora));
    assertEq(config.poolsRules, address(mockPoolsRules));
    assertEq(config.feeCollector, feeCollector);
    assertEq(config.completionPoolFeesSplitPercent, SPLIT_PERCENT);

    // Test getAllStats
    AllStats memory stats = poolsManager.getAllStats();
    assertEq(stats.noOfUsers, 1);
    assertEq(stats.noOfUserCreatedPools, 1);
    assertEq(stats.noOfCreationFeesTokens, 1);

    // Test isCreationFeeTokenAllowed
    assertTrue(poolsManager.isCreationFeeTokenAllowed(address(creationFeeToken)));
    assertFalse(poolsManager.isCreationFeeTokenAllowed(makeAddr('randomToken')));

    // Test getCreationFeeAmount
    assertEq(poolsManager.getCreationFeeAmount(address(creationFeeToken)), CREATION_FEE_AMOUNT);
    assertEq(poolsManager.getCreationFeeAmount(makeAddr('randomToken')), 0);

    // Test doesUserCreatedPoolExist
    assertTrue(poolsManager.doesUserCreatedPoolExist(poolId));
    assertFalse(poolsManager.doesUserCreatedPoolExist(999));

    // Test userCreatedPoolIds array length (since we can't access the array directly)
    uint256[] memory userPoolIds = poolsManager.getUserCreatedPoolIdsPaginated(user1, 0, 10);
    assertEq(userPoolIds.length, 1);
    assertEq(userPoolIds[0], poolId);

    // Test getAllCreationFeesTokens
    address[] memory creationTokens = poolsManager.getAllCreationFeesTokens();
    assertEq(creationTokens.length, 1);
    assertEq(creationTokens[0], address(creationFeeToken));

    // Test getAllCompletionFeesTokens (should be empty initially)
    address[] memory completionTokens = poolsManager.getAllCompletionFeesTokens();
    assertEq(completionTokens.length, 0);

    // Test getUserPoolCreationFeesTokens
    address[] memory userCreationTokens = poolsManager.getUserPoolCreationFeesTokens(user1);
    assertEq(userCreationTokens.length, 1);
    assertEq(userCreationTokens[0], address(creationFeeToken));

    // Test getUserPoolCompletionFeesTokens (should be empty initially)
    address[] memory userCompletionTokens = poolsManager.getUserPoolCompletionFeesTokens(user1);
    assertEq(userCompletionTokens.length, 0);

    // Test getUserCreatedPools
    UserCreatedPool[] memory createdPools = poolsManager.getUserCreatedPools(userPoolIds);
    assertEq(createdPools.length, 1);
    assertEq(createdPools[0].multiplier, 200);
    assertEq(createdPools[0].isUnlisted, false);

    // Test getUserCreatedPools revert InvalidPoolId
    uint256[] memory invalidIds = new uint256[](1);
    invalidIds[0] = 10;
    vm.expectRevert(InvalidPoolId.selector);
    poolsManager.getUserCreatedPools(invalidIds);
  }

  function testCreatePoolPaginationGetters() public {
    // Create multiple pools for pagination testing
    uint256[] memory poolIds = new uint256[](5);

    // Mock the rules validation to pass
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );

    // Create 5 pools
    for (uint256 i = 0; i < 5; i++) {
      poolIds[i] = i + 1;
      vm.mockCall(
        address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, validSeeds), abi.encode(poolIds[i])
      );

      vm.prank(user1);
      poolsManager.createPool(validSeeds, address(creationFeeToken), 200, false);
    }

    // Test getUserCreatedPoolIdsPaginated
    uint256[] memory paginatedIds = poolsManager.getUserCreatedPoolIdsPaginated(user1, 0, 3);
    assertEq(paginatedIds.length, 3);
    assertEq(paginatedIds[0], poolIds[0]);
    assertEq(paginatedIds[1], poolIds[1]);
    assertEq(paginatedIds[2], poolIds[2]);

    // Test second page
    uint256[] memory secondPage = poolsManager.getUserCreatedPoolIdsPaginated(user1, 3, 3);
    assertEq(secondPage.length, 2);
    assertEq(secondPage[0], poolIds[3]);
    assertEq(secondPage[1], poolIds[4]);

    // Test getAllCreatedPoolIdsPaginated
    uint256[] memory allPaginated = poolsManager.getAllCreatedPoolIdsPaginated(0, 10);
    assertEq(allPaginated.length, 5);

    // Test getAllUsersPaginated
    address[] memory paginatedUsers = poolsManager.getAllUsersPaginated(0, 10);
    assertEq(paginatedUsers.length, 1);
    assertEq(paginatedUsers[0], user1);

    // Test pagination beyond bounds
    uint256[] memory emptyPage = poolsManager.getUserCreatedPoolIdsPaginated(user1, 10, 3);
    assertEq(emptyPage.length, 0);

    // Test getUserPaidCreatedPoolIdsPaginated
    uint256[] memory paidPoolIds = poolsManager.getUserPaidCreatedPoolIdsPaginated(user1, 0, 10);
    assertEq(paidPoolIds.length, 5);
    for (uint256 i = 0; i < 5; i++) {
      assertEq(paidPoolIds[i], poolIds[i]);
    }

    // Test pagination for paid pools
    uint256[] memory paidFirstPage = poolsManager.getUserPaidCreatedPoolIdsPaginated(user1, 0, 3);
    assertEq(paidFirstPage.length, 3);
    assertEq(paidFirstPage[0], poolIds[0]);
    assertEq(paidFirstPage[1], poolIds[1]);
    assertEq(paidFirstPage[2], poolIds[2]);

    uint256[] memory paidSecondPage = poolsManager.getUserPaidCreatedPoolIdsPaginated(user1, 3, 3);
    assertEq(paidSecondPage.length, 2);
    assertEq(paidSecondPage[0], poolIds[3]);
    assertEq(paidSecondPage[1], poolIds[4]);

    // Test pagination beyond bounds for paid pools
    uint256[] memory paidEmptyPage = poolsManager.getUserPaidCreatedPoolIdsPaginated(user1, 10, 3);
    assertEq(paidEmptyPage.length, 0);
  }
}
