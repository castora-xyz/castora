// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import 'forge-std/Test.sol';
import '../src/Castora.sol';
import '../src/cUSD.sol';

contract CastoraPaginationTest is Test {
  Castora castora;
  cUSD cusd;
  address owner;
  address feeCollector;
  address user1;
  address user2;
  address user3;
  PoolSeeds seedsErc20Stake;
  PoolSeeds seedsNativeStake;

  // Allow test contract to receive ETH
  receive() external payable {}

  function setUp() public {
    owner = address(this);
    feeCollector = makeAddr('feeCollector');
    user1 = makeAddr('user1');
    user2 = makeAddr('user2');
    user3 = makeAddr('user3');

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

  // Helper function to create multiple pools
  function _createMultiplePools(uint256 count) internal {
    for (uint256 i = 0; i < count; i++) {
      PoolSeeds memory seeds = PoolSeeds({
        predictionToken: address(cusd),
        stakeToken: address(cusd),
        stakeAmount: 1000000 + i, // Different stake amounts to make pools unique
        snapshotTime: block.timestamp + 1200 + i,
        windowCloseTime: block.timestamp + 900 + i
      });
      castora.createPool(seeds);
    }
  }

  // Helper function to create multiple predictions in a pool
  function _createMultiplePredictions(uint256 poolId, address user, uint256 count) internal {
    cusd.mint(user, 1000000 * count);
    vm.startPrank(user);
    cusd.approve(address(castora), 1000000 * count);

    for (uint256 i = 0; i < count; i++) {
      castora.predict(poolId, 1000000 + i * 10000); // Different prediction prices
    }
    vm.stopPrank();
  }

  // ========== Tests for getPoolsPaginated ==========

  function testGetPoolsPaginatedEmptyResult() public {
    // No pools created yet
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPoolsPaginated(1, 5);
  }

  function testGetPoolsPaginatedInvalidOffset() public {
    _createMultiplePools(3);

    // Test offset 0 (should be 1-based)
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPoolsPaginated(0, 5);

    // Test offset greater than number of pools
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPoolsPaginated(4, 5);
  }

  function testGetPoolsPaginatedSinglePool() public {
    _createMultiplePools(1);

    Pool[] memory pools = castora.getPoolsPaginated(1, 5);
    assertEq(pools.length, 1);
    assertEq(pools[0].poolId, 1);
    assertEq(pools[0].seeds.stakeAmount, 1000000);
  }

  function testGetPoolsPaginatedMultiplePools() public {
    _createMultiplePools(5);

    // Get all pools
    Pool[] memory allPools = castora.getPoolsPaginated(1, 10);
    assertEq(allPools.length, 5);
    for (uint256 i = 0; i < 5; i++) {
      assertEq(allPools[i].poolId, i + 1);
      assertEq(allPools[i].seeds.stakeAmount, 1000000 + i);
    }
  }

  function testGetPoolsPaginatedWithLimit() public {
    _createMultiplePools(5);

    // Get first 2 pools
    Pool[] memory firstTwo = castora.getPoolsPaginated(1, 2);
    assertEq(firstTwo.length, 2);
    assertEq(firstTwo[0].poolId, 1);
    assertEq(firstTwo[1].poolId, 2);

    // Get next 2 pools
    Pool[] memory nextTwo = castora.getPoolsPaginated(3, 2);
    assertEq(nextTwo.length, 2);
    assertEq(nextTwo[0].poolId, 3);
    assertEq(nextTwo[1].poolId, 4);

    // Get last pool
    Pool[] memory lastOne = castora.getPoolsPaginated(5, 2);
    assertEq(lastOne.length, 1);
    assertEq(lastOne[0].poolId, 5);
  }

  function testGetPoolsPaginatedLimitExceedsAvailable() public {
    _createMultiplePools(3);

    // Request more pools than available
    Pool[] memory pools = castora.getPoolsPaginated(2, 10);
    assertEq(pools.length, 2); // Should only return pools 2 and 3
    assertEq(pools[0].poolId, 2);
    assertEq(pools[1].poolId, 3);
  }

  // ========== Tests for getPoolPredictionsPaginated ==========

  function testGetPoolPredictionsPaginatedInvalidPoolId() public {
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPoolPredictionsPaginated(999, 1, 5);
  }

  function testGetPoolPredictionsPaginatedInvalidOffset() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 3);

    // Test offset 0 (should be 1-based)
    vm.expectRevert(InvalidPredictionId.selector);
    castora.getPoolPredictionsPaginated(1, 0, 5);

    // Test offset greater than number of predictions
    vm.expectRevert(InvalidPredictionId.selector);
    castora.getPoolPredictionsPaginated(1, 4, 5);
  }

  function testGetPoolPredictionsPaginatedEmptyPool() public {
    _createMultiplePools(1);

    // Pool exists but no predictions
    vm.expectRevert(InvalidPredictionId.selector);
    castora.getPoolPredictionsPaginated(1, 1, 5);
  }

  function testGetPoolPredictionsPaginatedSinglePrediction() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 1);

    Prediction[] memory predictions = castora.getPoolPredictionsPaginated(1, 1, 5);
    assertEq(predictions.length, 1);
    assertEq(predictions[0].predictionId, 1);
    assertEq(predictions[0].predicter, user1);
    assertEq(predictions[0].predictionPrice, 1000000);
  }

  function testGetPoolPredictionsPaginatedMultiplePredictions() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 5);

    // Get all predictions
    Prediction[] memory allPredictions = castora.getPoolPredictionsPaginated(1, 1, 10);
    assertEq(allPredictions.length, 5);
    for (uint256 i = 0; i < 5; i++) {
      assertEq(allPredictions[i].predictionId, i + 1);
      assertEq(allPredictions[i].predicter, user1);
      assertEq(allPredictions[i].predictionPrice, 1000000 + i * 10000);
    }
  }

  function testGetPoolPredictionsPaginatedWithLimit() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 5);

    // Get first 2 predictions
    Prediction[] memory firstTwo = castora.getPoolPredictionsPaginated(1, 1, 2);
    assertEq(firstTwo.length, 2);
    assertEq(firstTwo[0].predictionId, 1);
    assertEq(firstTwo[1].predictionId, 2);

    // Get next 2 predictions
    Prediction[] memory nextTwo = castora.getPoolPredictionsPaginated(1, 3, 2);
    assertEq(nextTwo.length, 2);
    assertEq(nextTwo[0].predictionId, 3);
    assertEq(nextTwo[1].predictionId, 4);

    // Get last prediction
    Prediction[] memory lastOne = castora.getPoolPredictionsPaginated(1, 5, 2);
    assertEq(lastOne.length, 1);
    assertEq(lastOne[0].predictionId, 5);
  }

  function testGetPoolPredictionsPaginatedLimitExceedsAvailable() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 3);

    // Request more predictions than available
    Prediction[] memory predictions = castora.getPoolPredictionsPaginated(1, 2, 10);
    assertEq(predictions.length, 2); // Should only return predictions 2 and 3
    assertEq(predictions[0].predictionId, 2);
    assertEq(predictions[1].predictionId, 3);
  }

  function testGetPoolPredictionsPaginatedMultipleUsers() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 2);
    _createMultiplePredictions(1, user2, 3);

    // Should get predictions from both users in order
    Prediction[] memory allPredictions = castora.getPoolPredictionsPaginated(1, 1, 10);
    assertEq(allPredictions.length, 5);

    // First 2 from user1
    assertEq(allPredictions[0].predicter, user1);
    assertEq(allPredictions[1].predicter, user1);

    // Next 3 from user2
    assertEq(allPredictions[2].predicter, user2);
    assertEq(allPredictions[3].predicter, user2);
    assertEq(allPredictions[4].predicter, user2);
  }

  // ========== Tests for getUserPredictionsPaginated ==========

  function testGetUserPredictionsPaginatedInvalidPoolId() public {
    vm.expectRevert(InvalidPoolId.selector);
    castora.getUserPredictionsPaginated(999, user1, 0, 5);
  }

  function testGetUserPredictionsPaginatedInvalidAddress() public {
    _createMultiplePools(1);

    vm.expectRevert(InvalidAddress.selector);
    castora.getUserPredictionsPaginated(1, address(0), 0, 5);
  }

  function testGetUserPredictionsPaginatedNoUserPredictions() public {
    _createMultiplePools(1);

    // User has made no predictions
    Prediction[] memory predictions = castora.getUserPredictionsPaginated(1, user1, 0, 5);
    assertEq(predictions.length, 0);
  }

  function testGetUserPredictionsPaginatedOffsetTooLarge() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 3);

    // Offset beyond available predictions
    Prediction[] memory predictions = castora.getUserPredictionsPaginated(1, user1, 5, 5);
    assertEq(predictions.length, 0);
  }

  function testGetUserPredictionsPaginatedSinglePrediction() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 1);

    Prediction[] memory predictions = castora.getUserPredictionsPaginated(1, user1, 0, 5);
    assertEq(predictions.length, 1);
    assertEq(predictions[0].predicter, user1);
    assertEq(predictions[0].predictionId, 1);
  }

  function testGetUserPredictionsPaginatedMultiplePredictions() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 5);

    // Get all user predictions
    Prediction[] memory allPredictions = castora.getUserPredictionsPaginated(1, user1, 0, 10);
    assertEq(allPredictions.length, 5);
    for (uint256 i = 0; i < 5; i++) {
      assertEq(allPredictions[i].predicter, user1);
      assertEq(allPredictions[i].predictionId, i + 1);
    }
  }

  function testGetUserPredictionsPaginatedWithLimit() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 5);

    // Get first 2 predictions (0-based offset)
    Prediction[] memory firstTwo = castora.getUserPredictionsPaginated(1, user1, 0, 2);
    assertEq(firstTwo.length, 2);
    assertEq(firstTwo[0].predictionId, 1);
    assertEq(firstTwo[1].predictionId, 2);

    // Get next 2 predictions
    Prediction[] memory nextTwo = castora.getUserPredictionsPaginated(1, user1, 2, 2);
    assertEq(nextTwo.length, 2);
    assertEq(nextTwo[0].predictionId, 3);
    assertEq(nextTwo[1].predictionId, 4);

    // Get last prediction
    Prediction[] memory lastOne = castora.getUserPredictionsPaginated(1, user1, 4, 2);
    assertEq(lastOne.length, 1);
    assertEq(lastOne[0].predictionId, 5);
  }

  function testGetUserPredictionsPaginatedLimitExceedsAvailable() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 3);

    // Request more predictions than available
    Prediction[] memory predictions = castora.getUserPredictionsPaginated(1, user1, 1, 10);
    assertEq(predictions.length, 2); // Should only return predictions at index 1 and 2
    assertEq(predictions[0].predictionId, 2);
    assertEq(predictions[1].predictionId, 3);
  }

  function testGetUserPredictionsPaginatedMultipleUsersInSamePool() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 3);
    _createMultiplePredictions(1, user2, 2);
    _createMultiplePredictions(1, user3, 1);

    // Get predictions for each user separately
    Prediction[] memory user1Predictions = castora.getUserPredictionsPaginated(1, user1, 0, 10);
    Prediction[] memory user2Predictions = castora.getUserPredictionsPaginated(1, user2, 0, 10);
    Prediction[] memory user3Predictions = castora.getUserPredictionsPaginated(1, user3, 0, 10);

    assertEq(user1Predictions.length, 3);
    assertEq(user2Predictions.length, 2);
    assertEq(user3Predictions.length, 1);

    // Verify each user only gets their own predictions
    for (uint256 i = 0; i < user1Predictions.length; i++) {
      assertEq(user1Predictions[i].predicter, user1);
    }
    for (uint256 i = 0; i < user2Predictions.length; i++) {
      assertEq(user2Predictions[i].predicter, user2);
    }
    assertEq(user3Predictions[0].predicter, user3);
  }

  function testGetUserPredictionsPaginatedMultiplePools() public {
    _createMultiplePools(2);
    _createMultiplePredictions(1, user1, 3);
    // Need to mint additional tokens for second pool since each pool has different stake amounts
    cusd.mint(user1, 2000002); // Pool 2 has stakeAmount = 1000001
    vm.startPrank(user1);
    cusd.approve(address(castora), 2000002);
    for (uint256 i = 0; i < 2; i++) {
      castora.predict(2, 1000000 + i * 10000);
    }
    vm.stopPrank();

    // Get predictions for each pool separately
    Prediction[] memory pool1Predictions = castora.getUserPredictionsPaginated(1, user1, 0, 10);
    Prediction[] memory pool2Predictions = castora.getUserPredictionsPaginated(2, user1, 0, 10);

    assertEq(pool1Predictions.length, 3);
    assertEq(pool2Predictions.length, 2);

    // Verify pool IDs are correct
    for (uint256 i = 0; i < pool1Predictions.length; i++) {
      assertEq(pool1Predictions[i].poolId, 1);
    }
    for (uint256 i = 0; i < pool2Predictions.length; i++) {
      assertEq(pool2Predictions[i].poolId, 2);
    }
  }

  // ========== Tests for getPools (batch getter) ==========

  function testGetPoolsEmptyArray() public {
    _createMultiplePools(3);

    // Test with empty array
    uint256[] memory emptyPoolIds = new uint256[](0);
    Pool[] memory pools = castora.getPools(emptyPoolIds);
    assertEq(pools.length, 0);
  }

  function testGetPoolsInvalidPoolId() public {
    _createMultiplePools(2);

    // Test with invalid pool ID (0)
    uint256[] memory poolIds = new uint256[](1);
    poolIds[0] = 0;
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPools(poolIds);

    // Test with invalid pool ID (greater than noOfPools)
    poolIds[0] = 999;
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPools(poolIds);
  }

  function testGetPoolsSinglePool() public {
    _createMultiplePools(3);

    uint256[] memory poolIds = new uint256[](1);
    poolIds[0] = 2;

    Pool[] memory pools = castora.getPools(poolIds);
    assertEq(pools.length, 1);
    assertEq(pools[0].poolId, 2);
    assertEq(pools[0].seeds.stakeAmount, 1000001); // Second pool has stakeAmount + 1
  }

  function testGetPoolsMultiplePools() public {
    _createMultiplePools(5);

    uint256[] memory poolIds = new uint256[](3);
    poolIds[0] = 1;
    poolIds[1] = 3;
    poolIds[2] = 5;

    Pool[] memory pools = castora.getPools(poolIds);
    assertEq(pools.length, 3);

    // Verify correct pools returned in correct order
    assertEq(pools[0].poolId, 1);
    assertEq(pools[0].seeds.stakeAmount, 1000000);

    assertEq(pools[1].poolId, 3);
    assertEq(pools[1].seeds.stakeAmount, 1000002);

    assertEq(pools[2].poolId, 5);
    assertEq(pools[2].seeds.stakeAmount, 1000004);
  }

  function testGetPoolsAllPools() public {
    _createMultiplePools(3);

    uint256[] memory poolIds = new uint256[](3);
    poolIds[0] = 1;
    poolIds[1] = 2;
    poolIds[2] = 3;

    Pool[] memory pools = castora.getPools(poolIds);
    assertEq(pools.length, 3);

    for (uint256 i = 0; i < 3; i++) {
      assertEq(pools[i].poolId, i + 1);
      assertEq(pools[i].seeds.stakeAmount, 1000000 + i);
    }
  }

  function testGetPoolsDuplicateIds() public {
    _createMultiplePools(2);

    uint256[] memory poolIds = new uint256[](3);
    poolIds[0] = 1;
    poolIds[1] = 2;
    poolIds[2] = 1; // Duplicate

    Pool[] memory pools = castora.getPools(poolIds);
    assertEq(pools.length, 3);

    assertEq(pools[0].poolId, 1);
    assertEq(pools[1].poolId, 2);
    assertEq(pools[2].poolId, 1); // Should return the same pool again
    assertEq(pools[0].seeds.stakeAmount, pools[2].seeds.stakeAmount);
  }

  function testGetPoolsOutOfOrderIds() public {
    _createMultiplePools(4);

    uint256[] memory poolIds = new uint256[](4);
    poolIds[0] = 4;
    poolIds[1] = 1;
    poolIds[2] = 3;
    poolIds[3] = 2;

    Pool[] memory pools = castora.getPools(poolIds);
    assertEq(pools.length, 4);

    // Should return pools in the order requested, not sorted
    assertEq(pools[0].poolId, 4);
    assertEq(pools[1].poolId, 1);
    assertEq(pools[2].poolId, 3);
    assertEq(pools[3].poolId, 2);
  }

  function testGetPoolsMixedValidInvalid() public {
    _createMultiplePools(2);

    uint256[] memory poolIds = new uint256[](3);
    poolIds[0] = 1;
    poolIds[1] = 999; // Invalid
    poolIds[2] = 2;

    // Should revert on the first invalid ID encountered
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPools(poolIds);
  }

  // ========== Tests for getPredictions (batch getter) ==========

  function testGetPredictionsEmptyArray() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 3);

    // Test with empty array
    uint256[] memory emptyPredictionIds = new uint256[](0);
    Prediction[] memory predictions = castora.getPredictions(1, emptyPredictionIds);
    assertEq(predictions.length, 0);
  }

  function testGetPredictionsInvalidPoolId() public {
    uint256[] memory predictionIds = new uint256[](1);
    predictionIds[0] = 1;

    // Test with pool ID 0
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPredictions(0, predictionIds);

    // Test with non-existent pool ID
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPredictions(999, predictionIds);
  }

  function testGetPredictionsInvalidPredictionId() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 2);

    // Test with prediction ID 0
    uint256[] memory predictionIds = new uint256[](1);
    predictionIds[0] = 0;
    vm.expectRevert(InvalidPredictionId.selector);
    castora.getPredictions(1, predictionIds);

    // Test with prediction ID greater than pool's noOfPredictions
    predictionIds[0] = 999;
    vm.expectRevert(InvalidPredictionId.selector);
    castora.getPredictions(1, predictionIds);
  }

  function testGetPredictionsSinglePrediction() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 3);

    uint256[] memory predictionIds = new uint256[](1);
    predictionIds[0] = 2;

    Prediction[] memory predictions = castora.getPredictions(1, predictionIds);
    assertEq(predictions.length, 1);
    assertEq(predictions[0].predictionId, 2);
    assertEq(predictions[0].predicter, user1);
    assertEq(predictions[0].poolId, 1);
    assertEq(predictions[0].predictionPrice, 1010000); // Base + 1 * 10000
  }

  function testGetPredictionsMultiplePredictions() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 2);
    _createMultiplePredictions(1, user2, 3);

    uint256[] memory predictionIds = new uint256[](3);
    predictionIds[0] = 1;
    predictionIds[1] = 3;
    predictionIds[2] = 5;

    Prediction[] memory predictions = castora.getPredictions(1, predictionIds);
    assertEq(predictions.length, 3);

    // Verify correct predictions returned
    assertEq(predictions[0].predictionId, 1);
    assertEq(predictions[0].predicter, user1);

    assertEq(predictions[1].predictionId, 3);
    assertEq(predictions[1].predicter, user2);

    assertEq(predictions[2].predictionId, 5);
    assertEq(predictions[2].predicter, user2);
  }

  function testGetPredictionsAllPredictionsInPool() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 3);

    uint256[] memory predictionIds = new uint256[](3);
    predictionIds[0] = 1;
    predictionIds[1] = 2;
    predictionIds[2] = 3;

    Prediction[] memory predictions = castora.getPredictions(1, predictionIds);
    assertEq(predictions.length, 3);

    for (uint256 i = 0; i < 3; i++) {
      assertEq(predictions[i].predictionId, i + 1);
      assertEq(predictions[i].predicter, user1);
      assertEq(predictions[i].poolId, 1);
      assertEq(predictions[i].predictionPrice, 1000000 + i * 10000);
    }
  }

  function testGetPredictionsDuplicateIds() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 2);

    uint256[] memory predictionIds = new uint256[](3);
    predictionIds[0] = 1;
    predictionIds[1] = 2;
    predictionIds[2] = 1; // Duplicate

    Prediction[] memory predictions = castora.getPredictions(1, predictionIds);
    assertEq(predictions.length, 3);

    assertEq(predictions[0].predictionId, 1);
    assertEq(predictions[1].predictionId, 2);
    assertEq(predictions[2].predictionId, 1); // Should return same prediction again
    assertEq(predictions[0].predictionPrice, predictions[2].predictionPrice);
  }

  function testGetPredictionsOutOfOrder() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 4);

    uint256[] memory predictionIds = new uint256[](4);
    predictionIds[0] = 4;
    predictionIds[1] = 1;
    predictionIds[2] = 3;
    predictionIds[3] = 2;

    Prediction[] memory predictions = castora.getPredictions(1, predictionIds);
    assertEq(predictions.length, 4);

    // Should return predictions in the order requested, not sorted
    assertEq(predictions[0].predictionId, 4);
    assertEq(predictions[1].predictionId, 1);
    assertEq(predictions[2].predictionId, 3);
    assertEq(predictions[3].predictionId, 2);
  }

  function testGetPredictionsDifferentPools() public {
    _createMultiplePools(2);
    _createMultiplePredictions(1, user1, 2);

    // Pool 2 has different stake amount (1000001), so need to mint and approve accordingly
    cusd.mint(user2, 2000002);
    vm.startPrank(user2);
    cusd.approve(address(castora), 2000002);
    for (uint256 i = 0; i < 2; i++) {
      castora.predict(2, 2000000 + i * 10000);
    }
    vm.stopPrank();

    // Get predictions from pool 1
    uint256[] memory pool1PredictionIds = new uint256[](2);
    pool1PredictionIds[0] = 1;
    pool1PredictionIds[1] = 2;

    Prediction[] memory pool1Predictions = castora.getPredictions(1, pool1PredictionIds);
    assertEq(pool1Predictions.length, 2);

    for (uint256 i = 0; i < 2; i++) {
      assertEq(pool1Predictions[i].poolId, 1);
      assertEq(pool1Predictions[i].predicter, user1);
    }

    // Get predictions from pool 2
    uint256[] memory pool2PredictionIds = new uint256[](2);
    pool2PredictionIds[0] = 1;
    pool2PredictionIds[1] = 2;

    Prediction[] memory pool2Predictions = castora.getPredictions(2, pool2PredictionIds);
    assertEq(pool2Predictions.length, 2);

    for (uint256 i = 0; i < 2; i++) {
      assertEq(pool2Predictions[i].poolId, 2);
      assertEq(pool2Predictions[i].predicter, user2);
    }
  }

  function testGetPredictionsMixedValidInvalid() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 2);

    uint256[] memory predictionIds = new uint256[](3);
    predictionIds[0] = 1;
    predictionIds[1] = 999; // Invalid
    predictionIds[2] = 2;

    // Should revert on the first invalid ID encountered
    vm.expectRevert(InvalidPredictionId.selector);
    castora.getPredictions(1, predictionIds);
  }

  function testGetPredictionsWithBulkPredictions() public {
    _createMultiplePools(1);

    // Create bulk predictions
    cusd.mint(user1, 3000000);
    vm.startPrank(user1);
    cusd.approve(address(castora), 3000000);
    castora.bulkPredict(1, 55555, 3);
    vm.stopPrank();

    uint256[] memory predictionIds = new uint256[](3);
    predictionIds[0] = 1;
    predictionIds[1] = 2;
    predictionIds[2] = 3;

    Prediction[] memory predictions = castora.getPredictions(1, predictionIds);
    assertEq(predictions.length, 3);

    // All should have the same price from bulk predict
    for (uint256 i = 0; i < 3; i++) {
      assertEq(predictions[i].predictionPrice, 55555);
      assertEq(predictions[i].predicter, user1);
      assertEq(predictions[i].predictionId, i + 1);
    }
  }

  // ========== Tests for getPredictionsForAddressPaginated ==========

  function testGetPredictionsForAddressPaginatedInvalidPoolId() public {
    vm.expectRevert(InvalidPoolId.selector);
    castora.getPredictionsForAddressPaginated(999, user1, 0, 5);

    vm.expectRevert(InvalidPoolId.selector);
    castora.getPredictionsForAddressPaginated(0, user1, 0, 5);
  }

  function testGetPredictionsForAddressPaginatedInvalidAddress() public {
    _createMultiplePools(1);

    vm.expectRevert(InvalidAddress.selector);
    castora.getPredictionsForAddressPaginated(1, address(0), 0, 5);
  }

  function testGetPredictionsForAddressPaginatedNoUserPredictions() public {
    _createMultiplePools(1);

    // User has made no predictions
    Prediction[] memory predictions = castora.getPredictionsForAddressPaginated(1, user1, 0, 5);
    assertEq(predictions.length, 0);
  }

  function testGetPredictionsForAddressPaginatedOffsetTooLarge() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 3);

    // Offset beyond available predictions
    Prediction[] memory predictions = castora.getPredictionsForAddressPaginated(1, user1, 5, 5);
    assertEq(predictions.length, 0);
  }

  function testGetPredictionsForAddressPaginatedSinglePrediction() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 1);

    Prediction[] memory predictions = castora.getPredictionsForAddressPaginated(1, user1, 0, 5);
    assertEq(predictions.length, 1);
    assertEq(predictions[0].predicter, user1);
    assertEq(predictions[0].predictionId, 1);
    assertEq(predictions[0].poolId, 1);
    assertEq(predictions[0].predictionPrice, 1000000);
  }

  function testGetPredictionsForAddressPaginatedMultiplePredictions() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 5);

    // Get all user predictions
    Prediction[] memory allPredictions = castora.getPredictionsForAddressPaginated(1, user1, 0, 10);
    assertEq(allPredictions.length, 5);
    for (uint256 i = 0; i < 5; i++) {
      assertEq(allPredictions[i].predicter, user1);
      assertEq(allPredictions[i].predictionId, i + 1);
      assertEq(allPredictions[i].poolId, 1);
      assertEq(allPredictions[i].predictionPrice, 1000000 + i * 10000);
    }
  }

  function testGetPredictionsForAddressPaginatedWithLimit() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 5);

    // Get first 2 predictions (0-based offset)
    Prediction[] memory firstTwo = castora.getPredictionsForAddressPaginated(1, user1, 0, 2);
    assertEq(firstTwo.length, 2);
    assertEq(firstTwo[0].predictionId, 1);
    assertEq(firstTwo[1].predictionId, 2);

    // Get next 2 predictions
    Prediction[] memory nextTwo = castora.getPredictionsForAddressPaginated(1, user1, 2, 2);
    assertEq(nextTwo.length, 2);
    assertEq(nextTwo[0].predictionId, 3);
    assertEq(nextTwo[1].predictionId, 4);

    // Get last prediction
    Prediction[] memory lastOne = castora.getPredictionsForAddressPaginated(1, user1, 4, 2);
    assertEq(lastOne.length, 1);
    assertEq(lastOne[0].predictionId, 5);
  }

  function testGetPredictionsForAddressPaginatedLimitExceedsAvailable() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 3);

    // Request more predictions than available
    Prediction[] memory predictions = castora.getPredictionsForAddressPaginated(1, user1, 1, 10);
    assertEq(predictions.length, 2); // Should only return predictions at index 1 and 2
    assertEq(predictions[0].predictionId, 2);
    assertEq(predictions[1].predictionId, 3);
  }

  function testGetPredictionsForAddressPaginatedMultipleUsersInSamePool() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 3);
    _createMultiplePredictions(1, user2, 2);
    _createMultiplePredictions(1, user3, 1);

    // Get predictions for each user separately
    Prediction[] memory user1Predictions = castora.getPredictionsForAddressPaginated(1, user1, 0, 10);
    Prediction[] memory user2Predictions = castora.getPredictionsForAddressPaginated(1, user2, 0, 10);
    Prediction[] memory user3Predictions = castora.getPredictionsForAddressPaginated(1, user3, 0, 10);

    assertEq(user1Predictions.length, 3);
    assertEq(user2Predictions.length, 2);
    assertEq(user3Predictions.length, 1);

    // Verify each user only gets their own predictions
    for (uint256 i = 0; i < user1Predictions.length; i++) {
      assertEq(user1Predictions[i].predicter, user1);
    }
    for (uint256 i = 0; i < user2Predictions.length; i++) {
      assertEq(user2Predictions[i].predicter, user2);
    }
    assertEq(user3Predictions[0].predicter, user3);

    // Verify user2's predictions have correct IDs (should be 4 and 5 since user1 made 1,2,3)
    assertEq(user2Predictions[0].predictionId, 4);
    assertEq(user2Predictions[1].predictionId, 5);

    // Verify user3's prediction has correct ID (should be 6)
    assertEq(user3Predictions[0].predictionId, 6);
  }

  function testGetPredictionsForAddressPaginatedMultiplePools() public {
    _createMultiplePools(2);
    _createMultiplePredictions(1, user1, 3);

    // Need to mint additional tokens for second pool since each pool has different stake amounts
    cusd.mint(user1, 2000002); // Pool 2 has stakeAmount = 1000001
    vm.startPrank(user1);
    cusd.approve(address(castora), 2000002);
    for (uint256 i = 0; i < 2; i++) {
      castora.predict(2, 2000000 + i * 10000);
    }
    vm.stopPrank();

    // Get predictions for each pool separately
    Prediction[] memory pool1Predictions = castora.getPredictionsForAddressPaginated(1, user1, 0, 10);
    Prediction[] memory pool2Predictions = castora.getPredictionsForAddressPaginated(2, user1, 0, 10);

    assertEq(pool1Predictions.length, 3);
    assertEq(pool2Predictions.length, 2);

    // Verify pool IDs are correct
    for (uint256 i = 0; i < pool1Predictions.length; i++) {
      assertEq(pool1Predictions[i].poolId, 1);
      assertEq(pool1Predictions[i].predicter, user1);
    }
    for (uint256 i = 0; i < pool2Predictions.length; i++) {
      assertEq(pool2Predictions[i].poolId, 2);
      assertEq(pool2Predictions[i].predicter, user1);
      assertEq(pool2Predictions[i].predictionPrice, 2000000 + i * 10000);
    }
  }

  function testGetPredictionsForAddressPaginatedWithBulkPredictions() public {
    _createMultiplePools(1);

    // Create bulk predictions
    cusd.mint(user1, 3000000);
    vm.startPrank(user1);
    cusd.approve(address(castora), 3000000);
    castora.bulkPredict(1, 55555, 3);
    vm.stopPrank();

    Prediction[] memory predictions = castora.getPredictionsForAddressPaginated(1, user1, 0, 10);
    assertEq(predictions.length, 3);

    // All should have the same price from bulk predict
    for (uint256 i = 0; i < 3; i++) {
      assertEq(predictions[i].predicter, user1);
      assertEq(predictions[i].predictionPrice, 55555);
      assertEq(predictions[i].predictionId, i + 1);
      assertEq(predictions[i].poolId, 1);
    }
  }

  function testGetPredictionsForAddressPaginatedEmptyPool() public {
    _createMultiplePools(1);

    // Pool exists but user made no predictions
    Prediction[] memory predictions = castora.getPredictionsForAddressPaginated(1, user1, 0, 5);
    assertEq(predictions.length, 0);
  }

  function testGetPredictionsForAddressPaginatedMixedUserActivity() public {
    _createMultiplePools(1);

    // user1 makes some predictions
    _createMultiplePredictions(1, user1, 2);

    // user2 makes some predictions in between
    _createMultiplePredictions(1, user2, 1);

    // user1 makes more predictions
    _createMultiplePredictions(1, user1, 2);

    // Get all predictions for user1 - should only get user1's predictions, not user2's
    Prediction[] memory user1Predictions = castora.getPredictionsForAddressPaginated(1, user1, 0, 10);
    assertEq(user1Predictions.length, 4);

    // Verify all returned predictions belong to user1
    for (uint256 i = 0; i < user1Predictions.length; i++) {
      assertEq(user1Predictions[i].predicter, user1);
    }

    // Verify the prediction IDs are correct (1, 2, 4, 5 - skipping 3 which belongs to user2)
    assertEq(user1Predictions[0].predictionId, 1);
    assertEq(user1Predictions[1].predictionId, 2);
    assertEq(user1Predictions[2].predictionId, 4);
    assertEq(user1Predictions[3].predictionId, 5);

    // Test pagination within user1's predictions
    Prediction[] memory firstTwo = castora.getPredictionsForAddressPaginated(1, user1, 0, 2);
    assertEq(firstTwo.length, 2);
    assertEq(firstTwo[0].predictionId, 1);
    assertEq(firstTwo[1].predictionId, 2);

    Prediction[] memory lastTwo = castora.getPredictionsForAddressPaginated(1, user1, 2, 2);
    assertEq(lastTwo.length, 2);
    assertEq(lastTwo[0].predictionId, 4);
    assertEq(lastTwo[1].predictionId, 5);
  }

  // ========== Tests for getUserActivitiesOptimizedPaginated ==========

  function testGetUserActivitiesOptimizedPaginatedInvalidAddress() public {
    vm.expectRevert(InvalidAddress.selector);
    castora.getUserActivitiesOptimizedPaginated(address(0), 0, 5);
  }

  function testGetUserActivitiesOptimizedPaginatedNoUserActivities() public {
    _createMultiplePools(2);

    // User has made no predictions
    (Pool[] memory pools, Prediction[] memory predictions, uint256[] memory poolIndexes) =
      castora.getUserActivitiesOptimizedPaginated(user1, 0, 5);

    assertEq(pools.length, 0);
    assertEq(predictions.length, 0);
    assertEq(poolIndexes.length, 0);
  }

  function testGetUserActivitiesOptimizedPaginatedOffsetTooLarge() public {
    _createMultiplePools(2);
    _createMultiplePredictions(1, user1, 3);

    // Offset beyond available activities (user1 has 3 activities total)
    (Pool[] memory pools, Prediction[] memory predictions, uint256[] memory poolIndexes) =
      castora.getUserActivitiesOptimizedPaginated(user1, 5, 5);

    assertEq(pools.length, 0);
    assertEq(predictions.length, 0);
    assertEq(poolIndexes.length, 0);
  }

  function testGetUserActivitiesOptimizedPaginatedSingleActivity() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 1);

    (Pool[] memory pools, Prediction[] memory predictions, uint256[] memory poolIndexes) =
      castora.getUserActivitiesOptimizedPaginated(user1, 0, 5);

    assertEq(pools.length, 1);
    assertEq(predictions.length, 1);
    assertEq(poolIndexes.length, 1);

    // Verify pool data
    assertEq(pools[0].poolId, 1);
    assertEq(pools[0].seeds.stakeAmount, 1000000);

    // Verify prediction data
    assertEq(predictions[0].predictionId, 1);
    assertEq(predictions[0].predicter, user1);
    assertEq(predictions[0].poolId, 1);

    // Verify mapping
    assertEq(poolIndexes[0], 0); // Points to first pool in unique pools array
  }

  function testGetUserActivitiesOptimizedPaginatedMultipleActivitiesSamePool() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 5);

    (Pool[] memory pools, Prediction[] memory predictions, uint256[] memory poolIndexes) =
      castora.getUserActivitiesOptimizedPaginated(user1, 0, 10);

    // assertEq(pools.length, 1); // Only one unique pool
    assertEq(predictions.length, 5); // All 5 predictions
    assertEq(poolIndexes.length, 5);

    // Verify unique pool
    assertEq(pools[0].poolId, 1);

    // Verify all predictions are chronological
    for (uint256 i = 0; i < 5; i++) {
      assertEq(predictions[i].predictionId, i + 1);
      assertEq(predictions[i].predicter, user1);
      assertEq(predictions[i].poolId, 1);
      assertEq(poolIndexes[i], 0); // All point to the same unique pool
    }
  }

  function testGetUserActivitiesOptimizedPaginatedMultiplePoolsSinglePredictionEach() public {
    _createMultiplePools(3);
    _createMultiplePredictions(1, user1, 1);

    // Need different stake amounts for different pools
    cusd.mint(user1, 1000001 + 1000002);
    vm.startPrank(user1);
    cusd.approve(address(castora), 1000001 + 1000002);
    castora.predict(2, 2000000); // Pool 2
    castora.predict(3, 3000000); // Pool 3
    vm.stopPrank();

    (Pool[] memory pools, Prediction[] memory predictions, uint256[] memory poolIndexes) =
      castora.getUserActivitiesOptimizedPaginated(user1, 0, 10);

    assertEq(pools.length, 3); // Three unique pools
    assertEq(predictions.length, 3); // Three predictions
    assertEq(poolIndexes.length, 3);

    // Verify chronological order (predictions made in order: pool1, pool2, pool3)
    assertEq(predictions[0].poolId, 1);
    assertEq(predictions[1].poolId, 2);
    assertEq(predictions[2].poolId, 3);

    // Verify pool indexes map correctly to unique pools array
    assertEq(poolIndexes[0], 0); // First unique pool
    assertEq(poolIndexes[1], 1); // Second unique pool
    assertEq(poolIndexes[2], 2); // Third unique pool

    // Verify unique pools are correct
    assertEq(pools[0].poolId, 1);
    assertEq(pools[1].poolId, 2);
    assertEq(pools[2].poolId, 3);
  }

  function testGetUserActivitiesOptimizedPaginatedMixedPoolsAndPredictions() public {
    _createMultiplePools(2);

    // User1 makes 3 predictions in pool 1
    _createMultiplePredictions(1, user1, 3);

    // User1 makes 2 predictions in pool 2
    cusd.mint(user1, 2000002); // Pool 2 has stakeAmount = 1000001
    vm.startPrank(user1);
    cusd.approve(address(castora), 2000002);
    castora.predict(2, 2000000);
    castora.predict(2, 2010000);
    vm.stopPrank();

    // User1 makes 1 more prediction in pool 1
    cusd.mint(user1, 1000000);
    vm.startPrank(user1);
    cusd.approve(address(castora), 1000000);
    castora.predict(1, 1040000);
    vm.stopPrank();

    (Pool[] memory pools, Prediction[] memory predictions, uint256[] memory poolIndexes) =
      castora.getUserActivitiesOptimizedPaginated(user1, 0, 10);

    assertEq(pools.length, 2); // Two unique pools
    assertEq(predictions.length, 6); // Total 6 predictions
    assertEq(poolIndexes.length, 6);

    // Verify chronological order: pool1(3x), pool2(2x), pool1(1x)
    assertEq(predictions[0].poolId, 1);
    assertEq(predictions[1].poolId, 1);
    assertEq(predictions[2].poolId, 1);
    assertEq(predictions[3].poolId, 2);
    assertEq(predictions[4].poolId, 2);
    assertEq(predictions[5].poolId, 1);

    // Verify pool indexes
    assertEq(poolIndexes[0], 0); // Pool 1
    assertEq(poolIndexes[1], 0); // Pool 1
    assertEq(poolIndexes[2], 0); // Pool 1
    assertEq(poolIndexes[3], 1); // Pool 2
    assertEq(poolIndexes[4], 1); // Pool 2
    assertEq(poolIndexes[5], 0); // Pool 1 again
  }

  function testGetUserActivitiesOptimizedPaginatedWithPagination() public {
    _createMultiplePools(2);

    // Create 8 total activities across pools
    _createMultiplePredictions(1, user1, 4);
    cusd.mint(user1, 4000004); // Pool 2 stake amount * 4
    vm.startPrank(user1);
    cusd.approve(address(castora), 4000004);
    for (uint256 i = 0; i < 4; i++) {
      castora.predict(2, 2000000 + i * 10000);
    }
    vm.stopPrank();

    // Test first page (offset 0, limit 3)
    (Pool[] memory pools1, Prediction[] memory predictions1, uint256[] memory poolIndexes1) =
      castora.getUserActivitiesOptimizedPaginated(user1, 0, 3);

    assertEq(pools1.length, 1); // Only pool 1 in first 3 activities
    assertEq(predictions1.length, 3);
    assertEq(poolIndexes1.length, 3);

    for (uint256 i = 0; i < 3; i++) {
      assertEq(predictions1[i].poolId, 1);
      assertEq(poolIndexes1[i], 0);
    }

    // Test second page (offset 3, limit 3)
    (Pool[] memory pools2, Prediction[] memory predictions2, uint256[] memory poolIndexes2) =
      castora.getUserActivitiesOptimizedPaginated(user1, 3, 3);

    assertEq(pools2.length, 2); // Both pools appear in this range
    assertEq(predictions2.length, 3);
    assertEq(poolIndexes2.length, 3);

    // Should be: pool1(1x), pool2(2x)
    assertEq(predictions2[0].poolId, 1);
    assertEq(predictions2[1].poolId, 2);
    assertEq(predictions2[2].poolId, 2);
  }

  function testGetUserActivitiesOptimizedPaginatedLimitExceedsAvailable() public {
    _createMultiplePools(1);
    _createMultiplePredictions(1, user1, 3);

    // Request more than available from offset 1
    (Pool[] memory pools, Prediction[] memory predictions, uint256[] memory poolIndexes) =
      castora.getUserActivitiesOptimizedPaginated(user1, 1, 10);

    assertEq(pools.length, 1);
    assertEq(predictions.length, 2); // Should only return 2 remaining activities
    assertEq(poolIndexes.length, 2);

    // Verify correct activities returned
    assertEq(predictions[0].predictionId, 2);
    assertEq(predictions[1].predictionId, 3);
  }

  function testGetUserActivitiesOptimizedPaginatedMultipleUsers() public {
    _createMultiplePools(1);

    // Multiple users make predictions in same pool
    _createMultiplePredictions(1, user1, 2);
    _createMultiplePredictions(1, user2, 3);
    _createMultiplePredictions(1, user3, 1);

    // Check user1's activities
    (, Prediction[] memory predictions1,) = castora.getUserActivitiesOptimizedPaginated(user1, 0, 10);

    assertEq(predictions1.length, 2);
    for (uint256 i = 0; i < predictions1.length; i++) {
      assertEq(predictions1[i].predicter, user1);
    }

    // Check user2's activities
    (, Prediction[] memory predictions2,) = castora.getUserActivitiesOptimizedPaginated(user2, 0, 10);

    assertEq(predictions2.length, 3);
    for (uint256 i = 0; i < predictions2.length; i++) {
      assertEq(predictions2[i].predicter, user2);
    }

    // Check user3's activities
    (, Prediction[] memory predictions3,) = castora.getUserActivitiesOptimizedPaginated(user3, 0, 10);

    assertEq(predictions3.length, 1);
    assertEq(predictions3[0].predicter, user3);
  }

  function testGetUserActivitiesOptimizedPaginatedWithBulkPredictions() public {
    _createMultiplePools(1);

    // Make regular predictions
    _createMultiplePredictions(1, user1, 2);

    // Make bulk predictions
    cusd.mint(user1, 3000000);
    vm.startPrank(user1);
    cusd.approve(address(castora), 3000000);
    castora.bulkPredict(1, 77777, 3);
    vm.stopPrank();

    (Pool[] memory pools, Prediction[] memory predictions, uint256[] memory poolIndexes) =
      castora.getUserActivitiesOptimizedPaginated(user1, 0, 10);

    assertEq(pools.length, 1);
    assertEq(predictions.length, 5); // 2 regular + 3 bulk
    assertEq(poolIndexes.length, 5);

    // Verify chronological order and correct data
    for (uint256 i = 0; i < 2; i++) {
      assertEq(predictions[i].predictionPrice, 1000000 + i * 10000); // Regular predictions
    }
    for (uint256 i = 2; i < 5; i++) {
      assertEq(predictions[i].predictionPrice, 77777); // Bulk predictions
    }
  }

  function testGetUserActivitiesOptimizedPaginatedComplexScenario() public {
    _createMultiplePools(3);

    // Complex activity pattern:
    // Pool 1: 2 predictions
    _createMultiplePredictions(1, user1, 2);

    // Pool 3: 1 prediction (skipping pool 2)
    cusd.mint(user1, 1000002); // Pool 3 stake amount
    vm.startPrank(user1);
    cusd.approve(address(castora), 1000002);
    castora.predict(3, 3000000);
    vm.stopPrank();

    // Pool 1: 1 more prediction
    cusd.mint(user1, 1000000);
    vm.startPrank(user1);
    cusd.approve(address(castora), 1000000);
    castora.predict(1, 1030000);
    vm.stopPrank();

    // Pool 2: 2 predictions
    cusd.mint(user1, 2000002);
    vm.startPrank(user1);
    cusd.approve(address(castora), 2000002);
    castora.predict(2, 2000000);
    castora.predict(2, 2010000);
    vm.stopPrank();

    (Pool[] memory pools, Prediction[] memory predictions,) = castora.getUserActivitiesOptimizedPaginated(user1, 0, 10);

    assertEq(pools.length, 3); // Three unique pools used
    assertEq(predictions.length, 6); // Total activities

    // Verify chronological order: pool1(2x), pool3(1x), pool1(1x), pool2(2x)
    uint256[] memory expectedPools = new uint256[](6);
    expectedPools[0] = 1;
    expectedPools[1] = 1;
    expectedPools[2] = 3;
    expectedPools[3] = 1;
    expectedPools[4] = 2;
    expectedPools[5] = 2;

    for (uint256 i = 0; i < 6; i++) {
      assertEq(predictions[i].poolId, expectedPools[i]);
      assertEq(predictions[i].predicter, user1);
    }

    // Verify unique pools contain all used pools
    bool foundPool1 = false;
    bool foundPool2 = false;
    bool foundPool3 = false;
    for (uint256 i = 0; i < pools.length; i++) {
      if (pools[i].poolId == 1) foundPool1 = true;
      if (pools[i].poolId == 2) foundPool2 = true;
      if (pools[i].poolId == 3) foundPool3 = true;
    }
    assertTrue(foundPool1);
    assertTrue(foundPool2);
    assertTrue(foundPool3);
  }
}
