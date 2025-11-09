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

  /// Paginates the PredictionRecords of a given context
  /// @param array Storage array of the record hashes
  /// @param total Total length of the array
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of items to return
  /// @return items Slice of PredictionRecords from the array
  function _paginatePredictionRecordsArray(
    function (uint256) external view returns (bytes32) array,
    uint256 total,
    uint256 offset,
    uint256 limit
  ) internal view returns (PredictionRecord[] memory items) {
    if (offset >= total) return new PredictionRecord[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    items = new PredictionRecord[](length);

    for (uint256 i = 0; i < length; i += 1) {
      (uint256 poolId, uint256 predictionId) = state.predictionRecords(array(offset + i));
      items[i] = PredictionRecord(poolId, predictionId);
    }
  }

  /// Paginates the PredictionRecords of a user based on a given context
  /// @param array Storage array of the record hashes
  /// @param user Address of the involved user
  /// @param total Total length of the array
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of items to return
  /// @return items Slice of addresses from the array
  function _paginateUserPredictionRecordsArray(
    function (address, uint256) external view returns (bytes32) array,
    address user,
    uint256 total,
    uint256 offset,
    uint256 limit
  ) internal view returns (PredictionRecord[] memory items) {
    if (offset >= total) return new PredictionRecord[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    items = new PredictionRecord[](length);

    for (uint256 i = 0; i < length; i += 1) {
      (uint256 poolId, uint256 predictionId) = state.predictionRecords(array(user, offset + i));
      items[i] = PredictionRecord(poolId, predictionId);
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

  /// Retrieves user prediction record details by hash
  /// @param recordHash Hash of the record to retrieve
  /// @return record User prediction record data
  function predictionRecord(bytes32 recordHash) external view returns (PredictionRecord memory record) {
    (uint256 poolId, uint256 predictionId) = state.predictionRecords(recordHash);
    if (poolId == 0) revert InvalidRecordHash();
    record = PredictionRecord(poolId, predictionId);
  }

  /// Returns paginated list of all prediction records across the system
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of records to return
  /// @return records Array of prediction records
  function predictionRecordsPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (PredictionRecord[] memory records)
  {
    records = _paginatePredictionRecordsArray(state.predictionRecordHashes, allStats().noOfPredictions, offset, limit);
  }

  /// Returns paginated list of winning prediction records
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of records to return
  /// @return records Array of winner records
  function winnerRecordsPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (PredictionRecord[] memory records)
  {
    records = _paginatePredictionRecordsArray(state.winnerRecordHashes, allStats().noOfWinnings, offset, limit);
  }

  /// Returns paginated list of claimed winning prediction records
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of records to return
  /// @return records Array of claimed winner records
  function claimedRecordsPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (PredictionRecord[] memory records)
  {
    records = _paginatePredictionRecordsArray(state.claimedRecordHashes, allStats().noOfClaimedWinnings, offset, limit);
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
  function userJoinedPoolIdsPaginated(address user, uint256 offset, uint256 limit)
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

  /// Returns paginated list of prediction records for a specific user
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of records to return
  /// @return records Array of the user's prediction record
  function userPredictionRecordsPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (PredictionRecord[] memory records)
  {
    if (user == address(0)) revert InvalidAddress();
    records = _paginateUserPredictionRecordsArray(
      state.userPredictionRecords, user, userStats(user).noOfPredictions, offset, limit
    );
  }

  /// Returns paginated list of winning record for a specific user
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of records to return
  /// @return records Array of the user's winning records
  function userWinnerRecordsPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (PredictionRecord[] memory records)
  {
    if (user == address(0)) revert InvalidAddress();
    records = _paginateUserPredictionRecordsArray(
      state.winnerRecordHashesByAddresses, user, userStats(user).noOfWinnings, offset, limit
    );
  }

  /// Returns paginated list of claimable records for a specific user
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of records to return
  /// @return records Array of the user's claimable records
  function userClaimableRecordsPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (PredictionRecord[] memory records)
  {
    if (user == address(0)) revert InvalidAddress();
    records = _paginateUserPredictionRecordsArray(
      state.claimableRecordHashesByAddresses, user, userStats(user).noOfClaimableWinnings, offset, limit
    );
  }

  /// Retrieves pool data by ID
  /// @param poolId ID of the pool to retrieve
  /// @return pool Complete pool data structure
  function pool(uint256 poolId) public view returns (Pool memory) {
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
    return Pool(a, b, c, d, e, f, g, h, i, j);
  }

  /// Retrieves prediction data by pool and prediction ID
  /// @param poolId ID of the pool containing the prediction
  /// @param predictionId ID of the specific prediction
  /// @return prediction Complete prediction data structure
  function prediction(uint256 poolId, uint256 predictionId) external view returns (Prediction memory) {
    if (poolId == 0 || poolId > allStats().noOfPools) revert InvalidPoolId();
    Pool memory pool_ = pool(poolId);
    if (predictionId == 0 || predictionId > pool_.noOfPredictions) {
      revert InvalidPredictionId();
    }
    (address a, uint256 b, uint256 c, uint256 d, uint256 e, uint256 f, bool g) = state.predictions(poolId, predictionId);
    return Prediction(a, b, c, d, e, f, g);
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
    if (poolId == 0 || poolId > allStats().noOfPools) revert InvalidPoolId();
    if (user == address(0)) revert InvalidAddress();
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
    if (poolId == 0 || poolId > allStats().noOfPools) revert InvalidPoolId();
    if (user == address(0)) revert InvalidAddress();
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
    if (poolId == 0 || poolId > allStats().noOfPools) revert InvalidPoolId();
    if (user == address(0)) revert InvalidAddress();
    predictionIds = _paginateUint256ArrayForUserInPool(
      state.claimablePredictionIdsByAddressesPerPool,
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
    if (user == address(0)) revert InvalidAddress();
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
    if (user == address(0)) revert InvalidAddress();
    tokensList =
      _paginateAddressArrayForUser(state.userStakeTokens, user, userStats(user).noOfStakeTokens, offset, limit);
  }

  /// Returns user-specific statistics for a stake token
  /// @param user Address of the user
  /// @param token Address of the stake token
  /// @return details User's usage statistics for the specific token
  function userStakeTokenDetails(address user, address token) external view returns (StakeTokenDetails memory details) {
    if (user == address(0) || token == address(0)) revert InvalidAddress();
    (uint256 a, uint256 b, uint256 c, uint256 d, uint256 e, uint256 f, uint256 g, uint256 h, uint256 i) =
      state.userStakeTokenDetails(user, token);
    details = StakeTokenDetails(a, b, c, d, e, f, g, h, i);
  }
}
