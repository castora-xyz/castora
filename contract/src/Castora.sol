// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {AccessControlUpgradeable} from '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {Initializable} from '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import {PausableUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import {UUPSUpgradeable} from '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import {CastoraErrors} from './CastoraErrors.sol';
import {CastoraEvents} from './CastoraEvents.sol';
import {CastoraPoolsManager} from './CastoraPoolsManager.sol';
import {CastoraPoolsRules} from './CastoraPoolsRules.sol';
import {CastoraStructs} from './CastoraStructs.sol';

/// @title Rewards participants' accuracy in predicting prices of tokens.
/// @notice Participants predict what the price of a predictionToken will be at
/// a future snapshotTime. When predicting, they have to stake some funds.
/// After snapshotTime, those whose predictedPrices are closest to the token's
/// price are the winners of the {Pool}. They go with all the pool's money or
/// rather they each go with almost twice of what they initially staked.
/// @custom:oz-upgrades-from build-info-ref:Castora
contract Castora is
  CastoraErrors,
  CastoraEvents,
  CastoraStructs,
  Initializable,
  OwnableUpgradeable,
  AccessControlUpgradeable,
  ReentrancyGuardUpgradeable,
  PausableUpgradeable,
  UUPSUpgradeable
{
  using SafeERC20 for IERC20;

  /// Address for CastoraPoolsManager contract
  address public poolsManager;
  /// Address for CastoraPoolsRules contract
  address public poolsRules;
  /// Specifies the role that allow perculiar addresses to call admin functions.
  bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
  /// Global statistics for all pools and users
  AllPredictionStats public allStats;
  /// Array of users who have created pools
  address[] public users;
  /// Array of tokens ever used for predictions overall
  address[] public predictionTokens;
  /// Array of tokens ever used for staking overall
  address[] public stakeTokens;
  /// Array of userPredictionActivities stored globally
  bytes32[] public userPredictionActivityHashes;
  /// Keeps track of user addresses to their activity info
  mapping(address => UserPredictionStats stats) public userStats;
  /// Keeps track of user addresses to the number of unique pools they have joined
  mapping(address => uint256[]) public joinedPoolIdsByAddresses;
  /// Keeps track of user addresses to the activities of their predictions
  mapping(address => bytes32[]) public userPredictionActivityHashesByAddresses;
  /// Keeps track of all winner predictions of the user across pools
  mapping(address => bytes32[]) public winnerActivityHashesByAddresses;
  /// Keeps track of all claimable predictions that the user can claim winnings
  mapping(address => bytes32[]) public claimableActivityHashesByAddresses;
  /// All UserPredictionActivities against the hash of the activities.
  /// Helps in retrieving an activity from either the general context or
  /// when querying a user's chronological actions or getting their claimables.
  mapping(bytes32 => UserPredictionActivity) public userPredictionActivities;
  /// All poolIds against the hash of their seeds. Helps when there is a
  /// need to fetch a poolId.
  mapping(bytes32 => uint256) public poolIdsBySeedsHashes;
  /// All pools that were ever created against their poolIds.
  mapping(uint256 => Pool) public pools;
  /// Keeps track of predictions in pools by their predictionIds.
  mapping(uint256 => mapping(uint256 => Prediction)) public predictions;
  /// Keeps track of a user's activity in a given pool.
  mapping(uint256 => mapping(address => UserInPoolPredictionStats)) public userInPoolPredictionStats;
  /// Keeps track of predictions in pools by the predicter's address.
  /// Helps in fetching predictions made by participants.
  mapping(uint256 => mapping(address => uint256[])) public predictionIdsByAddressesPerPool;
  /// Keeps track of all winner predictions of a user in a pool
  mapping(uint256 => mapping(address => uint256[])) public winnerPredictionIdsByAddressesPerPool;
  /// Keeps track of all claimable predictions that the user can claim for a given pool.
  mapping(uint256 => mapping(address => uint256[])) public claimableWinnerPredictionIdsByAddressesPerPool;
  /// Keeps track of totals and info of tokens used for predictions overall
  mapping(address => PredictionTokenDetails) public predictionTokenDetails;
  /// Keeps track of totals and info of tokens used for staking overall
  mapping(address => StakeTokenDetails) public stakeTokenDetails;
  /// Keeps track of tokens that a user has ever used in joinig pools
  mapping(address => address[]) public userPredictionTokens;
  /// Keeps track of info about prediction tokens a user has ever used in joining pools
  mapping(address => mapping(address => PredictionTokenDetails)) public userPredictionTokenDetails;
  /// Keeps track of tokens that a user has ever paid to join pools
  mapping(address => address[]) public userStakeTokens;
  /// Keeps track of info about stake tokens a user has ever used to join pools
  mapping(address => mapping(address => StakeTokenDetails)) public userStakeTokenDetails;
  /// Maps each activityHash for the user's claimable to the right index
  mapping(address => mapping(bytes32 => uint256)) public claimableActivityHashesIndex;
  /// Maps each predictionId for the user's claimable to the right index in each pool
  mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public claimablePredictionIdsInPoolIndex;
  /// Tracks if a pool's completion has been initiated
  mapping(uint256 => bool) public hasPoolCompletionBeenInitiated;
  /// Tracks the total batch sizes for processing pool completion
  mapping(uint256 => uint256) public poolCompletionBatchSize;
  /// Tracks how many batches have been processed for each pool
  mapping(uint256 => uint256) public poolCompletionBatchesProcessed;

  function getAllStats() external view returns (AllPredictionStats memory stats) {
    stats = allStats;
  }

  /// Internal helper to paginate address arrays
  /// @param array The array to paginate
  /// @param total The length of the array to paginate
  /// @param offset Starting index
  /// @param limit Maximum items to return
  /// @return items The paginated items
  function _paginateAddressArray(address[] storage array, uint256 total, uint256 offset, uint256 limit)
    internal
    view
    returns (address[] memory items)
  {
    if (offset >= total) return new address[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    items = new address[](length);

    for (uint256 i = 0; i < length; i += 1) {
      items[i] = array[offset + i];
    }
  }

  /// Internal helper to paginate uint256 arrays
  /// @param array The array to paginate
  /// @param total The length of the array to paginate
  /// @param offset Starting index
  /// @param limit Maximum items to return
  /// @return items The paginated items
  function _paginateUint256Array(uint256[] storage array, uint256 total, uint256 offset, uint256 limit)
    internal
    view
    returns (uint256[] memory items)
  {
    if (offset >= total) return new uint256[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    items = new uint256[](length);

    for (uint256 i = 0; i < length; i += 1) {
      items[i] = array[offset + i];
    }
  }

  function getUsersPaginated(uint256 offset, uint256 limit) external view returns (address[] memory usersList) {
    usersList = _paginateAddressArray(users, allStats.noOfUsers, offset, limit);
  }

  function getPredictionTokensPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory tokensList)
  {
    tokensList = _paginateAddressArray(predictionTokens, allStats.noOfPredictionTokens, offset, limit);
  }

  function getStakeTokensPaginated(uint256 offset, uint256 limit) external view returns (address[] memory tokensList) {
    tokensList = _paginateAddressArray(stakeTokens, allStats.noOfStakeTokens, offset, limit);
  }

  function getAllPredictionActivitiesPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (UserPredictionActivity[] memory activities)
  {
    uint256 total = allStats.noOfPredictions;
    if (offset >= total) return new UserPredictionActivity[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    activities = new UserPredictionActivity[](length);

    for (uint256 i = 0; i < length; i += 1) {
      activities[i] = userPredictionActivities[userPredictionActivityHashes[offset + i]];
    }
  }

  function getUserStats(address user) external view returns (UserPredictionStats memory stats) {
    if (user == address(0)) revert InvalidAddress();
    stats = userStats[user];
  }

  function getJoinedPoolIdsForUserPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory poolIds)
  {
    if (user == address(0)) revert InvalidAddress();
    poolIds = _paginateUint256Array(joinedPoolIdsByAddresses[user], userStats[user].noOfJoinedPools, offset, limit);
  }

  function getUserPredictionActivitiesPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (UserPredictionActivity[] memory activities)
  {
    if (user == address(0)) revert InvalidAddress();

    uint256 total = userStats[user].noOfPredictions;
    if (offset >= total) return new UserPredictionActivity[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    activities = new UserPredictionActivity[](length);

    for (uint256 i = 0; i < length; i += 1) {
      activities[i] = userPredictionActivities[userPredictionActivityHashesByAddresses[user][offset + i]];
    }
  }

  function getClaimableActivitiesForAddressPaginated(address predicter, uint256 offset, uint256 limit)
    external
    view
    returns (UserPredictionActivity[] memory activities)
  {
    if (predicter == address(0)) revert InvalidAddress();

    uint256 total = userStats[predicter].noOfClaimableWinnings;
    if (offset >= total) return new UserPredictionActivity[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    activities = new UserPredictionActivity[](length);

    for (uint256 i = 0; i < length; i += 1) {
      activities[i] = userPredictionActivities[claimableActivityHashesByAddresses[predicter][offset + i]];
    }
  }

  function getUserPredictionActivity(bytes32 activityHash)
    external
    view
    returns (UserPredictionActivity memory activity)
  {
    activity = userPredictionActivities[activityHash];
  }

  /// Returns the {Pool} with the provided `poolId`. Fails if the provided
  /// `poolId` is invalid.
  function getPool(uint256 poolId) external view returns (Pool memory pool) {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    pool = pools[poolId];
  }

  /// Returns the {Prediction} with the corresponding `predictionId` that was
  /// made in the {Pool} with the provided `poolId`.
  ///
  /// Fails if either the provided `poolId` or `predictionId` are invalid.
  function getPrediction(uint256 poolId, uint256 predictionId) external view returns (Prediction memory prediction) {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    Pool storage pool = pools[poolId];
    if (predictionId == 0 || predictionId > pool.noOfPredictions) {
      revert InvalidPredictionId();
    }
    prediction = predictions[poolId][predictionId];
  }

  /// Returns the pools corresponding to the provided list of poolIds.
  /// @param poolIds The array of poolIds to fetch
  /// @return poolsList The array of Pool structs
  function getPools(uint256[] calldata poolIds) external view returns (Pool[] memory poolsList) {
    poolsList = new Pool[](poolIds.length);
    for (uint256 i = 0; i < poolIds.length; i += 1) {
      if (poolIds[i] == 0 || poolIds[i] > allStats.noOfPools) revert InvalidPoolId();
      poolsList[i] = pools[poolIds[i]];
    }
  }

  /// Returns the predictions corresponding to the provided list of predictionIds in a pool.
  /// @param poolId The pool to fetch predictions from
  /// @param predictionIds The array of predictionIds to fetch
  /// @return predictionsList The array of Prediction structs
  function getPredictions(uint256 poolId, uint256[] calldata predictionIds)
    external
    view
    returns (Prediction[] memory predictionsList)
  {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    Pool storage pool = pools[poolId];
    predictionsList = new Prediction[](predictionIds.length);
    for (uint256 i = 0; i < predictionIds.length; i += 1) {
      if (predictionIds[i] == 0 || predictionIds[i] > pool.noOfPredictions) revert InvalidPredictionId();
      predictionsList[i] = predictions[poolId][predictionIds[i]];
    }
  }

  function getUserInPoolPredictionStats(uint256 poolId, address user)
    external
    view
    returns (UserInPoolPredictionStats memory stats)
  {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    if (user == address(0)) revert InvalidAddress();
    stats = userInPoolPredictionStats[poolId][user];
  }

  /// Returns a paginated list of prediction IDs made by a user in a pool.
  /// @param poolId The pool to fetch predictions from
  /// @param user The address of the user
  /// @param offset The starting index (0-based) in the user's predictions array
  /// @param limit The maximum number of predictions to return
  /// @return predictionIds The array of Prediction structs
  function getPredictionIdsInPoolForUserPaginated(uint256 poolId, address user, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory predictionIds)
  {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    if (user == address(0)) revert InvalidAddress();
    predictionIds = _paginateUint256Array(
      predictionIdsByAddressesPerPool[poolId][user],
      userInPoolPredictionStats[poolId][user].noOfPredictions,
      offset,
      limit
    );
  }

  function getWinnerPredictionIdsInPoolForUserPaginated(uint256 poolId, address user, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory predictionIds)
  {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    if (user == address(0)) revert InvalidAddress();
    predictionIds = _paginateUint256Array(
      winnerPredictionIdsByAddressesPerPool[poolId][user],
      userInPoolPredictionStats[poolId][user].noOfWinnings,
      offset,
      limit
    );
  }

  function getClaimableWinnerPredictionIdsInPoolForUserPaginated(
    uint256 poolId,
    address user,
    uint256 offset,
    uint256 limit
  ) external view returns (uint256[] memory predictionIds) {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    if (user == address(0)) revert InvalidAddress();
    predictionIds = _paginateUint256Array(
      claimableWinnerPredictionIdsByAddressesPerPool[poolId][user],
      userInPoolPredictionStats[poolId][user].noOfClaimableWinnings,
      offset,
      limit
    );
  }

  function getPredictionTokenDetails(address token) external view returns (PredictionTokenDetails memory details) {
    if (token == address(0)) revert InvalidAddress();
    details = predictionTokenDetails[token];
  }

  function getStakeTokenDetails(address token) external view returns (StakeTokenDetails memory details) {
    if (token == address(0)) revert InvalidAddress();
    details = stakeTokenDetails[token];
  }

  function getUserPredictionTokensPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory tokensList)
  {
    if (user == address(0)) revert InvalidAddress();
    tokensList = _paginateAddressArray(userPredictionTokens[user], userStats[user].noOfPredictionTokens, offset, limit);
  }

  function getUserPredictionTokenDetails(address user, address token)
    external
    view
    returns (PredictionTokenDetails memory details)
  {
    if (user == address(0) || token == address(0)) revert InvalidAddress();
    details = userPredictionTokenDetails[user][token];
  }

  function getUserStakeTokensPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory tokensList)
  {
    if (user == address(0)) revert InvalidAddress();
    tokensList = _paginateAddressArray(userStakeTokens[user], userStats[user].noOfStakeTokens, offset, limit);
  }

  function getUserStakeTokenDetails(address user, address token)
    external
    view
    returns (StakeTokenDetails memory details)
  {
    if (user == address(0) || token == address(0)) revert InvalidAddress();
    details = userStakeTokenDetails[user][token];
  }

  /// Returns a hash of the provided `seeds`.
  function hashPoolSeeds(PoolSeeds memory seeds) public pure returns (bytes32) {
    return keccak256(
      abi.encodePacked(
        seeds.predictionToken,
        seeds.stakeToken,
        seeds.stakeAmount,
        seeds.windowCloseTime,
        seeds.snapshotTime,
        seeds.multiplier
      )
    );
  }

  /// Returns a hash of the provided `activity`.
  function hashUserPredictionActivity(UserPredictionActivity memory activity) public pure returns (bytes32) {
    return keccak256(abi.encodePacked('poolId', activity.poolId, 'predictionId', activity.predictionId));
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(address poolsManager_, address poolsRules_) public initializer {
    if (poolsManager_ == address(0)) revert InvalidAddress();
    if (poolsRules_ == address(0)) revert InvalidAddress();

    poolsManager = poolsManager_;
    poolsRules = poolsRules_;

    __Ownable_init(msg.sender);
    __AccessControl_init();
    __ReentrancyGuard_init();
    __Pausable_init();
    __UUPSUpgradeable_init();

    _grantRole(DEFAULT_ADMIN_ROLE, owner());
    _grantRole(ADMIN_ROLE, owner());
  }

  function _authorizeUpgrade(address newImpl) internal override onlyOwner {}

  function pause() external onlyOwner nonReentrant whenNotPaused {
    _pause();
  }

  function unpause() external onlyOwner nonReentrant whenPaused {
    _unpause();
  }

  /// Sets the CastoraPoolsManager contract address
  /// @param _poolsManager The new CastoraPoolsManager contract address
  function setPoolsManager(address _poolsManager) external onlyOwner {
    if (_poolsManager == address(0)) revert InvalidAddress();
    address oldPoolsManager = poolsManager;
    poolsManager = _poolsManager;
    emit SetPoolsManagerInCastora(oldPoolsManager, _poolsManager);
  }

  /// Sets the CastoraPoolsRules contract address
  /// @param _poolsRules The new CastoraPoolsRules contract address
  function setPoolsRules(address _poolsRules) external onlyOwner {
    if (_poolsRules == address(0)) revert InvalidAddress();
    address oldPoolsRules = poolsRules;
    poolsRules = _poolsRules;
    emit SetPoolsRulesInCastora(oldPoolsRules, _poolsRules);
  }

  /// Grants the {ADMIN_ROLE} to the provided `admin` address.
  function grantAdminRole(address admin) external onlyOwner {
    if (admin == address(0)) revert InvalidAddress();
    _grantRole(ADMIN_ROLE, admin);
  }

  /// Revokes the {ADMIN_ROLE} from the provided `admin` address.
  function revokeAdminRole(address admin) external onlyOwner {
    if (admin == address(0)) revert InvalidAddress();
    _revokeRole(ADMIN_ROLE, admin);
  }

  /// Creates a {Pool} with the provided `seeds`.
  ///
  /// Fails if any of the {PoolSeeds} properties are invalid or if there
  /// is a pool with the same `seeds`.
  ///
  /// Emits a {CreatedPool} event.
  function createPool(PoolSeeds memory seeds)
    external
    nonReentrant
    whenNotPaused
    onlyRole(ADMIN_ROLE)
    returns (uint256)
  {
    bytes32 seedsHash = hashPoolSeeds(seeds);
    if (poolIdsBySeedsHashes[seedsHash] != 0) revert PoolExistsAlready();

    CastoraPoolsRules(poolsRules).validateCreatePool(seeds);

    allStats.noOfPools += 1;
    poolIdsBySeedsHashes[seedsHash] = allStats.noOfPools;
    Pool storage pool = pools[allStats.noOfPools];
    pool.poolId = allStats.noOfPools;
    pool.seeds = seeds;
    pool.seedsHash = seedsHash;
    pool.creationTime = block.timestamp;

    if (predictionTokenDetails[seeds.predictionToken].noOfPools == 0) {
      allStats.noOfPredictionTokens += 1;
      predictionTokens.push(seeds.predictionToken);
    }
    predictionTokenDetails[seeds.predictionToken].noOfPools += 1;

    if (stakeTokenDetails[seeds.stakeToken].noOfPools == 0) {
      allStats.noOfStakeTokens += 1;
      stakeTokens.push(seeds.stakeToken);
    }
    stakeTokenDetails[seeds.stakeToken].noOfPools += 1;

    emit PoolCreated(allStats.noOfPools, seedsHash);
    return allStats.noOfPools;
  }

  function _validateStartPredict(uint256 poolId) internal view returns (Pool storage pool, PoolSeeds memory seeds) {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    pool = pools[poolId];
    seeds = pool.seeds;
    if (block.timestamp > seeds.windowCloseTime) revert WindowHasClosed();
  }

  function _checkNewUserOnPredict(uint256 poolId) internal {
    if (userStats[msg.sender].nthUserCount == 0) {
      allStats.noOfUsers += 1;
      userStats[msg.sender].nthUserCount = allStats.noOfUsers;
      users.push(msg.sender);
      emit NewUserPredicted(msg.sender, poolId, userStats[msg.sender].nthUserCount);
    }
  }

  function _updatePredictStatsGeneral(uint256 poolId, uint256 predictionsCount, PoolSeeds memory seeds) internal {
    if (userInPoolPredictionStats[poolId][msg.sender].noOfPredictions == 0) {
      userStats[msg.sender].noOfJoinedPools += 1;
      joinedPoolIdsByAddresses[msg.sender].push(poolId);
    }
    if (userPredictionTokenDetails[msg.sender][seeds.predictionToken].noOfPredictions == 0) {
      userPredictionTokens[msg.sender].push(seeds.predictionToken);
      userStats[msg.sender].noOfPredictionTokens += 1;
    }
    if (userStakeTokenDetails[msg.sender][seeds.stakeToken].noOfPredictions == 0) {
      userStakeTokens[msg.sender].push(seeds.stakeToken);
      userStats[msg.sender].noOfStakeTokens += 1;
    }

    allStats.noOfPredictions += predictionsCount;
    predictionTokenDetails[seeds.predictionToken].noOfPredictions += predictionsCount;
    stakeTokenDetails[seeds.stakeToken].noOfPredictions += predictionsCount;
    stakeTokenDetails[seeds.stakeToken].totalStaked += seeds.stakeAmount * predictionsCount;
    userStats[msg.sender].noOfPredictions += predictionsCount;
    userPredictionTokenDetails[msg.sender][seeds.predictionToken].noOfPredictions += predictionsCount;
    userStakeTokenDetails[msg.sender][seeds.stakeToken].noOfPredictions += predictionsCount;
    userStakeTokenDetails[msg.sender][seeds.stakeToken].totalStaked += seeds.stakeAmount * predictionsCount;
    userInPoolPredictionStats[poolId][msg.sender].noOfPredictions += predictionsCount;
  }

  function _updatePredictStatsPrediction(uint256 poolId, uint256 predictionId, uint256 predictionPrice) internal {
    predictionIdsByAddressesPerPool[poolId][msg.sender].push(predictionId);

    UserPredictionActivity memory activity = UserPredictionActivity(poolId, predictionId);
    bytes32 activityHash = hashUserPredictionActivity(activity);
    userPredictionActivities[activityHash] = activity;
    userPredictionActivityHashes.push(activityHash);
    userPredictionActivityHashesByAddresses[msg.sender].push(activityHash);

    predictions[poolId][predictionId] =
      Prediction(msg.sender, poolId, predictionId, predictionPrice, block.timestamp, 0, false);
    emit Predicted(poolId, predictionId, msg.sender, predictionPrice);
  }

  /// Makes a prediction with the provided `predictionPrice` in the {Pool}
  /// with the provided `poolId`.
  ///
  /// By calling this function, the predicter
  /// effectively joins the pool. Also, the {PoolSeeds-stakeAmount} of the
  /// {PoolSeeds-stakeToken} of the pool will be deducted from the predicter.
  ///
  /// Emits a {Predicted} event.
  function predict(uint256 poolId, uint256 predictionPrice)
    external
    payable
    nonReentrant
    whenNotPaused
    returns (uint256 predictionId)
  {
    (Pool storage pool, PoolSeeds memory seeds) = _validateStartPredict(poolId);
    _checkNewUserOnPredict(poolId);
    _updatePredictStatsGeneral(poolId, 1, seeds);
    pool.noOfPredictions += 1;
    _updatePredictStatsPrediction(poolId, pool.noOfPredictions, predictionPrice);
    predictionId = pool.noOfPredictions;

    if (seeds.stakeToken == address(this)) {
      if (msg.value < seeds.stakeAmount) revert InsufficientStakeValue();
      if (msg.value > seeds.stakeAmount) revert IncorrectStakeValue();
    } else {
      IERC20(seeds.stakeToken).safeTransferFrom(msg.sender, address(this), seeds.stakeAmount);
    }
  }

  /// Makes multiple predictions with the same `predictionPrice` in the {Pool}
  /// with the provided `poolId`.
  ///
  /// By calling this function, the predicter effectively joins the pool multiple times.
  /// The {PoolSeeds-stakeAmount} of the {PoolSeeds-stakeToken} of the pool will be
  /// deducted from the predicter for each prediction made (predictionsCount times).
  ///
  /// @param poolId The ID of the pool to make predictions in
  /// @param predictionPrice The price prediction to use for all predictions
  /// @param predictionsCount The number of predictions to make (must be > 0)
  /// @return firstPredictionId The ID of the first prediction made
  /// @return lastPredictionId The ID of the last prediction made
  ///
  /// Emits multiple {Predicted} events.
  function bulkPredict(uint256 poolId, uint256 predictionPrice, uint16 predictionsCount)
    external
    payable
    nonReentrant
    whenNotPaused
    returns (uint256 firstPredictionId, uint256 lastPredictionId)
  {
    if (predictionsCount == 0) revert ZeroAmountSpecified();
    (Pool storage pool, PoolSeeds memory seeds) = _validateStartPredict(poolId);

    firstPredictionId = pool.noOfPredictions + 1;
    _checkNewUserOnPredict(poolId);
    _updatePredictStatsGeneral(poolId, predictionsCount, seeds);

    for (uint16 i = 0; i < predictionsCount; i += 1) {
      uint256 predictionId = firstPredictionId + i;
      _updatePredictStatsPrediction(poolId, predictionId, predictionPrice);
    }

    pool.noOfPredictions += predictionsCount;
    lastPredictionId = pool.noOfPredictions;

    if (seeds.stakeToken == address(this)) {
      if (msg.value < seeds.stakeAmount * predictionsCount) revert InsufficientStakeValue();
      if (msg.value > seeds.stakeAmount * predictionsCount) revert IncorrectStakeValue();
    } else {
      IERC20(seeds.stakeToken).safeTransferFrom(msg.sender, address(this), seeds.stakeAmount * predictionsCount);
    }
  }

  /// Initiates pool completion by setting batch requirements.
  /// This must be called first before processing any winner batches.
  /// Only collects fees and sets snapshot after ALL batches are processed via finalizePoolCompletion.
  function initiatePoolCompletion(uint256 poolId, uint256 snapshotPrice, uint256 batchSize)
    external
    nonReentrant
    whenNotPaused
    onlyRole(ADMIN_ROLE)
  {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    Pool storage pool = pools[poolId];
    if (pool.completionTime != 0) revert PoolAlreadyCompleted();
    if (hasPoolCompletionBeenInitiated[poolId]) revert PoolCompletionAlreadyInitiated();
    if (block.timestamp < pool.seeds.snapshotTime) revert NotYetSnapshotTime();
    if (pool.noOfPredictions == 0) revert NoPredictionsInPool();
    if (batchSize == 0) revert InvalidPoolCompletionBatchSize();
    // should never happen due to createPool validations, but worth having to prevent division by zero
    if (pool.seeds.multiplier == 0) revert InvalidPoolMultiplier();

    pool.snapshotPrice = snapshotPrice;

    uint256 noOfWinners;
    if (pool.noOfPredictions == 1) {
      noOfWinners = 1;
    } else {
      // the multiplier is in 2 decimal places (x2 is 200), so we multiply by 100 here to cancel it out
      // also rounding down is intended as solidity does that by default
      noOfWinners = (pool.noOfPredictions * 100) / pool.seeds.multiplier;
      if (noOfWinners == 0) noOfWinners = 1;
    }
    if (batchSize > noOfWinners) revert InvalidPoolCompletionBatchSize();
    pool.noOfWinners = noOfWinners;

    uint256 totalStaked = pool.seeds.stakeAmount * pool.noOfPredictions;
    uint256 fees = pool.seeds.feesPercent * totalStaked / 10000; // feesPercent is in 2 decimal places
    pool.winAmount = (totalStaked - fees) / noOfWinners;

    hasPoolCompletionBeenInitiated[poolId] = true;
    poolCompletionBatchSize[poolId] = batchSize;
    poolCompletionBatchesProcessed[poolId] = 0;
    emit PoolCompletionInitiated(poolId, noOfWinners, pool.winAmount);
  }

  /// Processes a batch of winners for a pool. Can be called multiple times until all batches are processed.
  /// Each winner is marked and their stats are updated. Prevents duplicate processing.
  function setWinnersInBatch(uint256 poolId, uint256[] memory winnerPredictionIds)
    external
    nonReentrant
    whenNotPaused
    onlyRole(ADMIN_ROLE)
  {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    if (!hasPoolCompletionBeenInitiated[poolId]) revert PoolCompletionNotInitiated();

    Pool storage pool = pools[poolId];
    if (pool.completionTime != 0) revert PoolAlreadyCompleted();
    if (winnerPredictionIds.length == 0) revert InvalidPoolCompletionBatchSize();

    uint256 currentWinnersCount = winnerPredictionIds.length;
    uint256 batchSize = poolCompletionBatchSize[poolId];
    uint256 totalBatches = (pool.noOfWinners + batchSize - 1) / batchSize; // Ceiling division
    uint256 processedBatches = poolCompletionBatchesProcessed[poolId];
    if (processedBatches >= totalBatches) revert PoolCompletionBatchesAllProcessed();

    // Ensure correct batch size, last batch array length must match expected leftover count
    bool isLastBatch = totalBatches - processedBatches == 1;
    if (isLastBatch) {
      uint256 leftover = pool.noOfWinners - (processedBatches * batchSize);
      if (currentWinnersCount != leftover) revert InvalidPoolCompletionBatchSize();
    }
    // otherwise, array length must match expected batchSize
    if (!isLastBatch && currentWinnersCount != batchSize) revert InvalidPoolCompletionBatchSize();

    for (uint256 i = 0; i < currentWinnersCount; i++) {
      uint256 predictionId = winnerPredictionIds[i];
      if (predictionId == 0 || predictionId > pool.noOfPredictions) revert InvalidPredictionId();
      if (predictions[poolId][predictionId].isAWinner) revert PredictionAlreadyMarkedAsWinner(predictionId);

      // Mark prediction as winner
      predictions[poolId][predictionId].isAWinner = true;

      // Update all stats for this winner
      address predicter = predictions[poolId][predictionId].predicter;
      userStats[predicter].noOfWinnings += 1;
      userStats[predicter].noOfClaimableWinnings += 1;
      userStakeTokenDetails[predicter][pool.seeds.stakeToken].noOfWinnings += 1;
      userStakeTokenDetails[predicter][pool.seeds.stakeToken].noOfClaimableWinnings += 1;
      userStakeTokenDetails[predicter][pool.seeds.stakeToken].totalWon += pool.winAmount;
      userStakeTokenDetails[predicter][pool.seeds.stakeToken].totalClaimable += pool.winAmount;
      userInPoolPredictionStats[poolId][predicter].noOfWinnings += 1;
      userInPoolPredictionStats[poolId][predicter].noOfClaimableWinnings += 1;

      // Update tracking arrays
      winnerPredictionIdsByAddressesPerPool[poolId][predicter].push(predictionId);
      claimableWinnerPredictionIdsByAddressesPerPool[poolId][predicter].push(predictionId);
      bytes32 activityHash = hashUserPredictionActivity(UserPredictionActivity(poolId, predictionId));
      winnerActivityHashesByAddresses[predicter].push(activityHash);
      claimableActivityHashesByAddresses[predicter].push(activityHash);
      claimableActivityHashesIndex[predicter][activityHash] = userStats[predicter].noOfClaimableWinnings - 1;
      claimablePredictionIdsInPoolIndex[poolId][predicter][predictionId] =
        userInPoolPredictionStats[poolId][predicter].noOfClaimableWinnings - 1;
    }

    allStats.noOfWinnings += currentWinnersCount;
    allStats.noOfClaimableWinnings += currentWinnersCount;
    stakeTokenDetails[pool.seeds.stakeToken].noOfWinnings += currentWinnersCount;
    stakeTokenDetails[pool.seeds.stakeToken].noOfClaimableWinnings += currentWinnersCount;
    stakeTokenDetails[pool.seeds.stakeToken].totalWon += pool.winAmount * currentWinnersCount;
    stakeTokenDetails[pool.seeds.stakeToken].totalClaimable += pool.winAmount * currentWinnersCount;
    poolCompletionBatchesProcessed[poolId] += 1;

    emit SetWinnersInBatch(poolId, poolCompletionBatchesProcessed[poolId], totalBatches, winnerPredictionIds.length);
  }

  /// Finalizes pool completion by collecting fees and marking pool as complete.
  /// Can only be called after all winner batches have been processed.
  function finalizePoolCompletion(uint256 poolId) external nonReentrant whenNotPaused onlyRole(ADMIN_ROLE) {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    if (!hasPoolCompletionBeenInitiated[poolId]) revert PoolCompletionNotInitiated();

    Pool storage pool = pools[poolId];
    if (pool.completionTime != 0) revert PoolAlreadyCompleted();
    uint256 batchSize = poolCompletionBatchSize[poolId];
    uint256 totalBatches = (pool.noOfWinners + batchSize - 1) / batchSize; // Ceiling division
    if (poolCompletionBatchesProcessed[poolId] < totalBatches) revert PoolCompletionBatchesNotAllProcessed();

    pool.completionTime = block.timestamp;
    emit PoolCompleted(poolId);

    uint256 totalStaked = pool.seeds.stakeAmount * pool.noOfPredictions;
    uint256 fees = pool.seeds.feesPercent * totalStaked / 10000; // feesPercent is in 2 decimal places
    if (fees > 0) {
      if (pool.seeds.stakeToken == address(this)) {
        (bool isSuccess,) = payable(poolsManager).call{value: fees}('');
        if (!isSuccess) revert UnsuccessfulFeeCollection();
      } else {
        IERC20(pool.seeds.stakeToken).safeTransfer(poolsManager, fees);
      }

      CastoraPoolsManager(payable(poolsManager)).processPoolCompletion(poolId);
    }
  }

  function _removeClaimableActivityHash(uint256 poolId, uint256 predictionId) internal {
    bytes32 activityHash = hashUserPredictionActivity(UserPredictionActivity(poolId, predictionId));
    uint256 indexToRemove = claimableActivityHashesIndex[msg.sender][activityHash];
    uint256 lastIndex = userStats[msg.sender].noOfClaimableWinnings - 1;

    if (indexToRemove != lastIndex) {
      bytes32 lastHash = claimableActivityHashesByAddresses[msg.sender][lastIndex];
      claimableActivityHashesByAddresses[msg.sender][indexToRemove] = lastHash;
      claimableActivityHashesIndex[msg.sender][lastHash] = indexToRemove;
    }

    claimableActivityHashesByAddresses[msg.sender].pop();
    delete claimableActivityHashesIndex[msg.sender][activityHash];
    userStats[msg.sender].noOfClaimableWinnings -= 1;
  }

  function _removeClaimablePredictionIdInPool(uint256 poolId, uint256 predictionId) internal {
    uint256 indexToRemove = claimablePredictionIdsInPoolIndex[poolId][msg.sender][predictionId];
    uint256 lastIndex = userInPoolPredictionStats[poolId][msg.sender].noOfClaimableWinnings - 1;

    if (indexToRemove != lastIndex) {
      uint256 lastPredictionId = claimableWinnerPredictionIdsByAddressesPerPool[poolId][msg.sender][lastIndex];
      claimableWinnerPredictionIdsByAddressesPerPool[poolId][msg.sender][indexToRemove] = lastPredictionId;
      claimablePredictionIdsInPoolIndex[poolId][msg.sender][lastPredictionId] = indexToRemove;
    }

    claimableWinnerPredictionIdsByAddressesPerPool[poolId][msg.sender].pop();
    delete claimablePredictionIdsInPoolIndex[poolId][msg.sender][predictionId];
    userInPoolPredictionStats[poolId][msg.sender].noOfClaimableWinnings -= 1;
  }

  function _updateClaimStats(uint256 poolId, uint256 winAmount, address stakeToken) internal {
    allStats.noOfClaimableWinnings -= 1;
    allStats.noOfClaimedWinnings += 1;
    userStats[msg.sender].noOfClaimedWinnings += 1;
    userInPoolPredictionStats[poolId][msg.sender].noOfClaimedWinnings += 1;
    stakeTokenDetails[stakeToken].noOfClaimableWinnings -= 1;
    stakeTokenDetails[stakeToken].noOfClaimedWinnings += 1;
    stakeTokenDetails[stakeToken].totalClaimable -= winAmount;
    stakeTokenDetails[stakeToken].totalClaimed += winAmount;
    userStakeTokenDetails[msg.sender][stakeToken].noOfClaimableWinnings -= 1;
    userStakeTokenDetails[msg.sender][stakeToken].noOfClaimedWinnings += 1;
    userStakeTokenDetails[msg.sender][stakeToken].totalClaimable -= winAmount;
    userStakeTokenDetails[msg.sender][stakeToken].totalClaimed += winAmount;
  }

  function _claimWinnings(uint256 poolId, uint256 predictionId) internal {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();

    Pool storage pool = pools[poolId];
    if (pool.completionTime == 0) revert PoolNotYetCompleted();
    if (predictionId == 0 || predictionId > pool.noOfPredictions) revert InvalidPredictionId();

    Prediction storage prediction = predictions[poolId][predictionId];
    if (prediction.predicter != msg.sender) revert NotYourPrediction();
    if (!prediction.isAWinner) revert NotAWinner();
    if (prediction.claimedWinningsTime != 0) revert AlreadyClaimedWinnings();

    pool.noOfClaimedWinnings += 1;
    prediction.claimedWinningsTime = block.timestamp;
    _updateClaimStats(poolId, pool.winAmount, pool.seeds.stakeToken);
    _removeClaimableActivityHash(poolId, predictionId);
    _removeClaimablePredictionIdInPool(poolId, predictionId);

    emit ClaimedWinnings(
      poolId, predictionId, prediction.predicter, pool.seeds.stakeToken, pool.seeds.stakeAmount, pool.winAmount
    );

    if (pool.seeds.stakeToken == address(this)) {
      (bool isSuccess,) = payable(prediction.predicter).call{value: pool.winAmount}('');
      if (!isSuccess) revert UnsuccessfulSendWinnings();
    } else {
      IERC20(pool.seeds.stakeToken).safeTransfer(prediction.predicter, pool.winAmount);
    }
  }

  /// Awards the predicter who made the {Prediction} with `predictionId` in
  /// the {Pool} with `poolId` if the {Prediction-predictionPrice} is among
  /// the {Pool-winnerPrediction}s.
  ///
  /// Fails if the pool has not yet been completed, if the caller is not the
  /// predicter, if the predicter is not a winner, or if the predicter has
  /// already claimed their winnings.
  ///
  /// Emits an {ClaimedWinnings} event.
  function claimWinnings(uint256 poolId, uint256 predictionId) external nonReentrant whenNotPaused {
    _claimWinnings(poolId, predictionId);
  }

  /// Claims winnings for multiple predictions in multiple pools.
  ///
  /// Fails if the lengths of `poolIds` and `predictionIds` do not match.
  /// For each prediction, fails if the pool has not yet been completed,
  /// if the caller is not the predicter, if the predicter is not a winner,
  /// or if the predicter has already claimed their winnings.
  ///
  /// Emits multiple {ClaimedWinnings} events.
  function claimWinningsBulk(uint256[] memory poolIds, uint256[] memory predictionIds)
    external
    nonReentrant
    whenNotPaused
  {
    if (poolIds.length != predictionIds.length) {
      revert UnmatchingPoolsAndPredictions();
    }

    for (uint256 i = 0; i < poolIds.length; i += 1) {
      _claimWinnings(poolIds[i], predictionIds[i]);
    }
  }
}
