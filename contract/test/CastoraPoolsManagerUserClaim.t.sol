// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import 'forge-std/Test.sol';
import '../src/CastoraPoolsManager.sol';
import '../src/Castora.sol';
import '../src/CastoraPoolsRules.sol';
import '../src/cUSD.sol';

contract RejectETH {
  receive() external payable {
    revert();
  }
}

contract CastoraPoolsManagerUserClaimTest is Test {
  CastoraPoolsManager poolsManager;
  Castora mockCastora;
  CastoraPoolsRules mockPoolsRules;
  cUSD creationFeeToken;
  cUSD predictionToken;
  cUSD stakeToken;
  RejectETH rejectETHContract;

  address owner;
  address user1;
  address user2;
  address user3;
  address feeCollector;
  address rejectETHFeeCollector;
  uint256 constant SPLIT_PERCENT = 5000; // 50%
  uint256 constant CREATION_FEE_AMOUNT = 100 * 10 ** 6; // 100 tokens with 6 decimals
  uint256 constant STAKE_AMOUNT = 1000000; // 1 token with 6 decimals
  uint256 constant NUM_PREDICTIONS = 10;
  uint256 constant NUM_WINNERS = 3; // Changed from 5 to 3 to create profit
  uint256 constant WIN_AMOUNT = 2 * STAKE_AMOUNT; // 2x stake amount

  PoolSeeds validSeeds;
  Pool mockPool;

  function setUp() public {
    owner = address(this);
    user1 = makeAddr('user1');
    user2 = makeAddr('user2');
    user3 = makeAddr('user3');
    feeCollector = makeAddr('feeCollector');

    // Deploy RejectETH contract
    rejectETHContract = new RejectETH();
    rejectETHFeeCollector = address(rejectETHContract);

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
      stakeAmount: STAKE_AMOUNT,
      snapshotTime: block.timestamp + 1200,
      windowCloseTime: block.timestamp + 900
    });

    // Set up mock pool structure
    mockPool = Pool({
      poolId: 1,
      seeds: validSeeds,
      seedsHash: keccak256(abi.encode(validSeeds)),
      creationTime: block.timestamp,
      noOfPredictions: NUM_PREDICTIONS,
      snapshotPrice: 100000000, // $1.00 with 8 decimals
      completionTime: block.timestamp + 1500,
      winAmount: WIN_AMOUNT,
      noOfWinners: NUM_WINNERS,
      noOfClaimedWinnings: 0
    });

    // Mint tokens to users
    creationFeeToken.mint(user1, 1000 * 10 ** 6);
    creationFeeToken.mint(user2, 1000 * 10 ** 6);
    creationFeeToken.mint(user3, 1000 * 10 ** 6);

    // Mint stake tokens to contract for fee distribution
    stakeToken.mint(address(poolsManager), 10000 * 10 ** 6);

    // Give users approval to spend tokens
    vm.prank(user1);
    creationFeeToken.approve(address(poolsManager), type(uint256).max);
    vm.prank(user2);
    creationFeeToken.approve(address(poolsManager), type(uint256).max);
    vm.prank(user3);
    creationFeeToken.approve(address(poolsManager), type(uint256).max);

    // Mock the rules validation to pass
    vm.mockCall(
      address(mockPoolsRules),
      abi.encodeWithSelector(CastoraPoolsRules.validateCreatePool.selector, validSeeds),
      abi.encode()
    );
    vm.mockCall(
      address(mockPoolsRules), abi.encodeWithSelector(CastoraPoolsRules.validateMultiplier.selector, 200), abi.encode()
    );
  }

  function _createPoolForUser(address user, uint256 poolId) internal {
    // Mock the Castora contract to return the pool ID
    vm.mockCall(
      address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, validSeeds), abi.encode(poolId)
    );

    // User creates a pool
    vm.prank(user);
    poolsManager.createPool(validSeeds, address(creationFeeToken), 200, false);
  }

  function _setupCompletedPool(uint256 poolId, uint256 /* totalFees */ ) internal {
    // Update mock pool with completion data
    Pool memory completedPool = mockPool;
    completedPool.poolId = poolId;
    completedPool.completionTime = block.timestamp + 1500;

    // Mock the Castora getPool call
    vm.mockCall(
      address(mockCastora), abi.encodeWithSelector(Castora.getPool.selector, poolId), abi.encode(completedPool)
    );

    // Warp to after completion time
    vm.warp(block.timestamp + 1600);
  }

  function testReceivingOfNativeTokens() public {
    vm.deal(user1, 1 ether);
    vm.prank(user1);

    vm.expectEmit(true, false, false, true);
    emit ReceivedWasCalled(user1, 1 ether);
    (payable(poolsManager).call{value: 1 ether}(''));
  }

  // ========== PROCESS POOL COMPLETION TESTS ==========

  function testProcessPoolCompletionUserCreatedPool() public {
    uint256 poolId = 1;
    _createPoolForUser(user1, poolId);

    // Calculate total fees: (stakeAmount * noOfPredictions) - (winAmount * noOfWinners)
    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);
    uint256 userShare = (totalFees * SPLIT_PERCENT) / 10000;
    uint256 castoraShare = totalFees - userShare;

    _setupCompletedPool(poolId, totalFees);

    uint256 initialFeeCollectorBalance = stakeToken.balanceOf(feeCollector);

    // Expect the event to be emitted
    vm.expectEmit(true, true, true, true);
    emit IssuedCompletionFees(poolId, address(stakeToken), userShare);

    // Process pool completion
    poolsManager.processPoolCompletion(poolId);

    // Verify Castora's share was sent to fee collector
    assertEq(stakeToken.balanceOf(feeCollector), initialFeeCollectorBalance + castoraShare);

    // Verify user pool was updated
    UserCreatedPool memory userPool = poolsManager.getUserCreatedPool(poolId);
    assertEq(userPool.completionTime, block.timestamp);
    assertEq(userPool.completionFeesAmount, userShare);

    // Verify global stats were updated
    AllStats memory stats = poolsManager.getAllStats();
    assertEq(stats.noOfClaimableFeesPools, 1);
    assertEq(stats.noOfCompletionFeesTokens, 1);

    // Verify user stats were updated
    UserStats memory userStats = poolsManager.getUserStats(user1);
    assertEq(userStats.noOfClaimableCompletionFeesPools, 1);
    assertEq(userStats.noOfCompletionFeeTokens, 1);

    // Verify completion token info was updated
    CompletionFeesTokenInfo memory tokenInfo = poolsManager.getCompletionFeesTokenInfo(address(stakeToken));
    assertEq(tokenInfo.totalUseCount, 1);
    assertEq(tokenInfo.totalAmountIssued, userShare);

    // Verify user completion token fees info
    UserCompletionTokenFeesInfo memory userTokenInfo =
      poolsManager.getUserCompletionTokenFeesInfo(user1, address(stakeToken));
    assertEq(userTokenInfo.claimableAmount, userShare);
    assertEq(userTokenInfo.count, 1);
  }

  function testProcessPoolCompletionNonUserCreatedPool() public {
    uint256 poolId = 999; // Pool not created by any user
    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);

    _setupCompletedPool(poolId, totalFees);

    uint256 initialFeeCollectorBalance = stakeToken.balanceOf(feeCollector);

    // Process pool completion for non-user pool
    poolsManager.processPoolCompletion(poolId);

    // Verify all fees were sent to fee collector
    assertEq(stakeToken.balanceOf(feeCollector), initialFeeCollectorBalance + totalFees);

    // Verify the pool is marked as processed
    assertTrue(poolsManager.nonUserPoolHasCollectedFees(poolId));
  }

  function testProcessPoolCompletionRevertNotCompleted() public {
    uint256 poolId = 1;
    _createPoolForUser(user1, poolId);

    // Mock pool as not completed (completionTime = 0)
    Pool memory uncompletedPool = mockPool;
    uncompletedPool.poolId = poolId;
    uncompletedPool.completionTime = 0;

    vm.mockCall(
      address(mockCastora), abi.encodeWithSelector(Castora.getPool.selector, poolId), abi.encode(uncompletedPool)
    );

    // Should revert
    vm.expectRevert(PoolNotYetCompleted.selector);
    poolsManager.processPoolCompletion(poolId);
  }

  function testProcessPoolCompletionRevertAlreadyProcessedUserPool() public {
    uint256 poolId = 1;
    _createPoolForUser(user1, poolId);

    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);
    _setupCompletedPool(poolId, totalFees);

    // Process once
    poolsManager.processPoolCompletion(poolId);

    // Try to process again - should revert
    vm.expectRevert(PoolCompletionAlreadyProcessed.selector);
    poolsManager.processPoolCompletion(poolId);
  }

  function testProcessPoolCompletionRevertAlreadyProcessedNonUserPool() public {
    uint256 poolId = 999;
    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);

    _setupCompletedPool(poolId, totalFees);

    // Process once
    poolsManager.processPoolCompletion(poolId);

    // Try to process again - should revert
    vm.expectRevert(PoolCompletionAlreadyProcessed.selector);
    poolsManager.processPoolCompletion(poolId);
  }

  // ========== CLAIM SINGLE POOL TESTS ==========

  function testClaimPoolCompletionFeesSuccess() public {
    uint256 poolId = 1;
    _createPoolForUser(user1, poolId);

    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);
    uint256 userShare = (totalFees * SPLIT_PERCENT) / 10000;

    _setupCompletedPool(poolId, totalFees);

    // Process pool completion first
    poolsManager.processPoolCompletion(poolId);

    uint256 initialUserBalance = stakeToken.balanceOf(user1);

    // Expect the event to be emitted
    vm.expectEmit(true, true, true, true);
    emit ClaimedCompletionFees(poolId, user1, address(stakeToken), userShare);

    // User claims fees
    vm.prank(user1);
    poolsManager.claimPoolCompletionFees(poolId);

    // Verify user received tokens
    assertEq(stakeToken.balanceOf(user1), initialUserBalance + userShare);

    // Verify pool was updated
    UserCreatedPool memory userPool = poolsManager.getUserCreatedPool(poolId);
    assertEq(userPool.creatorClaimTime, block.timestamp);

    // Verify global stats were updated
    AllStats memory stats = poolsManager.getAllStats();
    assertEq(stats.noOfClaimedFeesPools, 1);
    assertEq(stats.noOfClaimableFeesPools, 0);

    // Verify user stats were updated
    UserStats memory userStats = poolsManager.getUserStats(user1);
    assertEq(userStats.noOfClaimedCompletionFeesPools, 1);
    assertEq(userStats.noOfClaimableCompletionFeesPools, 0);

    // Verify completion token info was updated
    CompletionFeesTokenInfo memory tokenInfo = poolsManager.getCompletionFeesTokenInfo(address(stakeToken));
    assertEq(tokenInfo.totalAmountClaimed, userShare);

    // Verify user completion token fees info
    UserCompletionTokenFeesInfo memory userTokenInfo =
      poolsManager.getUserCompletionTokenFeesInfo(user1, address(stakeToken));
    assertEq(userTokenInfo.claimedAmount, userShare);
    assertEq(userTokenInfo.claimableAmount, 0);
  }

  function testClaimPoolCompletionFeesRevertNotYourPool() public {
    uint256 poolId = 1;
    _createPoolForUser(user1, poolId);

    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);
    _setupCompletedPool(poolId, totalFees);
    poolsManager.processPoolCompletion(poolId);

    // User2 tries to claim user1's pool
    vm.expectRevert(NotYourPool.selector);
    vm.prank(user2);
    poolsManager.claimPoolCompletionFees(poolId);
  }

  function testClaimPoolCompletionFeesRevertNotCompleted() public {
    uint256 poolId = 1;
    _createPoolForUser(user1, poolId);

    // Try to claim before processing completion
    vm.expectRevert(PoolNotYetCompleted.selector);
    vm.prank(user1);
    poolsManager.claimPoolCompletionFees(poolId);
  }

  function testClaimPoolCompletionFeesRevertAlreadyClaimed() public {
    uint256 poolId = 1;
    _createPoolForUser(user1, poolId);

    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);
    _setupCompletedPool(poolId, totalFees);
    poolsManager.processPoolCompletion(poolId);

    // Claim once
    vm.prank(user1);
    poolsManager.claimPoolCompletionFees(poolId);

    // Try to claim again
    vm.expectRevert(AlreadyClaimedCompletionFees.selector);
    vm.prank(user1);
    poolsManager.claimPoolCompletionFees(poolId);
  }

  function testClaimPoolCompletionFeesRevertZeroAmount() public {
    uint256 poolId = 1;
    _createPoolForUser(user1, poolId);

    // Setup a pool with zero fees (break even scenario)
    Pool memory zeroFeesPool = mockPool;
    zeroFeesPool.poolId = poolId;
    zeroFeesPool.completionTime = block.timestamp + 1500;
    zeroFeesPool.noOfPredictions = 5;
    zeroFeesPool.noOfWinners = 5;
    zeroFeesPool.winAmount = STAKE_AMOUNT; // Winners get exactly what they staked
    // totalFees = (1000000 * 5) - (1000000 * 5) = 0

    vm.mockCall(
      address(mockCastora), abi.encodeWithSelector(Castora.getPool.selector, poolId), abi.encode(zeroFeesPool)
    );

    vm.warp(block.timestamp + 1600);
    poolsManager.processPoolCompletion(poolId);

    // Try to claim zero amount
    vm.expectRevert(ZeroAmountSpecified.selector);
    vm.prank(user1);
    poolsManager.claimPoolCompletionFees(poolId);
  }

  // ========== BULK CLAIM TESTS ==========

  function testClaimPoolCompletionFeesBulkSuccess() public {
    // Create and process multiple pools
    uint256[] memory poolIds = new uint256[](3);
    poolIds[0] = 1;
    poolIds[1] = 2;
    poolIds[2] = 3;

    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);
    uint256 userShare = (totalFees * SPLIT_PERCENT) / 10000;

    for (uint256 i = 0; i < poolIds.length; i++) {
      _createPoolForUser(user1, poolIds[i]);
      _setupCompletedPool(poolIds[i], totalFees);
      poolsManager.processPoolCompletion(poolIds[i]);
    }

    uint256 initialUserBalance = stakeToken.balanceOf(user1);

    // Expect events for each pool
    for (uint256 i = 0; i < poolIds.length; i++) {
      vm.expectEmit(true, true, true, true);
      emit ClaimedCompletionFees(poolIds[i], user1, address(stakeToken), userShare);
    }

    // User claims all pools in bulk
    vm.prank(user1);
    poolsManager.claimPoolCompletionFeesBulk(poolIds);

    // Verify user received tokens for all pools
    assertEq(stakeToken.balanceOf(user1), initialUserBalance + (userShare * 3));

    // Verify all pools were updated
    for (uint256 i = 0; i < poolIds.length; i++) {
      UserCreatedPool memory userPool = poolsManager.getUserCreatedPool(poolIds[i]);
      assertEq(userPool.creatorClaimTime, block.timestamp);
    }

    // Verify global stats were updated
    AllStats memory stats = poolsManager.getAllStats();
    assertEq(stats.noOfClaimedFeesPools, 3);
    assertEq(stats.noOfClaimableFeesPools, 0);

    // Verify user stats were updated
    UserStats memory userStats = poolsManager.getUserStats(user1);
    assertEq(userStats.noOfClaimedCompletionFeesPools, 3);
    assertEq(userStats.noOfClaimableCompletionFeesPools, 0);
  }

  function testClaimPoolCompletionFeesBulkMixedOwnership() public {
    // Create pools for different users
    uint256 poolId1 = 1;
    uint256 poolId2 = 2;
    uint256 poolId3 = 3;

    _createPoolForUser(user1, poolId1);
    _createPoolForUser(user2, poolId2);
    _createPoolForUser(user1, poolId3);

    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);

    _setupCompletedPool(poolId1, totalFees);
    _setupCompletedPool(poolId2, totalFees);
    _setupCompletedPool(poolId3, totalFees);

    poolsManager.processPoolCompletion(poolId1);
    poolsManager.processPoolCompletion(poolId2);
    poolsManager.processPoolCompletion(poolId3);

    // User1 tries to claim all pools (including user2's pool)
    uint256[] memory poolIds = new uint256[](3);
    poolIds[0] = poolId1;
    poolIds[1] = poolId2; // This belongs to user2
    poolIds[2] = poolId3;

    // Should revert when trying to claim pool that doesn't belong to user1
    vm.expectRevert(NotYourPool.selector);
    vm.prank(user1);
    poolsManager.claimPoolCompletionFeesBulk(poolIds);
  }

  function testClaimPoolCompletionFeesBulkPartiallyProcessed() public {
    // Create pools but only process some
    uint256 poolId1 = 1;
    uint256 poolId2 = 2;

    _createPoolForUser(user1, poolId1);
    _createPoolForUser(user1, poolId2);

    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);

    // Only setup and process first pool
    _setupCompletedPool(poolId1, totalFees);
    poolsManager.processPoolCompletion(poolId1);

    // Don't process second pool - mock it as not completed
    Pool memory uncompletedPool = mockPool;
    uncompletedPool.poolId = poolId2;
    uncompletedPool.completionTime = 0;

    vm.mockCall(
      address(mockCastora), abi.encodeWithSelector(Castora.getPool.selector, poolId2), abi.encode(uncompletedPool)
    );

    uint256[] memory poolIds = new uint256[](2);
    poolIds[0] = poolId1;
    poolIds[1] = poolId2; // Not yet completed

    // Should revert when trying to claim unprocessed pool
    vm.expectRevert(PoolNotYetCompleted.selector);
    vm.prank(user1);
    poolsManager.claimPoolCompletionFeesBulk(poolIds);
  }

  // ========== GETTER FUNCTION TESTS ==========

  function testGetUserPoolCompletionFeesTokens() public {
    // Deploy additional token
    cUSD anotherToken = new cUSD();
    anotherToken.mint(address(poolsManager), 10000 * 10 ** 6);

    // Create pool with first token
    uint256 poolId1 = 1;
    _createPoolForUser(user1, poolId1);

    // Create pool with different stake token
    PoolSeeds memory differentSeeds = validSeeds;
    differentSeeds.stakeToken = address(anotherToken);

    vm.mockCall(
      address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, differentSeeds), abi.encode(2)
    );

    vm.prank(user1);
    poolsManager.createPool(differentSeeds, address(creationFeeToken), 200, false);

    // Process both pools
    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);

    _setupCompletedPool(poolId1, totalFees);
    poolsManager.processPoolCompletion(poolId1);

    // Setup second pool with different token
    Pool memory pool2 = mockPool;
    pool2.poolId = 2;
    pool2.seeds = differentSeeds;
    pool2.completionTime = block.timestamp + 1500;

    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.getPool.selector, 2), abi.encode(pool2));

    poolsManager.processPoolCompletion(2);

    // Check completion fee tokens for user
    address[] memory completionTokens = poolsManager.getUserPoolCompletionFeesTokens(user1);
    assertEq(completionTokens.length, 2);

    // Tokens should be in the order they were first encountered
    assertEq(completionTokens[0], address(stakeToken));
    assertEq(completionTokens[1], address(anotherToken));
  }

  function testGetAllCompletionFeesTokens() public {
    // Initially should be empty
    address[] memory initialTokens = poolsManager.getAllCompletionFeesTokens();
    assertEq(initialTokens.length, 0);

    // Create and process a pool
    uint256 poolId = 1;
    _createPoolForUser(user1, poolId);

    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);
    _setupCompletedPool(poolId, totalFees);
    poolsManager.processPoolCompletion(poolId);

    // Should now have one token
    address[] memory tokens = poolsManager.getAllCompletionFeesTokens();
    assertEq(tokens.length, 1);
    assertEq(tokens[0], address(stakeToken));
  }

  function testGetUserCompletionTokenFeesInfoAfterClaim() public {
    uint256 poolId = 1;
    _createPoolForUser(user1, poolId);

    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);
    uint256 userShare = (totalFees * SPLIT_PERCENT) / 10000;

    _setupCompletedPool(poolId, totalFees);
    poolsManager.processPoolCompletion(poolId);

    // Check info before claim
    UserCompletionTokenFeesInfo memory infoBefore =
      poolsManager.getUserCompletionTokenFeesInfo(user1, address(stakeToken));
    assertEq(infoBefore.claimableAmount, userShare);
    assertEq(infoBefore.claimedAmount, 0);
    assertEq(infoBefore.count, 1);

    // Claim fees
    vm.prank(user1);
    poolsManager.claimPoolCompletionFees(poolId);

    // Check info after claim
    UserCompletionTokenFeesInfo memory infoAfter =
      poolsManager.getUserCompletionTokenFeesInfo(user1, address(stakeToken));
    assertEq(infoAfter.claimableAmount, 0);
    assertEq(infoAfter.claimedAmount, userShare);
    assertEq(infoAfter.count, 1);
  }

  function testPaginationFunctionsForClaimable() public {
    // Create multiple pools
    uint256 numPools = 5;
    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);

    for (uint256 i = 1; i <= numPools; i++) {
      _createPoolForUser(user1, i);
      _setupCompletedPool(i, totalFees);
      poolsManager.processPoolCompletion(i);
    }

    // Test pagination for user claimable fees
    uint256[] memory page1 = poolsManager.getUserClaimableFeesPoolIdsPaginated(user1, 0, 3);
    assertEq(page1.length, 3);
    assertEq(page1[0], 1);
    assertEq(page1[1], 2);
    assertEq(page1[2], 3);

    uint256[] memory page2 = poolsManager.getUserClaimableFeesPoolIdsPaginated(user1, 3, 3);
    assertEq(page2.length, 2); // Only 2 remaining
    assertEq(page2[0], 4);
    assertEq(page2[1], 5);

    // Test global claimable pagination
    uint256[] memory globalPage1 = poolsManager.getAllClaimablePoolIdsPaginated(0, 2);
    assertEq(globalPage1.length, 2);
    assertEq(globalPage1[0], 1);
    assertEq(globalPage1[1], 2);

    // Claim some pools and test claimed pagination
    vm.startPrank(user1);
    poolsManager.claimPoolCompletionFees(1);
    poolsManager.claimPoolCompletionFees(2);
    vm.stopPrank();

    uint256[] memory claimedPage = poolsManager.getUserClaimedFeesPoolIdsPaginated(user1, 0, 10);
    assertEq(claimedPage.length, 2);
    assertEq(claimedPage[0], 1);
    assertEq(claimedPage[1], 2);

    uint256[] memory globalClaimedPage = poolsManager.getAllClaimedPoolIdsPaginated(0, 10);
    assertEq(globalClaimedPage.length, 2);
    assertEq(globalClaimedPage[0], 1);
    assertEq(globalClaimedPage[1], 2);
  }

  // ========== ETH CLAIM TESTS ==========

  function testClaimPoolCompletionFeesETH() public {
    // Set up pool with ETH as stake token (using contract address)
    PoolSeeds memory ethSeeds = validSeeds;
    ethSeeds.stakeToken = address(mockCastora);

    uint256 poolId = 1;

    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, ethSeeds), abi.encode(poolId));

    vm.prank(user1);
    poolsManager.createPool(ethSeeds, address(creationFeeToken), 200, false);

    // Fund contract with ETH for fee distribution
    vm.deal(address(poolsManager), 10 ether);

    // Setup completed pool with ETH
    Pool memory ethPool = mockPool;
    ethPool.poolId = poolId;
    ethPool.seeds = ethSeeds;
    ethPool.completionTime = block.timestamp + 1500;

    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.getPool.selector, poolId), abi.encode(ethPool));

    vm.warp(block.timestamp + 1600);

    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);
    uint256 userShare = (totalFees * SPLIT_PERCENT) / 10000;

    // Process pool completion
    poolsManager.processPoolCompletion(poolId);

    uint256 initialUserETHBalance = user1.balance;

    // Claim ETH fees
    vm.prank(user1);
    poolsManager.claimPoolCompletionFees(poolId);

    // Verify user received ETH
    assertEq(user1.balance, initialUserETHBalance + userShare);
  }

  function testClaimPoolCompletionFeesBulkETH() public {
    // Set up multiple pools with ETH as stake token
    PoolSeeds memory ethSeeds = validSeeds;
    ethSeeds.stakeToken = address(mockCastora);

    uint256[] memory poolIds = new uint256[](2);
    poolIds[0] = 1;
    poolIds[1] = 2;

    for (uint256 i = 0; i < poolIds.length; i++) {
      vm.mockCall(
        address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, ethSeeds), abi.encode(poolIds[i])
      );

      vm.prank(user1);
      poolsManager.createPool(ethSeeds, address(creationFeeToken), 200, false);
    }

    // Fund contract with ETH
    vm.deal(address(poolsManager), 10 ether);

    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);
    uint256 userShare = (totalFees * SPLIT_PERCENT) / 10000;

    for (uint256 i = 0; i < poolIds.length; i++) {
      Pool memory ethPool = mockPool;
      ethPool.poolId = poolIds[i];
      ethPool.seeds = ethSeeds;
      ethPool.completionTime = block.timestamp + 1500;

      vm.mockCall(
        address(mockCastora), abi.encodeWithSelector(Castora.getPool.selector, poolIds[i]), abi.encode(ethPool)
      );

      poolsManager.processPoolCompletion(poolIds[i]);
    }

    vm.warp(block.timestamp + 1600);

    uint256 initialUserETHBalance = user1.balance;

    // Bulk claim ETH fees
    vm.prank(user1);
    poolsManager.claimPoolCompletionFeesBulk(poolIds);

    // Verify user received ETH for both pools
    assertEq(user1.balance, initialUserETHBalance + (userShare * 2));
  }

  // ========== FAILED ETH SEND TESTS ==========

  function testProcessPoolCompletionFailedETHSendToFeeCollector() public {
    // Set up pool with ETH as stake token (using contract address)
    PoolSeeds memory ethSeeds = validSeeds;
    ethSeeds.stakeToken = address(mockCastora);

    uint256 poolId = 1;

    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, ethSeeds), abi.encode(poolId));

    vm.prank(user1);
    poolsManager.createPool(ethSeeds, address(creationFeeToken), 200, false);

    // Update fee collector to the contract that rejects ETH
    poolsManager.setFeeCollector(rejectETHFeeCollector);

    // Fund contract with ETH for fee distribution
    vm.deal(address(poolsManager), 10 ether);

    // Setup completed pool with ETH
    Pool memory ethPool = mockPool;
    ethPool.poolId = poolId;
    ethPool.seeds = ethSeeds;
    ethPool.completionTime = block.timestamp + 1500;

    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.getPool.selector, poolId), abi.encode(ethPool));

    vm.warp(block.timestamp + 1600);

    // Process pool completion should revert with UnsuccessfulFeeCollection
    vm.expectRevert(UnsuccessfulFeeCollection.selector);
    poolsManager.processPoolCompletion(poolId);
  }

  function testProcessPoolCompletionFailedETHSendNonUserPool() public {
    uint256 poolId = 999; // Pool not created by any user

    // Update fee collector to the contract that rejects ETH
    poolsManager.setFeeCollector(rejectETHFeeCollector);

    // Setup completed pool with ETH as stake token
    Pool memory ethPool = mockPool;
    ethPool.poolId = poolId;
    ethPool.seeds.stakeToken = address(mockCastora);
    ethPool.completionTime = block.timestamp + 1500;

    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.getPool.selector, poolId), abi.encode(ethPool));

    // Fund contract with ETH
    vm.deal(address(poolsManager), 10 ether);

    vm.warp(block.timestamp + 1600);

    // Process pool completion should revert with UnsuccessfulFeeCollection
    vm.expectRevert(UnsuccessfulFeeCollection.selector);
    poolsManager.processPoolCompletion(poolId);
  }

  function testClaimPoolCompletionFeesFailedETHSend() public {
    // Set up pool with ETH as stake token (using contract address)
    PoolSeeds memory ethSeeds = validSeeds;
    ethSeeds.stakeToken = address(mockCastora);

    uint256 poolId = 1;

    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, ethSeeds), abi.encode(poolId));

    vm.prank(user1);
    poolsManager.createPool(ethSeeds, address(creationFeeToken), 200, false);

    // Fund contract with ETH for fee distribution
    vm.deal(address(poolsManager), 10 ether);

    // Setup completed pool with ETH
    Pool memory ethPool = mockPool;
    ethPool.poolId = poolId;
    ethPool.seeds = ethSeeds;
    ethPool.completionTime = block.timestamp + 1500;

    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.getPool.selector, poolId), abi.encode(ethPool));

    vm.warp(block.timestamp + 1600);

    // Process pool completion first (this should work since feeCollector receives Castora's share)
    poolsManager.processPoolCompletion(poolId);

    // Deploy a new RejectETH contract and replace user1's code with it
    RejectETH userRejectETH = new RejectETH();
    vm.etch(user1, address(userRejectETH).code);

    // Claim should revert with UnsuccessfulSendCompletionFees
    vm.expectRevert(UnsuccessfulSendCompletionFees.selector);
    vm.prank(user1);
    poolsManager.claimPoolCompletionFees(poolId);
  }

  function testClaimPoolCompletionFeesBulkFailedETHSend() public {
    // Set up multiple pools with ETH as stake token
    PoolSeeds memory ethSeeds = validSeeds;
    ethSeeds.stakeToken = address(mockCastora);

    uint256[] memory poolIds = new uint256[](2);
    poolIds[0] = 1;
    poolIds[1] = 2;

    for (uint256 i = 0; i < poolIds.length; i++) {
      vm.mockCall(
        address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, ethSeeds), abi.encode(poolIds[i])
      );

      vm.prank(user1);
      poolsManager.createPool(ethSeeds, address(creationFeeToken), 200, false);
    }

    // Fund contract with ETH
    vm.deal(address(poolsManager), 10 ether);

    for (uint256 i = 0; i < poolIds.length; i++) {
      Pool memory ethPool = mockPool;
      ethPool.poolId = poolIds[i];
      ethPool.seeds = ethSeeds;
      ethPool.completionTime = block.timestamp + 1500;

      vm.mockCall(
        address(mockCastora), abi.encodeWithSelector(Castora.getPool.selector, poolIds[i]), abi.encode(ethPool)
      );

      poolsManager.processPoolCompletion(poolIds[i]);
    }

    vm.warp(block.timestamp + 1600);

    // Deploy a new RejectETH contract and replace user1's code with it
    RejectETH userRejectETH = new RejectETH();
    vm.etch(user1, address(userRejectETH).code);

    // Bulk claim should revert with UnsuccessfulSendCompletionFees on first pool
    vm.expectRevert(UnsuccessfulSendCompletionFees.selector);
    vm.prank(user1);
    poolsManager.claimPoolCompletionFeesBulk(poolIds);
  }

  function testProcessPoolCompletionSuccessfulERC20ButFailedETHToFeeCollector() public {
    // This test verifies that ERC20 transfers work fine, but ETH sends can fail
    // Create a pool with ERC20 stake token first (this should work)
    uint256 poolId1 = 1;
    _createPoolForUser(user1, poolId1);

    uint256 totalFees = (STAKE_AMOUNT * NUM_PREDICTIONS) - (WIN_AMOUNT * NUM_WINNERS);
    _setupCompletedPool(poolId1, totalFees);

    // This should work fine (ERC20 transfer to fee collector)
    poolsManager.processPoolCompletion(poolId1);

    // Now create a pool with ETH as stake token
    PoolSeeds memory ethSeeds = validSeeds;
    ethSeeds.stakeToken = address(mockCastora);

    uint256 poolId2 = 2;

    vm.mockCall(
      address(mockCastora), abi.encodeWithSelector(Castora.createPool.selector, ethSeeds), abi.encode(poolId2)
    );

    vm.prank(user1);
    poolsManager.createPool(ethSeeds, address(creationFeeToken), 200, false);

    // Update fee collector to the contract that rejects ETH
    poolsManager.setFeeCollector(rejectETHFeeCollector);

    // Setup completed pool with ETH
    Pool memory ethPool = mockPool;
    ethPool.poolId = poolId2;
    ethPool.seeds = ethSeeds;
    ethPool.completionTime = block.timestamp + 1500;

    vm.mockCall(address(mockCastora), abi.encodeWithSelector(Castora.getPool.selector, poolId2), abi.encode(ethPool));

    // Fund contract with ETH
    vm.deal(address(poolsManager), 10 ether);

    // Process pool completion should revert with UnsuccessfulFeeCollection for ETH pool
    vm.expectRevert(UnsuccessfulFeeCollection.selector);
    poolsManager.processPoolCompletion(poolId2);
  }
}
