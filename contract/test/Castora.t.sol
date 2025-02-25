// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

import '@openzeppelin/contracts/interfaces/draft-IERC6093.sol';
import '@openzeppelin/contracts/access/IAccessControl.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import 'forge-std/Test.sol';
import '../src/Castora.sol';
import '../src/cUSD.sol';

contract CastoraTest is Test {
  Castora castora;
  cUSD cusd;
  address owner;
  address feeCollector;
  address user;
  PoolSeeds seedsErc20Stake;
  PoolSeeds seedsNativeStake;

  function setUp() public {
    owner = address(this);
    feeCollector = makeAddr('feeCollector');
    user = makeAddr('user');

    cusd = new cUSD();
    castora = Castora(payable(address(new ERC1967Proxy(address(new Castora()), ''))));
    castora.initialize(feeCollector);

    seedsErc20Stake = PoolSeeds({
      predictionToken: address(cusd),
      stakeToken: address(cusd),
      stakeAmount: 1000000,
      snapshotTime: block.timestamp + 1200,
      windowCloseTime: block.timestamp + 900
    });
    seedsNativeStake = PoolSeeds({
      predictionToken: address(cusd),
      stakeToken: address(castora),
      stakeAmount: 1e16,
      snapshotTime: block.timestamp + 1200,
      windowCloseTime: block.timestamp + 900
    });
  }

  function testDeployment() public view {
    assertEq(castora.owner(), owner);
  }

  function testSetAdminRole() public {
    castora.grantAdminRole(user);
    assertTrue(castora.hasRole(castora.ADMIN_ROLE(), user));
  }

  function testRevokeAdminRole() public {
    castora.grantAdminRole(user);
    assertTrue(castora.hasRole(castora.ADMIN_ROLE(), user));
    castora.revokeAdminRole(user);
    assertFalse(castora.hasRole(castora.ADMIN_ROLE(), user));
  }

  function testRevertWhenNotAdminCreatePool() public {
    vm.prank(user);
    vm.expectPartialRevert(IAccessControl.AccessControlUnauthorizedAccount.selector);
    castora.createPool(seedsErc20Stake);
  }

  function testRevertWithInvalidTokensCreatePool() public {
    vm.expectRevert(InvalidAddress.selector);
    castora.createPool(
      PoolSeeds({
        predictionToken: address(0), // invalid prediction token
        stakeToken: address(cusd), // valid stake token
        stakeAmount: 1000000,
        snapshotTime: block.timestamp + 1200,
        windowCloseTime: block.timestamp + 900
      })
    );

    vm.expectRevert(InvalidAddress.selector);
    castora.createPool(
      PoolSeeds({
        predictionToken: address(cusd), // valid prediction token
        stakeToken: address(0), // invalid stake token
        stakeAmount: 1000000,
        snapshotTime: block.timestamp + 1200,
        windowCloseTime: block.timestamp + 900
      })
    );
  }

  function testRevertZeroStakeCreatePool() public {
    vm.expectRevert(ZeroAmountSpecified.selector);
    castora.createPool(
      PoolSeeds({
        predictionToken: address(cusd),
        stakeToken: address(cusd),
        stakeAmount: 0, // zero stake amount
        snapshotTime: block.timestamp + 1200,
        windowCloseTime: block.timestamp + 900
      })
    );
  }

  function testRevertPastWindowCloseCreatePool() public {
    vm.warp(2000);
    vm.expectRevert(WindowHasClosed.selector);
    castora.createPool(
      PoolSeeds({
        predictionToken: address(cusd),
        stakeToken: address(cusd),
        stakeAmount: 1000000,
        snapshotTime: block.timestamp + 1200,
        windowCloseTime: block.timestamp - 900 // subtraction for past time
      })
    );
  }

  function testRevertWrongPoolTimesCreatePool() public {
    vm.expectRevert(InvalidPoolTimes.selector);
    castora.createPool(
      PoolSeeds({
        predictionToken: address(cusd),
        stakeToken: address(cusd),
        stakeAmount: 1000000,
        snapshotTime: block.timestamp + 900, // snapshot before windowClose
        windowCloseTime: block.timestamp + 1200
      })
    );
  }

  function testCreatePool() public {
    uint256 prevNoOfPools = castora.noOfPools();
    bytes32 seedsHash = castora.hashPoolSeeds(seedsErc20Stake);
    vm.expectEmit(true, true, true, true);
    emit CreatedPool(1, seedsHash);
    castora.createPool(seedsErc20Stake);

    PoolSeeds memory seeds = castora.getPool(1).seeds;
    assertEq(prevNoOfPools + 1, castora.noOfPools());
    assertEq(castora.poolIdsBySeedsHashes(seedsHash), 1);
    assertEq(seeds.predictionToken, address(cusd));
    assertEq(seeds.stakeToken, address(cusd));
    assertEq(seeds.stakeAmount, 1000000);
    assertEq(seeds.snapshotTime, block.timestamp + 1200);
    assertEq(seeds.windowCloseTime, block.timestamp + 900);
  }

  function testRevertInvalidPoolIdPredict() public {
    vm.expectRevert(InvalidPoolId.selector);
    castora.predict(999, 0);
  }

  function testRevertClosedWindowPredict() public {
    castora.createPool(seedsErc20Stake);
    vm.warp(block.timestamp + 901);
    vm.expectRevert(WindowHasClosed.selector);
    castora.predict(1, 0);
  }

  function testRevertNotProvidedStakePredict() public {
    castora.createPool(seedsNativeStake);
    vm.prank(user);
    vm.expectRevert(InsufficientStakeValue.selector);
    castora.predict(1, 0);

    deal(user, 1e15);
    vm.expectRevert(InsufficientStakeValue.selector);
    castora.predict{value: 1e15}(1, 0);
  }

  function testRevertNotAuthorizedStakePredict() public {
    castora.createPool(seedsErc20Stake);
    vm.prank(user);
    vm.expectPartialRevert(IERC20Errors.ERC20InsufficientAllowance.selector);
    castora.predict(1, 0);
  }

  function testPredictNative() public {
    castora.createPool(seedsNativeStake);
    deal(user, 1e16);
    uint256 prevTotalPredictions = castora.totalNoOfPredictions();
    uint256 prevPoolTotalPrds = castora.getPool(1).noOfPredictions;
    uint256 prevNoOfJoinedPools = castora.noOfJoinedPoolsByAddresses(user);
    uint256 prevTotalStaked = castora.totalStakedAmounts(address(castora));
    uint256 prevCastoraBal = address(castora).balance;
    uint256 prevUserBal = user.balance;

    vm.prank(user);
    vm.expectEmit(true, true, true, true);
    emit Predicted(1, 1, user, 0);
    castora.predict{value: 1e16}(1, 0);

    Prediction memory prediction = castora.getPrediction(1, 1);
    assertEq(prevTotalPredictions + 1, castora.totalNoOfPredictions());
    assertEq(prevPoolTotalPrds + 1, castora.getPool(1).noOfPredictions);
    assertEq(prevNoOfJoinedPools + 1, castora.noOfJoinedPoolsByAddresses(user));
    assertEq(castora.joinedPoolIdsByAddresses(user, 0), 1);
    assertEq(prevTotalStaked + 1e16, castora.totalStakedAmounts(address(castora)));
    assertEq(prediction.predicter, user);
    assertEq(prediction.poolId, 1);
    assertEq(prediction.predictionId, 1);
    assertEq(prediction.predictionPrice, 0);
    assertEq(prediction.predictionTime, block.timestamp);
    assertEq(prevCastoraBal + 1e16, address(castora).balance);
    assertEq(prevUserBal - 1e16, user.balance);
  }

  function testPredictERC20() public {
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 1000000);
    uint256 prevTotalPredictions = castora.totalNoOfPredictions();
    uint256 prevPoolTotalPrds = castora.getPool(1).noOfPredictions;
    uint256 prevNoOfJoinedPools = castora.noOfJoinedPoolsByAddresses(user);
    uint256 prevTotalStaked = castora.totalStakedAmounts(address(cusd));
    uint256 prevCastoraBal = cusd.balanceOf(address(castora));
    uint256 prevUserBal = cusd.balanceOf(user);

    vm.prank(user);
    cusd.approve(address(castora), 1000000);
    vm.expectEmit(true, true, true, true);
    emit Predicted(1, 1, user, 0);
    vm.prank(user);
    castora.predict(1, 0);

    Prediction memory prediction = castora.getPrediction(1, 1);
    assertEq(prevTotalPredictions + 1, castora.totalNoOfPredictions());
    assertEq(prevPoolTotalPrds + 1, castora.getPool(1).noOfPredictions);
    assertEq(prevNoOfJoinedPools + 1, castora.noOfJoinedPoolsByAddresses(user));
    assertEq(castora.joinedPoolIdsByAddresses(user, 0), 1);
    assertEq(prevTotalStaked + 1000000, castora.totalStakedAmounts(address(cusd)));
    assertEq(prediction.predicter, user);
    assertEq(prediction.poolId, 1);
    assertEq(prediction.predictionId, 1);
    assertEq(prediction.predictionPrice, 0);
    assertEq(prediction.predictionTime, block.timestamp);
    assertEq(prevCastoraBal + 1000000, cusd.balanceOf(address(castora)));
    assertEq(prevUserBal - 1000000, cusd.balanceOf(user));
  }

  function testRevertWhenNotAdminCompletePool() public {
    castora.createPool(seedsErc20Stake);
    vm.prank(user);
    vm.expectPartialRevert(IAccessControl.AccessControlUnauthorizedAccount.selector);
    castora.completePool(1, 0, 1, 0, new uint256[](0));
  }

  function testRevertInvalidPoolIdCompletePool() public {
    vm.expectRevert(InvalidPoolId.selector);
    castora.completePool(0, 0, 1, 0, new uint256[](0));

    vm.expectRevert(InvalidPoolId.selector);
    castora.completePool(1, 0, 1, 0, new uint256[](0));

    castora.createPool(seedsErc20Stake);
    vm.expectRevert(InvalidPoolId.selector);
    castora.completePool(2, 0, 1, 0, new uint256[](0));
  }

  function testRevertNotYetSnapshotCompletePool() public {
    castora.createPool(seedsErc20Stake);
    vm.expectRevert(NotYetSnapshotTime.selector);
    castora.completePool(1, 0, 1, 0, new uint256[](0));
  }

  function testRevertNoPredictionsCompletePool() public {
    castora.createPool(seedsErc20Stake);
    vm.warp(block.timestamp + 1200);
    vm.expectRevert(NoPredictionsInPool.selector);
    castora.completePool(1, 0, 1, 0, new uint256[](0));
  }

  function testRevertInvalidWinnersCompletePool() public {
    castora.createPool(seedsNativeStake);
    deal(user, 1e16);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);
    vm.warp(block.timestamp + 1200);

    vm.expectRevert(InvalidWinnersCount.selector);
    castora.completePool(1, 0, 0, 0, new uint256[](1));

    vm.expectRevert(InvalidWinnersCount.selector);
    castora.completePool(1, 0, 2, 0, new uint256[](1));

    vm.expectRevert(InvalidWinnersCount.selector);
    castora.completePool(1, 0, 1, 0, new uint256[](3));
  }

  function testRevertZeroWinCompletePool() public {
    castora.createPool(seedsNativeStake);
    deal(user, 1e16);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);
    vm.warp(block.timestamp + 1200);
    vm.expectRevert(ZeroAmountSpecified.selector);
    castora.completePool(1, 0, 1, 0, new uint256[](1));
  }

  function testCompletePoolNative() public {
    castora.createPool(seedsNativeStake);
    deal(user, 1e16);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);

    vm.warp(block.timestamp + 1200);

    uint256 prevCastoraBal = address(castora).balance;
    uint256 prevFeeCollectorBal = feeCollector.balance;
    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;

    vm.expectEmit(true, true, true, true);
    emit CompletedPool(1, block.timestamp, 0, 95e14, 1);
    castora.completePool(1, 0, 1, 95e14, winnerPredictions);

    Pool memory pool = castora.getPool(1);
    assertEq(pool.snapshotPrice, 0);
    assertEq(pool.completionTime, block.timestamp);
    assertEq(pool.winAmount, 95e14);
    assertEq(pool.noOfWinners, 1);
    assertTrue(castora.getPrediction(1, 1).isAWinner);
    assertEq(prevCastoraBal - 5e14, address(castora).balance);
    assertEq(prevFeeCollectorBal + 5e14, feeCollector.balance);
  }

  function testCompletePoolERC20() public {
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 1000000);
    vm.prank(user);
    cusd.approve(address(castora), 1000000);
    vm.prank(user);
    castora.predict(1, 0);

    vm.warp(block.timestamp + 1200);

    uint256 prevCastoraBal = cusd.balanceOf(address(castora));
    uint256 prevFeeCollectorBal = cusd.balanceOf(feeCollector);
    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;

    vm.expectEmit(true, true, true, true);
    emit CompletedPool(1, block.timestamp, 0, 950000, 1);
    castora.completePool(1, 0, 1, 950000, winnerPredictions);

    Pool memory pool = castora.getPool(1);
    assertEq(pool.snapshotPrice, 0);
    assertEq(pool.completionTime, block.timestamp);
    assertEq(pool.winAmount, 950000);
    assertEq(pool.noOfWinners, 1);
    assertTrue(castora.getPrediction(1, 1).isAWinner);
    assertEq(prevCastoraBal - 50000, cusd.balanceOf(address(castora)));
    assertEq(prevFeeCollectorBal + 50000, cusd.balanceOf(feeCollector));
  }

  function testRevertAlreadyCompletedCompletePool() public {
    castora.createPool(seedsNativeStake);
    deal(user, 1e16);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);
    vm.warp(block.timestamp + 1200);
    castora.completePool(1, 0, 1, 95e14, new uint256[](1));

    vm.expectRevert(PoolAlreadyCompleted.selector);
    castora.completePool(1, 0, 1, 95e14, new uint256[](1));
  }

  function testRevertInvalidPoolIdClaimWinnings() public {
    vm.expectRevert(InvalidPoolId.selector);
    castora.claimWinnings(0, 0);

    vm.expectRevert(InvalidPoolId.selector);
    castora.claimWinnings(1, 0);

    castora.createPool(seedsErc20Stake);
    vm.expectRevert(InvalidPoolId.selector);
    castora.claimWinnings(2, 0);
  }

  function testRevertNotCompletedPoolClaimWinnings() public {
    castora.createPool(seedsNativeStake);
    deal(user, 1e16);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);
    vm.warp(block.timestamp + 1200);

    vm.prank(user);
    vm.expectRevert(PoolNotYetCompleted.selector);
    castora.claimWinnings(1, 0);
  }

  function testRevertInvalidPredictionIdsClaimWinnings() public {
    castora.createPool(seedsNativeStake);
    deal(user, 1e16);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);
    vm.warp(block.timestamp + 1200);
    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;
    castora.completePool(1, 0, 1, 95e14, winnerPredictions);

    vm.prank(user);
    vm.expectRevert(InvalidPredictionId.selector);
    castora.claimWinnings(1, 0);

    vm.prank(user);
    vm.expectRevert(InvalidPredictionId.selector);
    castora.claimWinnings(1, 2);
  }

  function testRevertCallerNotPredicterClaimWinnings() public {
    castora.createPool(seedsNativeStake);
    deal(user, 1e16);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);
    vm.warp(block.timestamp + 1200);
    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;
    castora.completePool(1, 0, 1, 95e14, winnerPredictions);

    // not pranking as "user" to make the call as this contract
    vm.expectRevert(NotYourPrediction.selector);
    castora.claimWinnings(1, 1);
  }

  function testRevertPredictionNotAWinnerClaimWinnings() public {
    castora.createPool(seedsNativeStake);
    deal(user, 2e16);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);
    vm.warp(block.timestamp + 1200);
    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;
    castora.completePool(1, 0, 1, 19e15, winnerPredictions);

    vm.prank(user);
    vm.expectRevert(NotAWinner.selector);
    castora.claimWinnings(1, 2); // testing prediction 2 as it isn't a winner
  }

  function testClaimWinningsNative() public {
    castora.createPool(seedsNativeStake);
    deal(user, 1e16);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);

    vm.warp(block.timestamp + 1200);
    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;
    castora.completePool(1, 0, 1, 95e14, winnerPredictions);
    uint256 prevNoOfClaimedWinnings = castora.totalNoOfClaimedWinningsPredictions();
    uint256 prevPoolNoOfClaimed = castora.getPool(1).noOfClaimedWinnings;
    uint256 prevTotalClaimedAmount = castora.totalClaimedWinningsAmounts(address(castora));
    uint256 prevCastoraBal = address(castora).balance;
    uint256 prevUserBal = user.balance;

    vm.prank(user);
    vm.expectEmit(true, true, true, true);
    emit ClaimedWinnings(1, 1, user, address(castora), 1e16, 95e14);
    castora.claimWinnings(1, 1);

    assertEq(prevNoOfClaimedWinnings + 1, castora.totalNoOfClaimedWinningsPredictions());
    assertEq(prevPoolNoOfClaimed + 1, castora.getPool(1).noOfClaimedWinnings);
    assertEq(prevTotalClaimedAmount + 95e14, castora.totalClaimedWinningsAmounts(address(castora)));
    assertEq(castora.getPrediction(1, 1).claimedWinningsTime, block.timestamp);
    assertEq(prevCastoraBal - 95e14, address(castora).balance);
    assertEq(prevUserBal + 95e14, user.balance);
  }

  function testClaimWinningsERC20() public {
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 1000000);
    vm.prank(user);
    cusd.approve(address(castora), 1000000);
    vm.prank(user);
    castora.predict(1, 0);

    vm.warp(block.timestamp + 1200);
    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;
    castora.completePool(1, 0, 1, 950000, winnerPredictions);
    uint256 prevNoOfClaimedWinnings = castora.totalNoOfClaimedWinningsPredictions();
    uint256 prevPoolNoOfClaimed = castora.getPool(1).noOfClaimedWinnings;
    uint256 prevTotalClaimedAmount = castora.totalClaimedWinningsAmounts(address(cusd));
    uint256 prevCastoraBal = cusd.balanceOf(address(castora));
    uint256 prevUserBal = cusd.balanceOf(user);

    vm.prank(user);
    vm.expectEmit(true, true, true, true);
    emit ClaimedWinnings(1, 1, user, address(cusd), 1000000, 950000);
    castora.claimWinnings(1, 1);

    assertEq(prevNoOfClaimedWinnings + 1, castora.totalNoOfClaimedWinningsPredictions());
    assertEq(prevPoolNoOfClaimed + 1, castora.getPool(1).noOfClaimedWinnings);
    assertEq(prevTotalClaimedAmount + 950000, castora.totalClaimedWinningsAmounts(address(cusd)));
    assertEq(castora.getPrediction(1, 1).claimedWinningsTime, block.timestamp);
    assertEq(prevCastoraBal - 950000, cusd.balanceOf(address(castora)));
    assertEq(prevUserBal + 950000, cusd.balanceOf(user));
  }

  function testRevertAlreadyClaimedClaimWinnings() public {
    castora.createPool(seedsNativeStake);
    deal(user, 1e16);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);
    vm.warp(block.timestamp + 1200);
    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;
    castora.completePool(1, 0, 1, 95e14, winnerPredictions);
    vm.prank(user);
    castora.claimWinnings(1, 1);

    vm.prank(user);
    vm.expectRevert(AlreadyClaimedWinnings.selector);
    castora.claimWinnings(1, 1);
  }

  function testRevertUnmatchingPoolsAndPredictions() public {
    uint256[] memory poolIds = new uint256[](1);
    uint256[] memory predictionIds = new uint256[](2);
    vm.expectRevert(UnmatchingPoolsAndPredictions.selector);
    castora.claimWinningsBulk(poolIds, predictionIds);
  }

  function testClaimWinningsBulkNative() public {
    castora.createPool(seedsNativeStake);
    deal(user, 2e16);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);
    vm.prank(user);
    castora.predict{value: 1e16}(1, 0);

    vm.warp(block.timestamp + 1200);
    uint256[] memory winnerPredictions = new uint256[](2);
    winnerPredictions[0] = 1;
    winnerPredictions[1] = 2;
    castora.completePool(1, 0, 2, 95e14, winnerPredictions);

    uint256[] memory poolIds = new uint256[](2);
    uint256[] memory predictionIds = new uint256[](2);
    poolIds[0] = 1;
    poolIds[1] = 1;
    predictionIds[0] = 1;
    predictionIds[1] = 2;

    uint256 prevNoOfClaimedWinnings = castora.totalNoOfClaimedWinningsPredictions();
    uint256 prevPoolNoOfClaimed = castora.getPool(1).noOfClaimedWinnings;
    uint256 prevTotalClaimedAmount = castora.totalClaimedWinningsAmounts(address(castora));
    uint256 prevCastoraBal = address(castora).balance;
    uint256 prevUserBal = user.balance;

    vm.prank(user);
    castora.claimWinningsBulk(poolIds, predictionIds);

    assertEq(prevNoOfClaimedWinnings + 2, castora.totalNoOfClaimedWinningsPredictions());
    assertEq(prevPoolNoOfClaimed + 2, castora.getPool(1).noOfClaimedWinnings);
    assertEq(prevTotalClaimedAmount + 190e14, castora.totalClaimedWinningsAmounts(address(castora)));
    assertEq(castora.getPrediction(1, 1).claimedWinningsTime, block.timestamp);
    assertEq(castora.getPrediction(1, 2).claimedWinningsTime, block.timestamp);
    assertEq(prevCastoraBal - 190e14, address(castora).balance);
    assertEq(prevUserBal + 190e14, user.balance);
  }

  function testClaimWinningsBulkERC20() public {
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 2000000);
    vm.prank(user);
    cusd.approve(address(castora), 2000000);
    vm.prank(user);
    castora.predict(1, 0);
    vm.prank(user);
    castora.predict(1, 0);

    vm.warp(block.timestamp + 1200);
    uint256[] memory winnerPredictions = new uint256[](2);
    winnerPredictions[0] = 1;
    winnerPredictions[1] = 2;
    castora.completePool(1, 0, 2, 950000, winnerPredictions);

    uint256[] memory poolIds = new uint256[](2);
    uint256[] memory predictionIds = new uint256[](2);
    poolIds[0] = 1;
    poolIds[1] = 1;
    predictionIds[0] = 1;
    predictionIds[1] = 2;

    uint256 prevNoOfClaimedWinnings = castora.totalNoOfClaimedWinningsPredictions();
    uint256 prevPoolNoOfClaimed = castora.getPool(1).noOfClaimedWinnings;
    uint256 prevTotalClaimedAmount = castora.totalClaimedWinningsAmounts(address(cusd));
    uint256 prevCastoraBal = cusd.balanceOf(address(castora));
    uint256 prevUserBal = cusd.balanceOf(user);

    vm.prank(user);
    castora.claimWinningsBulk(poolIds, predictionIds);

    assertEq(prevNoOfClaimedWinnings + 2, castora.totalNoOfClaimedWinningsPredictions());
    assertEq(prevPoolNoOfClaimed + 2, castora.getPool(1).noOfClaimedWinnings);
    assertEq(prevTotalClaimedAmount + 1900000, castora.totalClaimedWinningsAmounts(address(cusd)));
    assertEq(castora.getPrediction(1, 1).claimedWinningsTime, block.timestamp);
    assertEq(castora.getPrediction(1, 2).claimedWinningsTime, block.timestamp);
    assertEq(prevCastoraBal - 1900000, cusd.balanceOf(address(castora)));
    assertEq(prevUserBal + 1900000, cusd.balanceOf(user));
  }
}
