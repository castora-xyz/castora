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
import {CastoraActivities} from './CastoraActivities.sol';
import {CastoraErrors} from './CastoraErrors.sol';
import {CastoraEvents} from './CastoraEvents.sol';
import {CastoraPoolsManager} from './CastoraPoolsManager.sol';
import {CastoraPoolsRules} from './CastoraPoolsRules.sol';
import {CastoraStructs} from './CastoraStructs.sol';

/// Core prediction gaming contract where users stake tokens to predict future prices.
/// Participants compete by predicting token prices at specific future timestamps.
/// Winners are determined by accuracy and share the total staked funds proportionally.
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

  /// Address for CastoraActivities contract
  address public activities;
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
  /// Array of won predictions
  bytes32[] public winnerActivityHashes;
  /// Array of claimed predictions
  bytes32[] public claimedWinnerActivityHashes;
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

  /// Returns global statistics for all pools and predictions
  /// @return stats Struct containing aggregated protocol statistics
  function getAllStats() external view returns (AllPredictionStats memory stats) {
    stats = allStats;
  }

  /// Paginates through address arrays to handle large datasets
  /// @param array Storage array to paginate
  /// @param total Total length of the array
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of items to return
  /// @return items Slice of addresses from the array
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

  /// Paginates through uint256 arrays to handle large datasets
  /// @param array Storage array to paginate
  /// @param total Total length of the array
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of items to return
  /// @return items Slice of uint256 values from the array
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

  /// Paginates through bytes32 arrays to handle large datasets
  /// @param array Storage array to paginate
  /// @param total Total length of the array
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of items to return
  /// @return items Slice of bytes32 values from the array
  function _paginateBytes32Array(bytes32[] storage array, uint256 total, uint256 offset, uint256 limit)
    internal
    view
    returns (bytes32[] memory items)
  {
    if (offset >= total) return new bytes32[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    items = new bytes32[](length);

    for (uint256 i = 0; i < length; i += 1) {
      items[i] = array[offset + i];
    }
  }

  /// Returns paginated list of users who have interacted with the contract
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of users to return
  /// @return usersList Array of user addresses
  function getUsersPaginated(uint256 offset, uint256 limit) external view returns (address[] memory usersList) {
    usersList = _paginateAddressArray(users, allStats.noOfUsers, offset, limit);
  }

  /// Returns paginated list of tokens used for predictions
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of tokens to return
  /// @return tokensList Array of token addresses used in predictions
  function getPredictionTokensPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory tokensList)
  {
    tokensList = _paginateAddressArray(predictionTokens, allStats.noOfPredictionTokens, offset, limit);
  }

  /// Returns paginated list of tokens used for staking
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of tokens to return
  /// @return tokensList Array of token addresses used for staking
  function getStakeTokensPaginated(uint256 offset, uint256 limit) external view returns (address[] memory tokensList) {
    tokensList = _paginateAddressArray(stakeTokens, allStats.noOfStakeTokens, offset, limit);
  }

  /// Retrieves user prediction activity details by hash
  /// @param activityHash Hash of the activity to retrieve
  /// @return activity User prediction activity data
  function getUserPredictionActivity(bytes32 activityHash)
    external
    view
    returns (UserPredictionActivity memory activity)
  {
    if (userPredictionActivities[activityHash].poolId == 0) revert InvalidActivityHash();
    activity = userPredictionActivities[activityHash];
  }

  /// Retrieves multiple user prediction activities by their hashes
  /// @param hashes Array of activity hashes to retrieve
  /// @return userActivities Array of user prediction activity data
  function getUserPredictionActivities(bytes32[] calldata hashes)
    external
    view
    returns (UserPredictionActivity[] memory userActivities)
  {
    userActivities = new UserPredictionActivity[](hashes.length);
    for (uint256 i = 0; i < hashes.length; i += 1) {
      if (userPredictionActivities[hashes[i]].poolId == 0) revert InvalidActivityHash();
      userActivities[i] = userPredictionActivities[hashes[i]];
    }
  }

  /// Returns paginated list of all prediction activity hashes across the system
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of hashes to return
  /// @return activityHashes Array of prediction activity hashes
  function getAllPredictionActivityHashesPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (bytes32[] memory activityHashes)
  {
    activityHashes = _paginateBytes32Array(userPredictionActivityHashes, allStats.noOfPredictions, offset, limit);
  }

  /// Returns paginated list of winning prediction activity hashes
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of hashes to return
  /// @return activityHashes Array of winner activity hashes
  function getWinnerActivityHashesPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (bytes32[] memory activityHashes)
  {
    activityHashes = _paginateBytes32Array(winnerActivityHashes, allStats.noOfWinnings, offset, limit);
  }

  /// Returns paginated list of claimed winning prediction activity hashes
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of hashes to return
  /// @return activityHashes Array of claimed winner activity hashes
  function getClaimedWinnerActivityHashesPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (bytes32[] memory activityHashes)
  {
    activityHashes = _paginateBytes32Array(claimedWinnerActivityHashes, allStats.noOfClaimedWinnings, offset, limit);
  }

  /// Returns comprehensive statistics for a specific user
  /// @param user Address of the user to get statistics for
  /// @return stats User's prediction and pool statistics
  function getUserStats(address user) external view returns (UserPredictionStats memory stats) {
    if (user == address(0)) revert InvalidAddress();
    stats = userStats[user];
  }

  /// Returns paginated list of pool IDs that a user has joined
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of pool IDs to return
  /// @return poolIds Array of pool IDs the user has participated in
  function getJoinedPoolIdsForUserPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory poolIds)
  {
    if (user == address(0)) revert InvalidAddress();
    poolIds = _paginateUint256Array(joinedPoolIdsByAddresses[user], userStats[user].noOfJoinedPools, offset, limit);
  }

  /// Returns paginated list of prediction activity hashes for a specific user
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of hashes to return
  /// @return activityHashes Array of the user's prediction activity hashes
  function getUserPredictionActivityHashesPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (bytes32[] memory activityHashes)
  {
    if (user == address(0)) revert InvalidAddress();
    activityHashes = _paginateBytes32Array(
      userPredictionActivityHashesByAddresses[user], userStats[user].noOfPredictions, offset, limit
    );
  }

  /// Returns paginated list of winning activity hashes for a specific user
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of hashes to return
  /// @return activityHashes Array of the user's winning activity hashes
  function getWinnerActivityHashesForAddressPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (bytes32[] memory activityHashes)
  {
    if (user == address(0)) revert InvalidAddress();
    activityHashes =
      _paginateBytes32Array(winnerActivityHashesByAddresses[user], userStats[user].noOfWinnings, offset, limit);
  }

  /// Returns paginated list of claimable winning activity hashes for a specific user
  /// @param predicter Address of the predicter
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of hashes to return
  /// @return activityHashes Array of the user's claimable winning activity hashes
  function getClaimableActivityHashesForAddressPaginated(address predicter, uint256 offset, uint256 limit)
    external
    view
    returns (bytes32[] memory activityHashes)
  {
    if (predicter == address(0)) revert InvalidAddress();
    activityHashes = _paginateBytes32Array(
      claimableActivityHashesByAddresses[predicter], userStats[predicter].noOfClaimableWinnings, offset, limit
    );
  }

  /// Retrieves pool data by ID
  /// @param poolId ID of the pool to retrieve
  /// @return pool Complete pool data structure
  function getPool(uint256 poolId) external view returns (Pool memory pool) {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    pool = pools[poolId];
  }

  /// Retrieves prediction data by pool and prediction ID
  /// @param poolId ID of the pool containing the prediction
  /// @param predictionId ID of the specific prediction
  /// @return prediction Complete prediction data structure
  function getPrediction(uint256 poolId, uint256 predictionId) external view returns (Prediction memory prediction) {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    Pool storage pool = pools[poolId];
    if (predictionId == 0 || predictionId > pool.noOfPredictions) {
      revert InvalidPredictionId();
    }
    prediction = predictions[poolId][predictionId];
  }

  /// Retrieves multiple pools by their IDs
  /// @param poolIds Array of pool IDs to fetch
  /// @return poolsList Array of Pool structs corresponding to the IDs
  function getPools(uint256[] calldata poolIds) external view returns (Pool[] memory poolsList) {
    poolsList = new Pool[](poolIds.length);
    for (uint256 i = 0; i < poolIds.length; i += 1) {
      if (poolIds[i] == 0 || poolIds[i] > allStats.noOfPools) revert InvalidPoolId();
      poolsList[i] = pools[poolIds[i]];
    }
  }

  /// Retrieves multiple predictions from a specific pool
  /// @param poolId ID of the pool to fetch predictions from
  /// @param predictionIds Array of prediction IDs to fetch
  /// @return predictionsList Array of Prediction structs
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

  /// Returns user statistics within a specific pool
  /// @param poolId ID of the pool
  /// @param user Address of the user
  /// @return stats User's statistics for the specified pool
  function getUserInPoolPredictionStats(uint256 poolId, address user)
    external
    view
    returns (UserInPoolPredictionStats memory stats)
  {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    if (user == address(0)) revert InvalidAddress();
    stats = userInPoolPredictionStats[poolId][user];
  }

  /// Returns paginated list of prediction IDs made by a user in a specific pool
  /// @param poolId ID of the pool to fetch predictions from
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of prediction IDs to return
  /// @return predictionIds Array of prediction IDs made by the user
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

  /// Returns paginated list of winning prediction IDs for a user in a specific pool
  /// @param poolId ID of the pool to fetch from
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of prediction IDs to return
  /// @return predictionIds Array of winning prediction IDs
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

  /// Returns paginated list of claimable winning prediction IDs for a user in a specific pool
  /// @param poolId ID of the pool to fetch from
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of prediction IDs to return
  /// @return predictionIds Array of claimable winning prediction IDs
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

  /// Returns global statistics for a prediction token
  /// @param token Address of the prediction token
  /// @return details Token usage statistics across all pools
  function getPredictionTokenDetails(address token) external view returns (PredictionTokenDetails memory details) {
    if (token == address(0)) revert InvalidAddress();
    details = predictionTokenDetails[token];
  }

  /// Returns global statistics for a stake token
  /// @param token Address of the stake token
  /// @return details Token usage statistics across all pools and predictions
  function getStakeTokenDetails(address token) external view returns (StakeTokenDetails memory details) {
    if (token == address(0)) revert InvalidAddress();
    details = stakeTokenDetails[token];
  }

  /// Returns paginated list of prediction tokens used by a specific user
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of tokens to return
  /// @return tokensList Array of prediction token addresses used by the user
  function getUserPredictionTokensPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory tokensList)
  {
    if (user == address(0)) revert InvalidAddress();
    tokensList = _paginateAddressArray(userPredictionTokens[user], userStats[user].noOfPredictionTokens, offset, limit);
  }

  /// Returns user-specific statistics for a prediction token
  /// @param user Address of the user
  /// @param token Address of the prediction token
  /// @return details User's usage statistics for the specific token
  function getUserPredictionTokenDetails(address user, address token)
    external
    view
    returns (PredictionTokenDetails memory details)
  {
    if (user == address(0) || token == address(0)) revert InvalidAddress();
    details = userPredictionTokenDetails[user][token];
  }

  /// Returns paginated list of stake tokens used by a specific user
  /// @param user Address of the user
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of tokens to return
  /// @return tokensList Array of stake token addresses used by the user
  function getUserStakeTokensPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory tokensList)
  {
    if (user == address(0)) revert InvalidAddress();
    tokensList = _paginateAddressArray(userStakeTokens[user], userStats[user].noOfStakeTokens, offset, limit);
  }

  /// Returns user-specific statistics for a stake token
  /// @param user Address of the user
  /// @param token Address of the stake token
  /// @return details User's usage statistics for the specific token
  function getUserStakeTokenDetails(address user, address token)
    external
    view
    returns (StakeTokenDetails memory details)
  {
    if (user == address(0) || token == address(0)) revert InvalidAddress();
    details = userStakeTokenDetails[user][token];
  }

  /// Generates a unique hash for pool seeds to identify duplicate pools
  /// @param seeds Pool configuration parameters
  /// @return Hash of the pool seeds for uniqueness checking
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

  /// Generates a unique hash for user prediction activities
  /// @param activity User prediction activity data
  /// @return Hash of the activity for tracking and indexing
  function hashUserPredictionActivity(UserPredictionActivity memory activity) public pure returns (bytes32) {
    return keccak256(abi.encodePacked('poolId', activity.poolId, 'predictionId', activity.predictionId));
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// Initializes the contract with required dependency addresses and sets up roles
  /// @param activities_ Address of the CastoraActivities contract for activity logging
  /// @param poolsManager_ Address of the CastoraPoolsManager contract for pool management
  /// @param poolsRules_ Address of the CastoraPoolsRules contract for validation rules
  function initialize(address activities_, address poolsManager_, address poolsRules_) public initializer {
    if (activities_ == address(0)) revert InvalidAddress();
    if (poolsManager_ == address(0)) revert InvalidAddress();
    if (poolsRules_ == address(0)) revert InvalidAddress();

    activities = activities_;
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

  /// Authorizes contract upgrades restricted to owner
  /// @param newImpl Address of the new implementation contract
  function _authorizeUpgrade(address newImpl) internal override onlyOwner {}

  /// Pauses contract operations to prevent new interactions
  function pause() external onlyOwner nonReentrant whenNotPaused {
    _pause();
  }

  /// Unpauses contract operations to resume normal functionality
  function unpause() external onlyOwner nonReentrant whenPaused {
    _unpause();
  }

  /// Updates the CastoraActivities contract address for activity logging
  /// @param _activities New CastoraActivities contract address
  function setActivities(address _activities) external onlyOwner {
    if (_activities == address(0)) revert InvalidAddress();
    address oldActivities = activities;
    activities = _activities;
    emit SetActivitiesInCastora(oldActivities, _activities);
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

  /// Grants admin role to enable pool creation and management functions
  /// @param admin Address to receive admin privileges
  function grantAdminRole(address admin) external onlyOwner {
    if (admin == address(0)) revert InvalidAddress();
    _grantRole(ADMIN_ROLE, admin);
  }

  /// Revokes admin role from an address
  /// @param admin Address to remove admin privileges from
  function revokeAdminRole(address admin) external onlyOwner {
    if (admin == address(0)) revert InvalidAddress();
    _revokeRole(ADMIN_ROLE, admin);
  }

  /// Creates a new prediction pool with specified parameters
  /// @param seeds Pool configuration including tokens, amounts, and timing
  /// @return poolId ID of the newly created pool
  function createPool(PoolSeeds memory seeds)
    external
    nonReentrant
    whenNotPaused
    onlyRole(ADMIN_ROLE)
    returns (uint256 poolId)
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

    poolId = allStats.noOfPools;
    emit PoolCreated(poolId, seedsHash);
    CastoraActivities(activities).log(poolId, msg.sender, ActivityType.POOL_CREATED, poolId);
  }

  /// Validates pool exists and prediction window is still open
  /// @param poolId ID of the pool to validate
  /// @return pool Storage reference to the pool
  /// @return seeds Pool configuration parameters
  function _validateStartPredict(uint256 poolId) internal view returns (Pool storage pool, PoolSeeds memory seeds) {
    if (poolId == 0 || poolId > allStats.noOfPools) revert InvalidPoolId();
    pool = pools[poolId];
    seeds = pool.seeds;
    if (block.timestamp > seeds.windowCloseTime) revert WindowHasClosed();
  }

  /// Checks if this is a new user's first prediction and updates global user count
  /// @param poolId ID of the pool for activity logging
  function _checkNewUserOnPredict(uint256 poolId) internal {
    if (userStats[msg.sender].nthUserCount == 0) {
      allStats.noOfUsers += 1;
      userStats[msg.sender].nthUserCount = allStats.noOfUsers;
      users.push(msg.sender);
      emit NewUserPredicted(msg.sender, poolId, userStats[msg.sender].nthUserCount);
      CastoraActivities(activities).log(poolId, msg.sender, ActivityType.NEW_USER_ACTIVITY, allStats.noOfUsers);
    }
  }

  /// Updates global and user statistics when predictions are made
  /// @param poolId ID of the pool being predicted in
  /// @param predictionsCount Number of predictions being made
  /// @param seeds Pool configuration for token tracking
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

  /// Creates prediction record and updates activity tracking
  /// @param poolId ID of the pool containing the prediction
  /// @param predictionId Sequential ID for the new prediction
  /// @param predictionPrice Price prediction made by the user
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
    CastoraActivities(activities).log(poolId, msg.sender, ActivityType.PREDICTED, allStats.noOfPredictions);
  }

  /// Makes a single prediction in a pool by staking the required amount
  /// @param poolId ID of the pool to predict in
  /// @param predictionPrice Predicted price for the token at snapshot time
  /// @return predictionId Sequential ID assigned to this prediction
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

  /// Makes multiple predictions with the same price in a single transaction
  /// @param poolId ID of the pool to predict in
  /// @param predictionPrice Predicted price to use for all predictions
  /// @param predictionsCount Number of predictions to make
  /// @return firstPredictionId ID of the first prediction made
  /// @return lastPredictionId ID of the last prediction made
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

  /// Begins pool completion process with actual price and batch size for processing
  /// @param poolId ID of the pool to complete
  /// @param snapshotPrice Actual price of the prediction token at snapshot time
  /// @param batchSize Number of winners to process per batch
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
    CastoraActivities(activities).log(poolId, msg.sender, ActivityType.POOL_COMPLETION_INITIATED, poolId);
  }

  /// Processes a batch of winning predictions and updates winner statistics
  /// @param poolId ID of the pool being completed
  /// @param winnerPredictionIds Array of prediction IDs that won in this batch
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
      winnerActivityHashes.push(activityHash);
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

  /// Completes pool finalization after all winner batches are processed
  /// @param poolId ID of the pool to finalize
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
    CastoraActivities(activities).log(poolId, msg.sender, ActivityType.POOL_COMPLETED, poolId);

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

  /// Removes activity hash from user's claimable list efficiently using swap-and-pop
  /// @param activityHash Hash of the activity to remove from claimable list
  function _removeClaimableActivityHash(bytes32 activityHash) internal {
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

  /// Removes prediction ID from user's claimable list in a specific pool
  /// @param poolId ID of the pool containing the prediction
  /// @param predictionId ID of the prediction to remove from claimable list
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

  /// Updates all relevant statistics when winnings are claimed
  /// @param poolId ID of the pool where winnings were claimed
  /// @param winAmount Amount of tokens won
  /// @param stakeToken Address of the token being claimed
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

  /// Internal logic for claiming winnings from a winning prediction
  /// @param poolId ID of the pool containing the winning prediction
  /// @param predictionId ID of the winning prediction to claim
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

    bytes32 activityHash = hashUserPredictionActivity(UserPredictionActivity(poolId, predictionId));
    claimedWinnerActivityHashes.push(activityHash);
    _removeClaimableActivityHash(activityHash);
    _removeClaimablePredictionIdInPool(poolId, predictionId);

    emit ClaimedWinnings(
      poolId, predictionId, prediction.predicter, pool.seeds.stakeToken, pool.seeds.stakeAmount, pool.winAmount
    );
    CastoraActivities(activities).log(poolId, msg.sender, ActivityType.CLAIMED_WINNINGS, allStats.noOfClaimedWinnings);

    if (pool.seeds.stakeToken == address(this)) {
      (bool isSuccess,) = payable(prediction.predicter).call{value: pool.winAmount}('');
      if (!isSuccess) revert UnsuccessfulSendWinnings();
    } else {
      IERC20(pool.seeds.stakeToken).safeTransfer(prediction.predicter, pool.winAmount);
    }
  }

  /// Claims winnings for a single winning prediction
  /// @param poolId ID of the pool containing the winning prediction
  /// @param predictionId ID of the winning prediction to claim
  function claimWinnings(uint256 poolId, uint256 predictionId) external nonReentrant whenNotPaused {
    _claimWinnings(poolId, predictionId);
  }

  /// Claims winnings for multiple predictions across multiple pools in one transaction
  /// @param poolIds Array of pool IDs containing winning predictions
  /// @param predictionIds Array of prediction IDs to claim (must match poolIds length)
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
