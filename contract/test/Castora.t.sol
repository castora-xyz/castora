// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {IAccessControl} from '@openzeppelin/contracts/access/IAccessControl.sol';
import {IERC20Errors} from '@openzeppelin/contracts/interfaces/draft-IERC6093.sol';
import {ERC1967Proxy} from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {Test} from 'forge-std/Test.sol';
import {Castora} from '../src/Castora.sol';
import {CastoraErrors} from '../src/CastoraErrors.sol';
import {CastoraEvents} from '../src/CastoraEvents.sol';
import {CastoraStructs} from '../src/CastoraStructs.sol';
import {cUSD} from '../src/cUSD.sol';

contract MockSuccessfulHandler {
  bool public wasProcessPoolCompletionCalled;
  uint256 public lastProcessedPoolId;

  function processPoolCompletion(uint256 poolId) external {
    wasProcessPoolCompletionCalled = true;
    lastProcessedPoolId = poolId;
  }
}

contract MockFailingHandler {
  bool public wasProcessPoolCompletionCalled;
  uint256 public lastProcessedPoolId;

  function processPoolCompletion(uint256 poolId) external {
    wasProcessPoolCompletionCalled = true;
    lastProcessedPoolId = poolId;
    revert();
  }
}

contract MockNonHandlerContract {}

contract CastoraTest is CastoraErrors, CastoraEvents, CastoraStructs, Test {
  Castora castora;
  cUSD cusd;
  address owner;
  address feeCollector;
  address user;
  MockSuccessfulHandler successfulHandler;
  MockFailingHandler failingHandler;
  MockNonHandlerContract nonHandlerContract;
  PoolSeeds seedsErc20Stake;
  PoolSeeds seedsNativeStake;

  function setUp() public {
    owner = address(this);
    feeCollector = makeAddr('feeCollector');
    user = makeAddr('user');

    cusd = new cUSD();
    successfulHandler = new MockSuccessfulHandler();
    failingHandler = new MockFailingHandler();
    nonHandlerContract = new MockNonHandlerContract();

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

  function testBurncUSD() public {
    // Mint some tokens to the user first
    cusd.mint(user, 1000000);
    uint256 initialBalance = cusd.balanceOf(user);
    uint256 initialTotalSupply = cusd.totalSupply();

    // User burns some tokens
    uint256 burnAmount = 500000;
    vm.prank(user);
    cusd.burn(burnAmount);

    // Verify the tokens were burned
    assertEq(cusd.balanceOf(user), initialBalance - burnAmount);
    assertEq(cusd.totalSupply(), initialTotalSupply - burnAmount);
  }

  function testRevertWhenNotOwnerUpgrading() public {
    address impl = address(new Castora());
    vm.prank(user);
    vm.expectRevert();
    castora.upgradeToAndCall(impl, '');
  }

  function testRevertZeroAddressAdminRole() public {
    vm.expectRevert(InvalidAddress.selector);
    castora.grantAdminRole(address(0));
    vm.expectRevert(InvalidAddress.selector);
    castora.revokeAdminRole(address(0));
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

  function testSetFeeCollector() public {
    address newFeeCollector = makeAddr('newFeeCollector');

    // Test successful fee collector change
    castora.setFeeCollector(newFeeCollector);
    assertEq(castora.feeCollector(), newFeeCollector);

    // Test revert when setting zero address
    vm.expectRevert(InvalidAddress.selector);
    castora.setFeeCollector(address(0));

    // Test revert when not owner
    vm.prank(user);
    vm.expectRevert();
    castora.setFeeCollector(newFeeCollector);
  }

  receive() external payable {}

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

  function testRevertPoolExistsAlreadyCreatePool() public {
    castora.createPool(seedsErc20Stake);
    vm.expectRevert(PoolExistsAlready.selector);
    castora.createPool(seedsErc20Stake);
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

  function testRevertInvalidPoolIdGetters() public {
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPool(0);

    vm.expectRevert(InvalidPoolId.selector);
    castora.getPool(1); // No pools created yet

    vm.expectRevert(InvalidPoolId.selector);
    castora.getPrediction(0, 1);

    vm.expectRevert(InvalidPoolId.selector);
    castora.getPrediction(999, 1); // Non-existent pool
  }

  function testRevertInvalidPredictionIdGetPrediction() public {
    castora.createPool(seedsErc20Stake);

    // Test with predictionId = 0 (invalid)
    vm.expectRevert(InvalidPredictionId.selector);
    castora.getPrediction(1, 0);

    // Test with predictionId > noOfPredictions (invalid)
    vm.expectRevert(InvalidPredictionId.selector);
    castora.getPrediction(1, 999);
  }

  function testRevertInvalidAddressAndPoolIdGetPredictionIdForAddress() public {
    // Test with zero address
    vm.expectRevert(InvalidAddress.selector);
    castora.getPredictionIdsForAddress(1, address(0));

    // Test with invalid pool ID (0)
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPredictionIdsForAddress(0, user);

    // Test with invalid pool ID (doesn't exist)
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPredictionIdsForAddress(999, user);
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

  function testRevertERC20FailureOnPredict() public {
    castora.createPool(seedsErc20Stake);

    // Mock the transferFrom call to return false, simulating a failure
    vm.mockCall(
      address(cusd),
      abi.encodeWithSelector(IERC20.transferFrom.selector, user, address(castora), 1000000),
      abi.encode(false)
    );

    vm.prank(user);
    vm.expectPartialRevert(SafeERC20.SafeERC20FailedOperation.selector);
    castora.predict(1, 0);
  }

  function testRevertERC20FailureOnBulkPredict() public {
    castora.createPool(seedsErc20Stake);

    // Mock the transferFrom call to return false, simulating a failure
    vm.mockCall(
      address(cusd),
      abi.encodeWithSelector(IERC20.transferFrom.selector, user, address(castora), 3000000), // 3 predictions
      abi.encode(false)
    );

    vm.prank(user);
    vm.expectPartialRevert(SafeERC20.SafeERC20FailedOperation.selector);
    castora.bulkPredict(1, 0, 3);
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

  function testRevertFailedERC20CompletePool() public {
    // Test ERC20 fee collection failure
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 1000000);
    vm.prank(user);
    cusd.approve(address(castora), 1000000);
    vm.prank(user);
    castora.predict(1, 0);
    vm.warp(block.timestamp + 1200);

    // Mock the transfer to feeCollector to return false (simulating failure)
    vm.mockCall(
      address(cusd),
      abi.encodeWithSelector(IERC20.transfer.selector, feeCollector, 50000), // 5% fee
      abi.encode(false)
    );

    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;

    vm.expectPartialRevert(SafeERC20.SafeERC20FailedOperation.selector);
    castora.completePool(1, 0, 1, 950000, winnerPredictions);
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

  function testRevertSafeERC20FailureClaimWinnings() public {
    // Test ERC20 winnings transfer failure
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

    // Mock the transfer to winner to return false (simulating failure)
    vm.mockCall(address(cusd), abi.encodeWithSelector(IERC20.transfer.selector, user, 950000), abi.encode(false));

    vm.prank(user);
    vm.expectPartialRevert(SafeERC20.SafeERC20FailedOperation.selector);
    castora.claimWinnings(1, 1);
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

  function testGetUnclaimedWinnerPredictionIdsForAddress() public {
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 20000000);
    vm.prank(user);
    cusd.approve(address(castora), 20000000);
    vm.prank(user);
    castora.bulkPredict(1, 0, 10);

    vm.warp(block.timestamp + 1200);
    uint256[] memory winnerPredictions = new uint256[](5);
    winnerPredictions[0] = 1;
    winnerPredictions[1] = 2;
    winnerPredictions[2] = 3;
    winnerPredictions[3] = 4;
    winnerPredictions[4] = 5;
    castora.completePool(1, 0, 5, 950000, winnerPredictions);

    uint256[] memory unclaimedWinners = castora.getUnclaimedWinnerPredictionIdsForAddress(1, user);
    assertEq(unclaimedWinners.length, 5);
    for (uint256 i = 0; i < 5; i++) {
      assertEq(unclaimedWinners[i], i + 1); // IDs 1 to 5
    }

    // Claim 2 winnings then expect unclaimed to return the other 3
    vm.prank(user);
    castora.claimWinnings(1, 1);
    vm.prank(user);
    castora.claimWinnings(1, 3);
    unclaimedWinners = castora.getUnclaimedWinnerPredictionIdsForAddress(1, user);
    assertEq(unclaimedWinners.length, 3);
    assertEq(unclaimedWinners[0], 2);
    assertEq(unclaimedWinners[1], 4);
    assertEq(unclaimedWinners[2], 5);
  }

  function testRevertZeroPredictionsCountBulkPredict() public {
    castora.createPool(seedsErc20Stake);
    vm.prank(user);
    vm.expectRevert(ZeroAmountSpecified.selector);
    castora.bulkPredict(1, 0, 0);
  }

  function testRevertInvalidPoolIdBulkPredict() public {
    vm.prank(user);
    vm.expectRevert(InvalidPoolId.selector);
    castora.bulkPredict(999, 0, 5);
  }

  function testRevertClosedWindowBulkPredict() public {
    castora.createPool(seedsErc20Stake);
    vm.warp(block.timestamp + 1000); // Warp past window close time
    vm.prank(user);
    vm.expectRevert(WindowHasClosed.selector);
    castora.bulkPredict(1, 0, 3);
  }

  function testRevertInsufficientStakeValueBulkPredictNative() public {
    castora.createPool(seedsNativeStake);
    deal(user, 1e16); // Only enough for 1 prediction, not 3
    vm.prank(user);
    vm.expectRevert(InsufficientStakeValue.selector);
    castora.bulkPredict{value: 1e16}(1, 0, 3);
  }

  function testRevertNotAuthorizedStakeBulkPredictERC20() public {
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 3000000); // Mint tokens but don't approve
    vm.prank(user);
    vm.expectPartialRevert(IERC20Errors.ERC20InsufficientAllowance.selector);
    castora.bulkPredict(1, 0, 3);
  }

  function testBulkPredictNative() public {
    castora.createPool(seedsNativeStake);
    uint16 predictionsCount = 5;
    uint256 totalStakeAmount = 1e16 * predictionsCount;
    deal(user, totalStakeAmount);

    uint256 prevTotalPredictions = castora.totalNoOfPredictions();
    uint256 prevPoolTotalPrds = castora.getPool(1).noOfPredictions;
    uint256 prevNoOfJoinedPools = castora.noOfJoinedPoolsByAddresses(user);
    uint256 prevTotalStaked = castora.totalStakedAmounts(address(castora));
    uint256 prevCastoraBal = address(castora).balance;
    uint256 prevUserBal = user.balance;

    vm.prank(user);
    // Expect multiple Predicted events
    for (uint256 i = 1; i <= predictionsCount; i++) {
      vm.expectEmit(true, true, true, true);
      emit Predicted(1, i, user, 12345);
    }
    (uint256 firstId, uint256 lastId) = castora.bulkPredict{value: totalStakeAmount}(1, 12345, predictionsCount);

    // Verify return values
    assertEq(firstId, 1);
    assertEq(lastId, predictionsCount);

    // Verify global state changes
    assertEq(prevTotalPredictions + predictionsCount, castora.totalNoOfPredictions());
    assertEq(prevPoolTotalPrds + predictionsCount, castora.getPool(1).noOfPredictions);
    assertEq(prevNoOfJoinedPools + predictionsCount, castora.noOfJoinedPoolsByAddresses(user));
    assertEq(prevTotalStaked + totalStakeAmount, castora.totalStakedAmounts(address(castora)));

    // Verify balances
    assertEq(prevCastoraBal + totalStakeAmount, address(castora).balance);
    assertEq(prevUserBal - totalStakeAmount, user.balance);

    // Verify each prediction was created correctly
    for (uint256 i = 1; i <= predictionsCount; i++) {
      Prediction memory prediction = castora.getPrediction(1, i);
      assertEq(prediction.predicter, user);
      assertEq(prediction.poolId, 1);
      assertEq(prediction.predictionId, i);
      assertEq(prediction.predictionPrice, 12345);
      assertEq(prediction.predictionTime, block.timestamp);
      assertEq(prediction.claimedWinningsTime, 0);
      assertEq(prediction.isAWinner, false);
    }

    // Verify prediction IDs tracking
    uint256[] memory userPredictionIds = castora.getPredictionIdsForAddress(1, user);
    assertEq(userPredictionIds.length, predictionsCount);
    for (uint256 i = 0; i < predictionsCount; i++) {
      assertEq(userPredictionIds[i], i + 1);
    }

    // Verify joined pools tracking
    for (uint256 i = 0; i < predictionsCount; i++) {
      assertEq(castora.joinedPoolIdsByAddresses(user, i), 1);
    }
  }

  function testBulkPredictERC20() public {
    castora.createPool(seedsErc20Stake);
    uint16 predictionsCount = 3;
    uint256 totalStakeAmount = 1000000 * predictionsCount;
    cusd.mint(user, totalStakeAmount);

    uint256 prevTotalPredictions = castora.totalNoOfPredictions();
    uint256 prevPoolTotalPrds = castora.getPool(1).noOfPredictions;
    uint256 prevNoOfJoinedPools = castora.noOfJoinedPoolsByAddresses(user);
    uint256 prevTotalStaked = castora.totalStakedAmounts(address(cusd));
    uint256 prevCastoraBal = cusd.balanceOf(address(castora));
    uint256 prevUserBal = cusd.balanceOf(user);

    vm.prank(user);
    cusd.approve(address(castora), totalStakeAmount);

    vm.prank(user);
    // Expect multiple Predicted events
    for (uint256 i = 1; i <= predictionsCount; i++) {
      vm.expectEmit(true, true, true, true);
      emit Predicted(1, i, user, 54321);
    }
    (uint256 firstId, uint256 lastId) = castora.bulkPredict(1, 54321, predictionsCount);

    // Verify return values
    assertEq(firstId, 1);
    assertEq(lastId, predictionsCount);

    // Verify global state changes
    assertEq(prevTotalPredictions + predictionsCount, castora.totalNoOfPredictions());
    assertEq(prevPoolTotalPrds + predictionsCount, castora.getPool(1).noOfPredictions);
    assertEq(prevNoOfJoinedPools + predictionsCount, castora.noOfJoinedPoolsByAddresses(user));
    assertEq(prevTotalStaked + totalStakeAmount, castora.totalStakedAmounts(address(cusd)));

    // Verify balances
    assertEq(prevCastoraBal + totalStakeAmount, cusd.balanceOf(address(castora)));
    assertEq(prevUserBal - totalStakeAmount, cusd.balanceOf(user));

    // Verify each prediction was created correctly
    for (uint256 i = 1; i <= predictionsCount; i++) {
      Prediction memory prediction = castora.getPrediction(1, i);
      assertEq(prediction.predicter, user);
      assertEq(prediction.poolId, 1);
      assertEq(prediction.predictionId, i);
      assertEq(prediction.predictionPrice, 54321);
      assertEq(prediction.predictionTime, block.timestamp);
      assertEq(prediction.claimedWinningsTime, 0);
      assertEq(prediction.isAWinner, false);
    }
  }

  function testBulkPredictSinglePrediction() public {
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 1000000);

    vm.prank(user);
    cusd.approve(address(castora), 1000000);

    vm.prank(user);
    vm.expectEmit(true, true, true, true);
    emit Predicted(1, 1, user, 99999);
    (uint256 firstId, uint256 lastId) = castora.bulkPredict(1, 99999, 1);

    // For a single prediction, first and last should be the same
    assertEq(firstId, 1);
    assertEq(lastId, 1);
    assertEq(castora.getPool(1).noOfPredictions, 1);
    assertEq(castora.totalNoOfPredictions(), 1);
  }

  function testBulkPredictAfterExistingPredictions() public {
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 5000000); // Enough for individual + bulk predictions

    // Make 2 individual predictions first
    vm.prank(user);
    cusd.approve(address(castora), 5000000);
    vm.prank(user);
    castora.predict(1, 11111);
    vm.prank(user);
    castora.predict(1, 22222);

    // Now make 3 bulk predictions
    vm.prank(user);
    (uint256 firstId, uint256 lastId) = castora.bulkPredict(1, 33333, 3);

    // Verify IDs are correct
    assertEq(firstId, 3); // Should start after the 2 existing predictions
    assertEq(lastId, 5); // Should end at prediction 5
    assertEq(castora.getPool(1).noOfPredictions, 5);
    assertEq(castora.totalNoOfPredictions(), 5);

    // Verify the bulk predictions have correct data
    for (uint256 i = 3; i <= 5; i++) {
      Prediction memory prediction = castora.getPrediction(1, i);
      assertEq(prediction.predictionPrice, 33333);
      assertEq(prediction.predicter, user);
    }
  }

  // ========== POOL COMPLETION HANDLER TESTS ==========

  function testCompletePoolWithSuccessfulHandler() public {
    // Set up successful handler as fee collector
    castora.setFeeCollector(address(successfulHandler));

    // Create pool and make prediction
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 1000000);
    vm.prank(user);
    cusd.approve(address(castora), 1000000);
    vm.prank(user);
    castora.predict(1, 99999);

    // Fund the fee collector (handler contract) to receive fees
    cusd.mint(address(successfulHandler), 0); // Just to ensure it can receive ERC20

    // Fast forward to snapshot time
    vm.warp(block.timestamp + 1201);

    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;

    // Complete pool - should successfully call processPoolCompletion
    castora.completePool(1, 95000000, 1, 950000, winnerPredictions);

    // Verify the handler was called
    assertTrue(successfulHandler.wasProcessPoolCompletionCalled());
    assertEq(successfulHandler.lastProcessedPoolId(), 1);

    // Verify pool was completed despite handler call
    Pool memory pool = castora.getPool(1);
    assertEq(pool.completionTime, block.timestamp);
    assertEq(pool.snapshotPrice, 95000000);
  }

  function testCompletePoolWithFailingHandler() public {
    // Set up failing handler as fee collector
    castora.setFeeCollector(address(failingHandler));

    // Create pool and make prediction
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 1000000);
    vm.prank(user);
    cusd.approve(address(castora), 1000000);
    vm.prank(user);
    castora.predict(1, 99999);

    // Fund the fee collector to receive fees
    cusd.mint(address(failingHandler), 0);

    // Fast forward to snapshot time
    vm.warp(block.timestamp + 1201);

    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;

    // Complete pool - should NOT revert even though handler fails
    castora.completePool(1, 95000000, 1, 950000, winnerPredictions);

    // Since the handler reverts, state changes in the handler are reverted too
    // So we can't check wasProcessPoolCompletionCalled - it will be false
    // But we can verify that the pool was still completed despite handler failure
    Pool memory pool = castora.getPool(1);
    assertEq(pool.completionTime, block.timestamp);
    assertEq(pool.snapshotPrice, 95000000);

    // Verify that fees were transferred to the handler before it failed
    assertGt(cusd.balanceOf(address(failingHandler)), 0);
  }

  function testCompletePoolWithNonHandlerContract() public {
    // Set up non-handler contract as fee collector
    castora.setFeeCollector(address(nonHandlerContract));

    // Create pool and make prediction
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 1000000);
    vm.prank(user);
    cusd.approve(address(castora), 1000000);
    vm.prank(user);
    castora.predict(1, 99999);

    // Fund the fee collector to receive fees
    cusd.mint(address(nonHandlerContract), 0);

    // Fast forward to snapshot time
    vm.warp(block.timestamp + 1201);

    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;

    // Complete pool - should NOT revert even though contract doesn't implement interface
    castora.completePool(1, 95000000, 1, 950000, winnerPredictions);

    // Verify pool was completed despite interface mismatch
    Pool memory pool = castora.getPool(1);
    assertEq(pool.completionTime, block.timestamp);
    assertEq(pool.snapshotPrice, 95000000);
  }

  function testCompletePoolWithEOAFeeCollector() public {
    // Set up EOA as fee collector (code.length == 0)
    address eoaFeeCollector = makeAddr('eoaFeeCollector');
    castora.setFeeCollector(eoaFeeCollector);

    // Create pool and make prediction
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 1000000);
    vm.prank(user);
    cusd.approve(address(castora), 1000000);
    vm.prank(user);
    castora.predict(1, 99999);

    // Fast forward to snapshot time
    vm.warp(block.timestamp + 1201);

    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;

    // Complete pool - should NOT call processPoolCompletion since EOA has no code
    castora.completePool(1, 95000000, 1, 950000, winnerPredictions);

    // Verify pool was completed
    Pool memory pool = castora.getPool(1);
    assertEq(pool.completionTime, block.timestamp);
    assertEq(pool.snapshotPrice, 95000000);

    // Verify EOA received the fees
    assertGt(cusd.balanceOf(eoaFeeCollector), 0);
  }

  function testCompletePoolHandlerCallWithMockCall() public {
    // Use vm.mockCall to simulate specific handler behavior
    address mockHandler = makeAddr('mockHandler');

    // Deploy mock contract code to the address
    vm.etch(mockHandler, type(MockSuccessfulHandler).creationCode);
    castora.setFeeCollector(mockHandler);

    // Mock the processPoolCompletion call to track it was called
    vm.mockCall(
      mockHandler, abi.encodeWithSelector(MockSuccessfulHandler.processPoolCompletion.selector, 1), abi.encode()
    );

    // Create pool and make prediction
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 1000000);
    vm.prank(user);
    cusd.approve(address(castora), 1000000);
    vm.prank(user);
    castora.predict(1, 99999);

    // Fund the mock handler
    cusd.mint(mockHandler, 0);

    // Fast forward to snapshot time
    vm.warp(block.timestamp + 1201);

    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;

    // Expect the processPoolCompletion call
    vm.expectCall(mockHandler, abi.encodeWithSelector(MockSuccessfulHandler.processPoolCompletion.selector, 1));

    // Complete pool
    castora.completePool(1, 95000000, 1, 950000, winnerPredictions);

    // Verify pool was completed
    Pool memory pool = castora.getPool(1);
    assertEq(pool.completionTime, block.timestamp);
  }

  function testCompletePoolHandlerCallWithRevertingMockCall() public {
    // Use vm.mockCall to simulate a reverting handler
    address mockHandler = makeAddr('mockHandler');

    // Deploy mock contract code to the address
    vm.etch(mockHandler, type(MockFailingHandler).creationCode);
    castora.setFeeCollector(mockHandler);

    // Mock the processPoolCompletion call to revert
    vm.mockCallRevert(
      mockHandler,
      abi.encodeWithSelector(MockFailingHandler.processPoolCompletion.selector, 1),
      'Mocked handler failure'
    );

    // Create pool and make prediction
    castora.createPool(seedsErc20Stake);
    cusd.mint(user, 1000000);
    vm.prank(user);
    cusd.approve(address(castora), 1000000);
    vm.prank(user);
    castora.predict(1, 99999);

    // Fund the mock handler
    cusd.mint(mockHandler, 0);

    // Fast forward to snapshot time
    vm.warp(block.timestamp + 1201);

    uint256[] memory winnerPredictions = new uint256[](1);
    winnerPredictions[0] = 1;

    // Complete pool - should NOT revert despite mocked revert
    castora.completePool(1, 95000000, 1, 950000, winnerPredictions);

    // Verify pool was completed despite handler failure
    Pool memory pool = castora.getPool(1);
    assertEq(pool.completionTime, block.timestamp);
    assertEq(pool.snapshotPrice, 95000000);
  }
}
