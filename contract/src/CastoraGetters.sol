// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {CastoraErrors} from './CastoraErrors.sol';
import {CastoraState} from './CastoraState.sol';
import {CastoraStructs} from './CastoraStructs.sol';

contract CastoraGetters is CastoraErrors, CastoraStructs {
  CastoraState public immutable state;
  address public immutable castora;

  constructor(address castora_) {
    if (castora_ == address(0)) revert InvalidAddress();
    castora = castora_;
    state = CastoraState(castora_);
  }

  /// Returns global statistics for all pools and predictions
  /// @return stats Struct containing aggregated protocol statistics
  function allStats() public view returns (AllPredictionStats memory stats) {
    (uint256 a, uint256 b, uint256 c, uint256 d, uint256 e, uint256 f, uint256 g, uint256 h) = state.allStats();
    stats = AllPredictionStats(a, b, c, d, e, f, g, h);
  }

  /// Paginates through address arrays to handle large datasets
  /// @param array Storage array to paginate
  /// @param total Total length of the array
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of items to return
  /// @return items Slice of addresses from the array
  function _paginateAddressArray(
    function (uint256) external view returns (address) array,
    uint256 total,
    uint256 offset,
    uint256 limit
  ) internal view returns (address[] memory items) {
    if (offset >= total) return new address[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    items = new address[](length);

    for (uint256 i = 0; i < length; i += 1) {
      items[i] = array(offset + i);
    }
  }

  /// Paginates the UserPredictionActivities of a given context
  /// @param array Storage array of the hashes of the activities
  /// @param total Total length of the array
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of items to return
  /// @return items Slice of UserPredictionActivities from the array
  function _paginateUserPredictionActivitiesArray(
    function (uint256) external view returns (bytes32) array,
    uint256 total,
    uint256 offset,
    uint256 limit
  ) internal view returns (UserPredictionActivity[] memory items) {
    if (offset >= total) return new UserPredictionActivity[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    items = new UserPredictionActivity[](length);

    for (uint256 i = 0; i < length; i += 1) {
      (uint256 poolId, uint256 predictionId) = state.userPredictionActivities(array(offset + i));
      items[i] = UserPredictionActivity(poolId, predictionId);
    }
  }

  /// Paginates the UserPredictionActivities of a user based on a given context
  /// @param array Storage array of the hashes of the activities
  /// @param user Address of the involved user
  /// @param total Total length of the array
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of items to return
  /// @return items Slice of addresses from the array
  function _paginateUserPredictionActivitiesArrayForAddress(
    function (address, uint256) external view returns (bytes32) array,
    address user,
    uint256 total,
    uint256 offset,
    uint256 limit
  ) internal view returns (UserPredictionActivity[] memory items) {
    if (user == address(0)) revert InvalidAddress();
    if (offset >= total) return new UserPredictionActivity[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    items = new UserPredictionActivity[](length);

    for (uint256 i = 0; i < length; i += 1) {
      (uint256 poolId, uint256 predictionId) = state.userPredictionActivities(array(user, offset + i));
      items[i] = UserPredictionActivity(poolId, predictionId);
    }
  }

  /// Paginates through uint256 arrays to handle large datasets
  /// @param array Storage array to paginate
  /// @param total Total length of the array
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of items to return
  /// @return items Slice of uint256 values from the array
  function _paginateUint256ArrayForUserInPool(
    function (uint256, address, uint256) external view returns (uint256) array,
    uint256 poolId,
    address user,
    uint256 total,
    uint256 offset,
    uint256 limit
  ) internal view returns (uint256[] memory items) {
    if (poolId == 0 || poolId > allStats().noOfPools) revert InvalidPoolId();
    if (user == address(0)) revert InvalidAddress();
    if (offset >= total) return new uint256[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    items = new uint256[](length);

    for (uint256 i = 0; i < length; i += 1) {
      items[i] = array(poolId, user, offset + i);
    }
  }

  /// Paginates through address arrays to handle large datasets per user
  /// @param array Storage array to paginate
  /// @param user The user whose arrays are being paginated
  /// @param total Total length of the array
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of items to return
  /// @return items Slice of addresses from the array
  function _paginateAddressArrayForUser(
    function (address, uint256) external view returns (address) array,
    address user,
    uint256 total,
    uint256 offset,
    uint256 limit
  ) internal view returns (address[] memory items) {
    if (user == address(0)) revert InvalidAddress();
    if (offset >= total) return new address[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    items = new address[](length);

    for (uint256 i = 0; i < length; i += 1) {
      items[i] = array(user, offset + i);
    }
  }

  /// Returns paginated list of users who have interacted with the contract
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of users to return
  /// @return usersList Array of user addresses
  function usersPaginated(uint256 offset, uint256 limit) external view returns (address[] memory usersList) {
    usersList = _paginateAddressArray(state.users, allStats().noOfUsers, offset, limit);
  }

  /// Returns paginated list of tokens used for predictions
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of tokens to return
  /// @return tokensList Array of token addresses used in predictions
  function predictionTokensPaginated(uint256 offset, uint256 limit) external view returns (address[] memory tokensList) {
    tokensList = _paginateAddressArray(state.predictionTokens, allStats().noOfPredictionTokens, offset, limit);
  }

  /// Returns paginated list of tokens used for staking
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of tokens to return
  /// @return tokensList Array of token addresses used for staking
  function stakeTokensPaginated(uint256 offset, uint256 limit) external view returns (address[] memory tokensList) {
    tokensList = _paginateAddressArray(state.stakeTokens, allStats().noOfStakeTokens, offset, limit);
  }

  /// Retrieves user prediction activity details by hash
  /// @param activityHash Hash of the activity to retrieve
  /// @return activity User prediction activity data
  function userPredictionActivity(bytes32 activityHash) external view returns (UserPredictionActivity memory activity) {
    (uint256 poolId, uint256 predictionId) = state.userPredictionActivities(activityHash);
    if (poolId == 0) revert InvalidActivityHash();
    activity = UserPredictionActivity(poolId, predictionId);
  }

  /// Returns paginated list of all prediction activities across the system
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of activities to return
  /// @return activities Array of prediction activities
  function allPredictionActivitiesPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (UserPredictionActivity[] memory activities)
  {
    activities = _paginateUserPredictionActivitiesArray(
      state.userPredictionActivityHashes, allStats().noOfPredictions, offset, limit
    );
  }

  /// Returns paginated list of winning prediction activities
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of activities to return
  /// @return activities Array of winner activities
  function winnerActivitiesPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (UserPredictionActivity[] memory activities)
  {
    activities =
      _paginateUserPredictionActivitiesArray(state.winnerActivityHashes, allStats().noOfWinnings, offset, limit);
  }

  /// Returns paginated list of claimed winning prediction activities
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of activities to return
  /// @return activities Array of claimed winner activities
  function claimedActivitiesPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (UserPredictionActivity[] memory activities)
  {
    activities = _paginateUserPredictionActivitiesArray(
      state.claimedWinnerActivityHashes, allStats().noOfClaimedWinnings, offset, limit
    );
  }

  /// Returns comprehensive statistics for a specific user
  /// @param user Address of the user to get statistics for
  /// @return stats User's prediction and pool statistics
  function userStats(address user) public view returns (UserPredictionStats memory stats) {
    if (user == address(0)) revert InvalidAddress();
    (uint256 a, uint256 b, uint256 c, uint256 d, uint256 e, uint256 f, uint256 g, uint256 h) = state.userStats(user);
    stats = UserPredictionStats(a, b, c, d, e, f, g, h);
  }

  /// Returns paginated list of pool IDs that a user has joined
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of pool IDs to return
  /// @return poolIds Array of pool IDs the user has participated in
  function joinedPoolIdsForUserPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory poolIds)
  {
    if (user == address(0)) revert InvalidAddress();

    uint256 total = userStats(user).noOfJoinedPools;
    if (offset >= total) return new uint256[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    poolIds = new uint256[](length);

    for (uint256 i = 0; i < length; i += 1) {
      poolIds[i] = state.joinedPoolIdsByAddresses(user, offset + i);
    }
  }

  /// Returns paginated list of prediction activities for a specific user
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of hashes to return
  /// @return activities Array of the user's prediction activity
  function userPredictionActivitiesPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (UserPredictionActivity[] memory activities)
  {
    activities = _paginateUserPredictionActivitiesArrayForAddress(
      state.userPredictionActivityHashesByAddresses, user, userStats(user).noOfPredictions, offset, limit
    );
  }

  /// Returns paginated list of winning activity hashes for a specific user
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of hashes to return
  /// @return activities Array of the user's winning activity hashes
  function userWinnerActivitiesPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (UserPredictionActivity[] memory activities)
  {
    activities = _paginateUserPredictionActivitiesArrayForAddress(
      state.winnerActivityHashesByAddresses, user, userStats(user).noOfWinnings, offset, limit
    );
  }

  /// Returns paginated list of claimable winning activity hashes for a specific user
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of hashes to return
  /// @return activities Array of the user's claimable winning activity hashes
  function userClaimableActivitiesPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (UserPredictionActivity[] memory activities)
  {
    activities = _paginateUserPredictionActivitiesArrayForAddress(
      state.claimableActivityHashesByAddresses, user, userStats(user).noOfClaimableWinnings, offset, limit
    );
  }

  /// Retrieves pool data by ID
  /// @param poolId ID of the pool to retrieve
  /// @return pool_ Complete pool data structure
  function pool(uint256 poolId) public view returns (Pool memory pool_) {
    if (poolId == 0 || poolId > allStats().noOfPools) revert InvalidPoolId();
    (
      uint256 a,
      PoolSeeds memory b,
      bytes32 c,
      uint256 d,
      uint256 e,
      uint256 f,
      uint256 g,
      uint256 h,
      uint256 i,
      uint256 j
    ) = state.pools(poolId);
    pool_ = Pool(a, b, c, d, e, f, g, h, i, j);
  }

  /// Retrieves prediction data by pool and prediction ID
  /// @param poolId ID of the pool containing the prediction
  /// @param predictionId ID of the specific prediction
  /// @return prediction_ Complete prediction data structure
  function prediction(uint256 poolId, uint256 predictionId) external view returns (Prediction memory prediction_) {
    if (poolId == 0 || poolId > allStats().noOfPools) revert InvalidPoolId();
    Pool memory pool_ = pool(poolId);
    if (predictionId == 0 || predictionId > pool_.noOfPredictions) {
      revert InvalidPredictionId();
    }
    (address a, uint256 b, uint256 c, uint256 d, uint256 e, uint256 f, bool g) = state.predictions(poolId, predictionId);
    prediction_ = Prediction(a, b, c, d, e, f, g);
  }

  /// Retrieves multiple pools by their IDs
  /// @param poolIds Array of pool IDs to fetch
  /// @return poolsList Array of Pool structs corresponding to the IDs
  function pools(uint256[] calldata poolIds) external view returns (Pool[] memory poolsList) {
    poolsList = new Pool[](poolIds.length);
    for (uint256 i = 0; i < poolIds.length; i += 1) {
      if (poolIds[i] == 0 || poolIds[i] > allStats().noOfPools) revert InvalidPoolId();
      (
        uint256 a,
        PoolSeeds memory b,
        bytes32 c,
        uint256 d,
        uint256 e,
        uint256 f,
        uint256 g,
        uint256 h,
        uint256 j,
        uint256 k
      ) = state.pools(poolIds[i]);
      poolsList[i] = Pool(a, b, c, d, e, f, g, h, j, k);
    }
  }

  /// Retrieves multiple predictions from a specific pool
  /// @param poolId ID of the pool to fetch predictions from
  /// @param predictionIds Array of prediction IDs to fetch
  /// @return predictionsList Array of Prediction structs
  function predictions(uint256 poolId, uint256[] calldata predictionIds)
    external
    view
    returns (Prediction[] memory predictionsList)
  {
    if (poolId == 0 || poolId > allStats().noOfPools) revert InvalidPoolId();
    Pool memory pool_ = pool(poolId);
    predictionsList = new Prediction[](predictionIds.length);
    for (uint256 i = 0; i < predictionIds.length; i += 1) {
      if (predictionIds[i] == 0 || predictionIds[i] > pool_.noOfPredictions) revert InvalidPredictionId();
      (address a, uint256 b, uint256 c, uint256 d, uint256 e, uint256 f, bool g) =
        state.predictions(poolId, predictionIds[i]);
      predictionsList[i] = Prediction(a, b, c, d, e, f, g);
    }
  }

  /// Returns user statistics within a specific pool
  /// @param poolId ID of the pool
  /// @param user Address of the user
  /// @return stats User's statistics for the specified pool
  function userInPoolPredictionStats(uint256 poolId, address user)
    public
    view
    returns (UserInPoolPredictionStats memory stats)
  {
    if (poolId == 0 || poolId > allStats().noOfPools) revert InvalidPoolId();
    if (user == address(0)) revert InvalidAddress();
    (uint256 a, uint256 b, uint256 c, uint256 d) = state.userInPoolPredictionStats(poolId, user);
    stats = UserInPoolPredictionStats(a, b, c, d);
  }

  /// Returns paginated list of prediction IDs made by a user in a specific pool
  /// @param poolId ID of the pool to fetch predictions from
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of prediction IDs to return
  /// @return predictionIds Array of prediction IDs made by the user
  function userInPoolPredictionIdsPaginated(uint256 poolId, address user, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory predictionIds)
  {
    predictionIds = _paginateUint256ArrayForUserInPool(
      state.predictionIdsByAddressesPerPool,
      poolId,
      user,
      userInPoolPredictionStats(poolId, user).noOfPredictions,
      offset,
      limit
    );
  }

  // /// Returns paginated list of winning prediction IDs for a user in a specific pool
  // /// @param poolId ID of the pool to fetch from
  // /// @param user Address of the user
  // /// @param offset Starting index for pagination
  // /// @param limit Maximum number of prediction IDs to return
  // /// @return predictionIds Array of winning prediction IDs
  function userInPoolWinnerPredictionIdsPaginated(uint256 poolId, address user, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory predictionIds)
  {
    predictionIds = _paginateUint256ArrayForUserInPool(
      state.winnerPredictionIdsByAddressesPerPool,
      poolId,
      user,
      userInPoolPredictionStats(poolId, user).noOfWinnings,
      offset,
      limit
    );
  }

  /// Returns paginated list of claimable winning prediction IDs for a user in a specific pool
  /// @param poolId ID of the pool to fetch from
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of prediction IDs to return
  /// @return predictionIds Array of claimable winning prediction IDs
  function userInPoolClaimablePredictionIdsPaginated(uint256 poolId, address user, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory predictionIds)
  {
    predictionIds = _paginateUint256ArrayForUserInPool(
      state.claimableWinnerPredictionIdsByAddressesPerPool,
      poolId,
      user,
      userInPoolPredictionStats(poolId, user).noOfClaimableWinnings,
      offset,
      limit
    );
  }

  /// Returns global statistics for a prediction token
  /// @param token Address of the prediction token
  /// @return details Token usage statistics across all pools
  function predictionTokenDetails(address token) external view returns (PredictionTokenDetails memory details) {
    if (token == address(0)) revert InvalidAddress();
    (uint256 a, uint256 b) = state.predictionTokenDetails(token);
    details = PredictionTokenDetails(a, b);
  }

  /// Returns global statistics for a stake token
  /// @param token Address of the stake token
  /// @return details Token usage statistics across all pools and predictions
  function stakeTokenDetails(address token) external view returns (StakeTokenDetails memory details) {
    if (token == address(0)) revert InvalidAddress();
    (uint256 a, uint256 b, uint256 c, uint256 d, uint256 e, uint256 f, uint256 g, uint256 h, uint256 i) =
      state.stakeTokenDetails(token);
    details = StakeTokenDetails(a, b, c, d, e, f, g, h, i);
  }

  /// Returns paginated list of prediction tokens used by a specific user
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of tokens to return
  /// @return tokensList Array of prediction token addresses used by the user
  function userPredictionTokensPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory tokensList)
  {
    tokensList = _paginateAddressArrayForUser(
      state.userPredictionTokens, user, userStats(user).noOfPredictionTokens, offset, limit
    );
  }

  /// Returns user-specific statistics for a prediction token
  /// @param user Address of the user
  /// @param token Address of the prediction token
  /// @return details User's usage statistics for the specific token
  function userPredictionTokenDetails(address user, address token)
    external
    view
    returns (PredictionTokenDetails memory details)
  {
    if (user == address(0) || token == address(0)) revert InvalidAddress();
    (uint256 a, uint256 b) = state.userPredictionTokenDetails(user, token);
    details = PredictionTokenDetails(a, b);
  }

  /// Returns paginated list of stake tokens used by a specific user
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of tokens to return
  /// @return tokensList Array of stake token addresses used by the user
  function userStakeTokensPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory tokensList)
  {
    tokensList =
      _paginateAddressArrayForUser(state.userStakeTokens, user, userStats(user).noOfStakeTokens, offset, limit);
  }

  /// Returns user-specific statistics for a stake token
  /// @param user Address of the user
  /// @param token Address of the stake token
  /// @return details User's usage statistics for the specific token
  function userStakeTokenDetails(address user, address token)
    external
    view
    returns (StakeTokenDetails memory details)
  {
    if (user == address(0) || token == address(0)) revert InvalidAddress();
    (uint256 a, uint256 b, uint256 c, uint256 d, uint256 e, uint256 f, uint256 g, uint256 h, uint256 i) =
      state.userStakeTokenDetails(user, token);
    details = StakeTokenDetails(a, b, c, d, e, f, g, h, i);
  }
}
