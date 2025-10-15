// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol';
import './Castora.sol';
import './CastoraPoolsRules.sol';

error AlreadyClaimedCompletionFees();
error IncorrectCreationFeeValue();
error InsufficientCreationFeeValue();
error InvalidSplitFeesPercent();
error CreationFeeTokenAlreadyDisallowed();
error CreationFeeTokenNotAllowed();
error NotYourPool();
error PoolCompletionAlreadyProcessed();
error UnsuccessfulCreationFeeCollection();
error UnsuccessfulSendCompletionFees();

/// Emitted when the Castora contract address is updated
/// @param oldCastora The previous Castora contract address
/// @param newCastora The new Castora contract address
event SetCastora(address indexed oldCastora, address indexed newCastora);

/// Emitted when the CastoraPoolsRules contract address is updated
/// @param oldPoolsRules The previous CastoraPoolsRules contract address
/// @param newPoolsRules The new CastoraPoolsRules contract address
event SetPoolsRules(address indexed oldPoolsRules, address indexed newPoolsRules);

/// Emitted when the fee collector address is updated
/// @param oldFeeCollector The previous fee collector address
/// @param newFeeCollector The new fee collector address
event SetFeeCollector(address indexed oldFeeCollector, address indexed newFeeCollector);

/// Emitted when the completion pool fees split percentage is updated
/// @param oldPercentage The previous split percentage
/// @param newPercentage The new split percentage
event SetCompletionPoolFeesSplitPercent(uint256 oldPercentage, uint256 newPercentage);

/// Emitted when a token is allowed for creation fees
/// @param token The token address that was allowed
/// @param amount The fee amount set for this token
event SetCreationFees(address indexed token, uint256 amount);

/// Emitted when a token is disallowed for creation fees
/// @param token The token address that was disallowed
event DisallowedCreationFees(address indexed token);

/// Emitted when a pool is created
/// @param poolId The ID of the created pool
/// @param creator The address of the pool creator
/// @param creationFeesToken The token used for creation fees
/// @param creationFeesAmount The amount paid for creation fees
event UserHasCreatedPool(
  uint256 indexed poolId, address indexed creator, address indexed creationFeesToken, uint256 creationFeesAmount
);

/// Emitted when a pool created by a user is completed and the claims are set
/// @param poolId The ID of the completed pool
/// @param completionFeesToken The token used for completion fees
/// @param completionFeesAmount The users allocation they won
event IssuedCompletionFees(uint256 indexed poolId, address indexed completionFeesToken, uint256 completionFeesAmount);

/// Emitted when completion fees are claimed
/// @param poolId The ID of the pool
/// @param user The address claiming the fees
/// @param token The token being claimed
/// @param amount The amount being claimed
event ClaimedCompletionFees(uint256 indexed poolId, address indexed user, address indexed token, uint256 amount);

/// Emitted when the Pools Manager contract receives native token funds
/// @param sender The address that sent the money
/// @param amount The amount received
event ReceivedWasCalled(address indexed sender, uint256 amount);

/// Tracks global settings
struct AllConfig {
  /// Address for main castora contract
  address castora;
  /// Address for CastoraPoolsRules contract
  address poolsRules;
  /// Address for fee collection
  address feeCollector;
  /// Split percentage for completion pool fees (with 4 decimal places: 10000 = 100%)
  uint256 completionPoolFeesSplitPercent;
  /// Reserved field for future use
  address reserved1;
  /// Reserved field for future use
  address reserved2;
  /// Reserved field for future use
  uint256 reserved3;
  /// Reserved field for future use
  uint256 reserved4;
  /// Reserved field for future use
  uint256 reserved5;
}

/// Tracks global activity info
struct AllStats {
  /// Total number of unique users who have created pools
  uint256 noOfUsers;
  /// Total number of pools created across all users
  uint256 noOfUserCreatedPools;
  /// Total number of paid pool creations
  uint256 noOfUserPaidPoolCreations;
  /// Total number of pools with claimable completion fees
  uint256 noOfClaimableFeesPools;
  /// Total number of pools where completion fees have been claimed
  uint256 noOfClaimedFeesPools;
  /// Total number of unique tokens used for creation fees
  uint256 noOfCreationFeesTokens;
  /// Total number of unique tokens used for completion fees
  uint256 noOfCompletionFeesTokens;
  /// Reserved field for future use
  uint256 reserved1;
  /// Reserved field for future use
  uint256 reserved2;
  /// Reserved field for future use
  uint256 reserved3;
}

/// Tracks creation fee token details and usage statistics
struct CreationFeesTokenInfo {
  /// Whether the token is allowed for creation fees
  bool isAllowed;
  /// The fee amount required for this token
  uint256 amount;
  /// Total number of times this token has been used for creation fees
  uint256 totalUseCount;
  /// Total amount of this token collected as creation fees
  uint256 totalAmountUsed;
}

/// Tracks completion fee token details and usage statistics
struct CompletionFeesTokenInfo {
  /// Total number of times this token has been used for completion fees
  uint256 totalUseCount;
  /// Total amount of this token rewarded as completion fees
  uint256 totalAmountIssued;
  /// Total amount of this token claimed from completion fees
  uint256 totalAmountClaimed;
}

/// Tracks info about user activity
struct UserStats {
  /// The sequential number of when this user first created a pool
  uint256 nthUserCount;
  /// Total number of pools created by this user
  uint256 noOfPoolsCreated;
  /// Total number of times this user paid pool creation fees
  uint256 noOfPaidCreationFeesPools;
  /// Total number of pools where this user has claimable completion fees
  uint256 noOfClaimableCompletionFeesPools;
  /// Total number of pools where this user has claimed completion fees
  uint256 noOfClaimedCompletionFeesPools;
  /// Number of different tokens this user has used for creation fees
  uint256 noOfCreationFeeTokens;
  /// Number of different tokens this user has received as completion fees
  uint256 noOfCompletionFeeTokens;
}

/// Tracks info about token used during pool creation for the user
struct UserCreationTokenFeesInfo {
  /// Total amount of this token the user has paid for creation fees
  uint256 amount;
  /// Number of times the user has paid creation fees with this token
  uint256 count;
}

/// Tracks info about a token used during pool completion for the user
struct UserCompletionTokenFeesInfo {
  /// Amount of this token the user can claim as completion fees
  uint256 claimableAmount;
  /// Amount of this token the user has already claimed as completion fees
  uint256 claimedAmount;
  /// Number of times the user has received completion fees in this token
  uint256 count;
}

/// Tracks created pool information
struct UserCreatedPool {
  /// Address of the user who created the pool
  address creator;
  /// Token address used for completion fees reward
  address completionFeesToken;
  /// Token address used for creation fees payment
  address creationFeesToken;
  /// Sequential number of this pool for the creator
  uint256 nthPoolCount;
  /// Timestamp when the pool was created
  uint256 creationTime;
  /// Amount of creation fees paid for this pool
  uint256 creationFeesAmount;
  /// Timestamp when the pool was completed
  uint256 completionTime;
  /// Timestamp when the creator claimed their completion fees
  uint256 creatorClaimTime;
  /// Amount of completion fees awarded for this pool
  uint256 completionFeesAmount;
  /// Percentage of completion fees allocated to the creator
  uint256 completionFeesPercent;
  /// The ratio of win percentage in the pool, 2 decimal places (e.g 150 = 1.5x)
  uint16 multiplier;
  /// Whether the pool is should be visible in the UI
  bool isUnlisted;
}

/// @custom:oz-upgrades-from build-info-ref:CastoraPoolsManager
contract CastoraPoolsManager is
  Initializable,
  OwnableUpgradeable,
  ReentrancyGuardUpgradeable,
  PausableUpgradeable,
  UUPSUpgradeable
{
  using SafeERC20 for IERC20;

  /// Global settings for core logic
  AllConfig public allConfig;
  /// Global statistics for all pools and users
  AllStats public allStats;
  /// Array of users who have created pools
  address[] public users;
  /// Array of all created pool IDs
  uint256[] public totalCreatedPoolIds;
  /// Array of all claimable pool IDs
  uint256[] public totalClaimablePoolIds;
  /// Array of all claimed pool IDs
  uint256[] public totalClaimedPoolIds;
  /// Array of tokens used in pool creation fees
  address[] public creationFeesTokens;
  /// Array of tokens used in pool completion fees
  address[] public completionFeesTokens;
  /// Keeps track of token addresses to info about being paid for pool creation
  mapping(address token => CreationFeesTokenInfo info) public creationFeesTokenInfos;
  /// Keeps track of token addresses to info about being rewarded for pool completion
  mapping(address token => CompletionFeesTokenInfo info) public completionFeesTokenInfos;
  /// Keeps track of user addresses to their activity info
  mapping(address user => UserStats stats) public userStats;
  /// Keeps track of user addresses to array of created pool IDs
  mapping(address user => uint256[] poolIds) public userCreatedPoolIds;
  /// Keeps track of user addresses to array of paid created pool IDs
  mapping(address user => uint256[] poolIds) public userPaidCreatedPoolIds;
  /// Keeps track of user addresses to array of claimed fees pool IDs
  mapping(address user => uint256[] poolIds) public userClaimedFeesPoolIds;
  /// Keeps track of user addresses to array of claimable fees pool IDs
  mapping(address user => uint256[] poolIds) public userClaimableFeesPoolIds;
  /// Keeps track of tokens users have used as pool creation fees
  mapping(address user => address[] tokens) public userPoolCreationFeesTokens;
  /// Keeps track of tokens in which users have been awarded pool completion fees
  mapping(address user => address[] tokens) public userPoolCompletionFeesTokens;
  /// Keeps track of user addresses to mapping of token addresses to paid creation fee token data
  mapping(address user => mapping(address token => UserCreationTokenFeesInfo info)) public userCreationTokenFeesInfo;
  /// Keeps track of user addresses to mapping of token addresses to claimable/claimed pool completion fee data
  mapping(address user => mapping(address token => UserCompletionTokenFeesInfo info)) public userCompletionTokenFeesInfo;
  /// Keeps track of pool IDs to user created pool details
  mapping(uint256 poolId => UserCreatedPool pool) public userCreatedPools;
  /// Keeps track of pool IDs from non-users whose fees have been collected
  mapping(uint256 poolId => bool hasCollectedFees) public nonUserPoolHasCollectedFees;
  /// Efficient lookup for creation fee token existence
  mapping(address token => bool exists) public creationFeesTokenExists;

  /// Gets global settings
  /// @return config The AllConfig struct containing global settings
  function getAllConfig() external view returns (AllConfig memory config) {
    return allConfig;
  }

  /// Returns the Castora contract instance.
  function castora() internal view returns (Castora) {
    return Castora(payable(allConfig.castora));
  }

  /// Returns the CastoraPoolsRules contract instance.
  function poolsRules() internal view returns (CastoraPoolsRules) {
    return CastoraPoolsRules(allConfig.poolsRules);
  }

  /// Gets global statistics
  /// @return stats The AllStats struct containing global activity information
  function getAllStats() external view returns (AllStats memory stats) {
    return allStats;
  }

  /// Gets creation fee token information
  /// @param token The token address to query
  /// @return info The CreationFeesTokenInfo struct for the token
  function getCreationFeesTokenInfo(address token) external view returns (CreationFeesTokenInfo memory info) {
    return creationFeesTokenInfos[token];
  }

  /// Gets completion fee token information
  /// @param token The token address to query
  /// @return info The CompletionFeesTokenInfo struct for the token
  function getCompletionFeesTokenInfo(address token) external view returns (CompletionFeesTokenInfo memory info) {
    return completionFeesTokenInfos[token];
  }

  /// Gets user statistics
  /// @param user The user address to query
  /// @return stats The UserStats struct for the user
  function getUserStats(address user) external view returns (UserStats memory stats) {
    return userStats[user];
  }

  /// Gets user creation token fees information
  /// @param user The user address to query
  /// @param token The token address to query
  /// @return info The UserCreationTokenFeesInfo struct for the user and token
  function getUserCreationTokenFeesInfo(address user, address token)
    external
    view
    returns (UserCreationTokenFeesInfo memory info)
  {
    return userCreationTokenFeesInfo[user][token];
  }

  /// Gets user completion token fees information
  /// @param user The user address to query
  /// @param token The token address to query
  /// @return info The UserCompletionTokenFeesInfo struct for the user and token
  function getUserCompletionTokenFeesInfo(address user, address token)
    external
    view
    returns (UserCompletionTokenFeesInfo memory info)
  {
    return userCompletionTokenFeesInfo[user][token];
  }

  /// Gets created pool information
  /// @param poolId The pool ID to query
  /// @return pool The UserCreatedPool struct for the pool
  function getUserCreatedPool(uint256 poolId) external view returns (UserCreatedPool memory pool) {
    if (userCreatedPools[poolId].creationTime == 0) revert InvalidPoolId();
    return userCreatedPools[poolId];
  }

  /// Gets created pool infos for the provided pool IDs
  /// @param poolIds The array of pool IDs to query
  /// @return pools The array of UserCreatedPool structs for the pools
  function getUserCreatedPools(uint256[] memory poolIds) external view returns (UserCreatedPool[] memory pools) {
    pools = new UserCreatedPool[](poolIds.length);
    for (uint256 i = 0; i < poolIds.length; i++) {
      if (userCreatedPools[poolIds[i]].creationTime == 0) revert InvalidPoolId();
      pools[i] = userCreatedPools[poolIds[i]];
    }
  }

  /// Gets all creation fee tokens
  /// @return tokens Array of creation fee token addresses
  function getAllCreationFeesTokens() external view returns (address[] memory tokens) {
    return creationFeesTokens;
  }

  /// Gets all completion fee tokens
  /// @return tokens Array of completion fee token addresses
  function getAllCompletionFeesTokens() external view returns (address[] memory tokens) {
    return completionFeesTokens;
  }

  /// Gets tokens used by user for pool creation fees
  /// @param user The user address to query
  /// @return tokens Array of token addresses used for creation fees
  function getUserPoolCreationFeesTokens(address user) external view returns (address[] memory tokens) {
    return userPoolCreationFeesTokens[user];
  }

  /// Gets tokens received by user as pool completion fees
  /// @param user The user address to query
  /// @return tokens Array of token addresses received as completion fees
  function getUserPoolCompletionFeesTokens(address user) external view returns (address[] memory tokens) {
    return userPoolCompletionFeesTokens[user];
  }

  /// Checks if a token is allowed for creation fees
  /// @param token The token address to check
  /// @return allowed True if token is allowed for creation fees
  function isCreationFeeTokenAllowed(address token) external view returns (bool allowed) {
    return creationFeesTokenInfos[token].isAllowed;
  }

  /// Gets the creation fee amount for a token
  /// @param token The token address to query
  /// @return amount The fee amount required for this token
  function getCreationFeeAmount(address token) external view returns (uint256 amount) {
    return creationFeesTokenInfos[token].amount;
  }

  /// Checks if a pool exists
  /// @param poolId The pool ID to check
  /// @return exists True if pool exists
  function doesUserCreatedPoolExist(uint256 poolId) external view returns (bool exists) {
    return userCreatedPools[poolId].creationTime != 0;
  }

  // ========== PAGINATION FUNCTIONS ==========

  /// Gets paginated user created pool IDs
  /// @param user The user address to query
  /// @param offset Starting index (0-based)
  /// @param limit Maximum number of items to return
  /// @return poolIds Array of pool IDs for the page
  function getUserCreatedPoolIdsPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory poolIds)
  {
    return _paginateUint256Array(userCreatedPoolIds[user], userStats[user].noOfPoolsCreated, offset, limit);
  }

  /// Gets paginated paid user created pool IDs
  /// @param user The user address to query
  /// @param offset Starting index (0-based)
  /// @param limit Maximum number of items to return
  /// @return poolIds Array of pool IDs for the page
  function getUserPaidCreatedPoolIdsPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory poolIds)
  {
    return _paginateUint256Array(userPaidCreatedPoolIds[user], userStats[user].noOfPaidCreationFeesPools, offset, limit);
  }

  /// Gets paginated user claimable fees pool IDs
  /// @param user The user address to query
  /// @param offset Starting index (0-based)
  /// @param limit Maximum number of items to return
  /// @return poolIds Array of claimable pool IDs for the page
  function getUserClaimableFeesPoolIdsPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory poolIds)
  {
    return _paginateUint256Array(
      userClaimableFeesPoolIds[user], userStats[user].noOfClaimableCompletionFeesPools, offset, limit
    );
  }

  /// Gets paginated user claimed fees pool IDs
  /// @param user The user address to query
  /// @param offset Starting index (0-based)
  /// @param limit Maximum number of items to return
  /// @return poolIds Array of claimed pool IDs for the page
  function getUserClaimedFeesPoolIdsPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory poolIds)
  {
    return
      _paginateUint256Array(userClaimedFeesPoolIds[user], userStats[user].noOfClaimedCompletionFeesPools, offset, limit);
  }

  /// Gets paginated global created pool IDs
  /// @param offset Starting index (0-based)
  /// @param limit Maximum number of items to return
  /// @return poolIds Array of created pool IDs for the page
  function getAllCreatedPoolIdsPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory poolIds)
  {
    return _paginateUint256Array(totalCreatedPoolIds, allStats.noOfUserCreatedPools, offset, limit);
  }

  /// Gets paginated global claimable pool IDs
  /// @param offset Starting index (0-based)
  /// @param limit Maximum number of items to return
  /// @return poolIds Array of claimable pool IDs for the page
  function getAllClaimablePoolIdsPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory poolIds)
  {
    return _paginateUint256Array(totalClaimablePoolIds, allStats.noOfClaimableFeesPools, offset, limit);
  }

  /// Gets paginated global claimed pool IDs
  /// @param offset Starting index (0-based)
  /// @param limit Maximum number of items to return
  /// @return poolIds Array of claimed pool IDs for the page\
  function getAllClaimedPoolIdsPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory poolIds)
  {
    return _paginateUint256Array(totalClaimedPoolIds, allStats.noOfClaimedFeesPools, offset, limit);
  }

  /// Gets paginated users list
  /// @param offset Starting index (0-based)
  /// @param limit Maximum number of items to return
  /// @return usersList Array of user addresses for the page
  function getAllUsersPaginated(uint256 offset, uint256 limit) external view returns (address[] memory usersList) {
    return _paginateAddressArray(users, allStats.noOfUsers, offset, limit);
  }

  // ========== INTERNAL PAGINATION HELPERS ==========

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

    for (uint256 i = 0; i < length; i++) {
      items[i] = array[offset + i];
    }
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

    for (uint256 i = 0; i < length; i++) {
      items[i] = array[offset + i];
    }
  }

  receive() external payable {
    emit ReceivedWasCalled(msg.sender, msg.value);
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// Sets up this smart contract when it is deployed.
  /// @param castora_ The address of the main Castora contract.
  /// @param poolsRules_ The address of the CastoraPoolsRules contract.
  /// @param feeCollector_ The address that will collect pool completion fees for Castora.
  /// @param splitPercent_ The split percentage for completion pool fees (10000 = 100%).
  function initialize(address castora_, address poolsRules_, address feeCollector_, uint256 splitPercent_)
    public
    initializer
  {
    if (castora_ == address(0)) revert InvalidAddress();
    if (poolsRules_ == address(0)) revert InvalidAddress();
    if (feeCollector_ == address(0)) revert InvalidAddress();
    if (splitPercent_ > 10000) revert InvalidSplitFeesPercent();

    allConfig.castora = castora_;
    allConfig.poolsRules = poolsRules_;
    allConfig.feeCollector = feeCollector_;
    allConfig.completionPoolFeesSplitPercent = splitPercent_;

    __Ownable_init(msg.sender);
    __UUPSUpgradeable_init();
    __ReentrancyGuard_init();
    __Pausable_init();
  }

  function _authorizeUpgrade(address newImpl) internal override onlyOwner {}

  function pause() external onlyOwner nonReentrant {
    _pause();
  }

  function unpause() external onlyOwner nonReentrant {
    _unpause();
  }

  /// Sets the Castora contract address
  /// @param _castora The new Castora contract address
  function setCastora(address _castora) external onlyOwner {
    if (_castora == address(0)) revert InvalidAddress();
    address oldCastora = allConfig.castora;
    allConfig.castora = _castora;
    emit SetCastora(oldCastora, _castora);
  }

  /// Sets the CastoraPoolsRules contract address
  /// @param _poolsRules The new CastoraPoolsRules contract address
  function setPoolsRules(address _poolsRules) external onlyOwner {
    if (_poolsRules == address(0)) revert InvalidAddress();
    address oldPoolsRules = allConfig.poolsRules;
    allConfig.poolsRules = _poolsRules;
    emit SetPoolsRules(oldPoolsRules, _poolsRules);
  }

  /// Sets the fee collector address
  /// @param _feeCollector The new fee collector address
  function setFeeCollector(address _feeCollector) external onlyOwner {
    if (_feeCollector == address(0)) revert InvalidAddress();
    address oldFeeCollector = allConfig.feeCollector;
    allConfig.feeCollector = _feeCollector;
    emit SetFeeCollector(oldFeeCollector, _feeCollector);
  }

  /// Updates the completion pool fees split percent
  /// @param _percentage Split percentage with 4 decimal places (10000 = 100%)
  function setCompletionPoolFeesSplitPercent(uint256 _percentage) external onlyOwner nonReentrant {
    if (_percentage > 10000) revert InvalidSplitFeesPercent();
    uint256 oldPercentage = allConfig.completionPoolFeesSplitPercent;
    allConfig.completionPoolFeesSplitPercent = _percentage;
    emit SetCompletionPoolFeesSplitPercent(oldPercentage, _percentage);
  }

  /// Allows a token for creation fees. Also records the token in the creation array,
  /// if this is the first time it is been set.
  /// @param _token The token address to set
  /// @param _amount The fee amount for this token
  function setCreationFees(address _token, uint256 _amount) external onlyOwner nonReentrant {
    if (_token == address(0)) revert InvalidAddress();

    creationFeesTokenInfos[_token].isAllowed = true;
    creationFeesTokenInfos[_token].amount = _amount;

    // If token not found, add it to the array and increment counter
    if (!creationFeesTokenExists[_token]) {
      creationFeesTokenExists[_token] = true;
      allStats.noOfCreationFeesTokens++;
      creationFeesTokens.push(_token);
    }

    emit SetCreationFees(_token, _amount);
  }

  /// Disallow a token for creation fees
  /// @param _token The token address to disallow
  function disallowCreationFees(address _token) external onlyOwner nonReentrant {
    if (_token == address(0)) revert InvalidAddress();
    if (!creationFeesTokenInfos[_token].isAllowed) revert CreationFeeTokenAlreadyDisallowed();
    creationFeesTokenInfos[_token].isAllowed = false;
    creationFeesTokenInfos[_token].amount = 0;
    emit DisallowedCreationFees(_token);
  }

  /// @notice Creates a new pool with the provided seeds and creation fee token
  /// @param seeds The PoolSeeds struct containing pool parameters
  /// @param creationFeeToken The token to pay creation fees with
  /// @param multiplier The multiplier for the pool
  /// @param isUnlisted Whether the pool should be hidden in the UI
  /// @return poolId The ID of the newly created pool
  function createPool(PoolSeeds memory seeds, address creationFeeToken, uint16 multiplier, bool isUnlisted)
    external
    payable
    nonReentrant
    whenNotPaused
    returns (uint256 poolId)
  {
    if (creationFeeToken == address(0)) revert InvalidAddress();

    // Validate pool seeds using the rules contract
    poolsRules().validateCreatePool(seeds);

    // Ensure the multiplier is one of the allowed values
    poolsRules().validateMultiplier(multiplier);

    // Check if creation fee token is allowed
    if (!creationFeesTokenInfos[creationFeeToken].isAllowed) revert CreationFeeTokenNotAllowed();

    // Collect creation fee and create pool
    uint256 creationFeeAmount = _collectCreationFee(creationFeeToken);
    _sendToCastoraFeeCollectorInCreate(creationFeeAmount, creationFeeToken);
    poolId = castora().createPool(seeds);

    // Update statistics and user data
    _updatePoolCreationStats(poolId, seeds.stakeToken, creationFeeToken, creationFeeAmount, multiplier, isUnlisted);

    emit UserHasCreatedPool(poolId, msg.sender, creationFeeToken, creationFeeAmount);
  }

  /// @notice Internal function to collect creation fees
  /// @param creationFeeToken The token to collect fees in
  /// @return creationFeeAmount The amount of fees collected
  function _collectCreationFee(address creationFeeToken) internal returns (uint256 creationFeeAmount) {
    creationFeeAmount = creationFeesTokenInfos[creationFeeToken].amount;
    if (creationFeeAmount > 0) {
      if (creationFeeToken == address(this)) {
        // native token payment
        if (msg.value < creationFeeAmount) revert InsufficientCreationFeeValue();
        if (msg.value > creationFeeAmount) revert IncorrectCreationFeeValue();
      } else {
        // ERC20 token payment
        IERC20(creationFeeToken).safeTransferFrom(msg.sender, address(this), creationFeeAmount);
      }
    }
  }

  /// @notice Internal function to update statistics after pool creation
  /// @param poolId The ID of the created pool
  /// @param stakeToken The stake token from pool seeds
  /// @param creationFeeToken The token used for creation fees
  /// @param creationFeeAmount The amount of creation fees paid
  /// @param multiplier The multiplier for the pool
  /// @param isUnlisted Whether the pool should be hidden in the UI
  function _updatePoolCreationStats(
    uint256 poolId,
    address stakeToken,
    address creationFeeToken,
    uint256 creationFeeAmount,
    uint16 multiplier,
    bool isUnlisted
  ) internal {
    // Update user statistics if this is a new user
    if (userStats[msg.sender].nthUserCount == 0) {
      allStats.noOfUsers += 1;
      userStats[msg.sender].nthUserCount = allStats.noOfUsers;
      users.push(msg.sender);
    }

    // Update global and user statistics
    allStats.noOfUserCreatedPools += 1;
    totalCreatedPoolIds.push(poolId);
    userStats[msg.sender].noOfPoolsCreated += 1;
    userCreatedPoolIds[msg.sender].push(poolId);

    // Update fee statistics
    if (creationFeeAmount > 0) {
      userPaidCreatedPoolIds[msg.sender].push(poolId);
      allStats.noOfUserPaidPoolCreations += 1;
      userStats[msg.sender].noOfPaidCreationFeesPools += 1;
      creationFeesTokenInfos[creationFeeToken].totalUseCount += 1;
      creationFeesTokenInfos[creationFeeToken].totalAmountUsed += creationFeeAmount;

      // Update user creation token fees info
      if (userCreationTokenFeesInfo[msg.sender][creationFeeToken].count == 0) {
        userStats[msg.sender].noOfCreationFeeTokens += 1;
        userPoolCreationFeesTokens[msg.sender].push(creationFeeToken);
      }
      userCreationTokenFeesInfo[msg.sender][creationFeeToken].amount += creationFeeAmount;
      userCreationTokenFeesInfo[msg.sender][creationFeeToken].count += 1;
    }

    // Store user created pool details
    userCreatedPools[poolId] = UserCreatedPool({
      creator: msg.sender,
      completionFeesToken: stakeToken,
      creationFeesToken: creationFeeToken,
      nthPoolCount: userStats[msg.sender].noOfPoolsCreated,
      creationTime: block.timestamp,
      creationFeesAmount: creationFeeAmount,
      completionTime: 0,
      creatorClaimTime: 0,
      completionFeesAmount: 0,
      completionFeesPercent: allConfig.completionPoolFeesSplitPercent,
      multiplier: multiplier,
      isUnlisted: isUnlisted
    });
  }

  /// @notice Processes completion fees for a completed pool
  /// @param poolId The pool ID that was completed
  function processPoolCompletion(uint256 poolId) external nonReentrant {
    // Verify pool is completed in main Castora
    Pool memory pool = castora().getPool(poolId);
    if (pool.completionTime == 0) revert PoolNotYetCompleted();

    // Get the total fees. Following is Same logic as is in Castora.completePool
    uint256 totalFees = (pool.seeds.stakeAmount * pool.noOfPredictions) - (pool.winAmount * pool.noOfWinners);

    // Get the corresponding UserCreatedPool struct
    UserCreatedPool storage userPool = userCreatedPools[poolId];

    // If the pool wasn't created by an external user, send out the fees to castora's
    // fee collector (that's if that's not yet done before)
    if (userPool.creator == address(0)) {
      if (nonUserPoolHasCollectedFees[poolId]) revert PoolCompletionAlreadyProcessed();

      _sendToCastoraFeeCollectorInComplete(totalFees, pool.seeds.stakeToken);
      nonUserPoolHasCollectedFees[poolId] = true;
      return;
    }

    // if we are still here, then it is a user created pool
    // Check if pool completion was already processed and revert if so
    if (userPool.completionTime != 0) revert PoolCompletionAlreadyProcessed();

    // compute user's share and castora's share
    uint256 userShare = (totalFees * userPool.completionFeesPercent) / 10000;
    uint256 castoraShare = totalFees - userShare;

    // payout Castora's share to fee collector
    if (castoraShare > 0) {
      _sendToCastoraFeeCollectorInComplete(castoraShare, pool.seeds.stakeToken);
    }

    // update state for user's share payout. user will come and claim themselves
    if (userShare > 0) _updatePoolCompletionStats(poolId, userPool.creator, pool.seeds.stakeToken, userShare);

    // update user pool data, marking it as processed. also emit event.
    userPool.completionTime = block.timestamp;
    userPool.completionFeesAmount = userShare;
    emit IssuedCompletionFees(poolId, pool.seeds.stakeToken, userShare);
  }

  /// @notice Internal function to update statistics after pool completion
  /// @param poolId The ID of the completed pool
  /// @param user The address of the pool creator
  /// @param completionFeeToken The token used for completion fees
  /// @param userShare The amount of completion fees allocated to the user
  function _updatePoolCompletionStats(uint256 poolId, address user, address completionFeeToken, uint256 userShare)
    internal
  {
    // Update global stats
    allStats.noOfClaimableFeesPools += 1;
    totalClaimablePoolIds.push(poolId);
    if (completionFeesTokenInfos[completionFeeToken].totalUseCount == 0) {
      allStats.noOfCompletionFeesTokens += 1;
      completionFeesTokens.push(completionFeeToken);
    }
    completionFeesTokenInfos[completionFeeToken].totalUseCount += 1;
    completionFeesTokenInfos[completionFeeToken].totalAmountIssued += userShare;

    // Update user stats
    userStats[user].noOfClaimableCompletionFeesPools += 1;
    userClaimableFeesPoolIds[user].push(poolId);
    if (userCompletionTokenFeesInfo[user][completionFeeToken].count == 0) {
      userStats[user].noOfCompletionFeeTokens += 1;
      userPoolCompletionFeesTokens[user].push(completionFeeToken);
    }
    userCompletionTokenFeesInfo[user][completionFeeToken].count += 1;
    userCompletionTokenFeesInfo[user][completionFeeToken].claimableAmount += userShare;
  }

  /// @notice Sends fees to castora fee collector
  /// @param amount Amount to send
  /// @param token Token address
  function _sendToCastoraFeeCollectorInCreate(uint256 amount, address token) internal {
    if (amount == 0) return;
    // native token payment is when the main castora is used
    if (token == address(this)) {
      (bool isSuccess,) = payable(allConfig.feeCollector).call{value: amount}('');
      if (!isSuccess) revert UnsuccessfulFeeCollection();
    } else {
      IERC20(token).safeTransfer(allConfig.feeCollector, amount);
    }
  }

  /// @notice Sends fees to castora fee collector
  /// @param amount Amount to send
  /// @param token Token address
  function _sendToCastoraFeeCollectorInComplete(uint256 amount, address token) internal {
    if (amount == 0) return;
    // native token payment is when the main castora is used
    if (token == allConfig.castora) {
      (bool isSuccess,) = payable(allConfig.feeCollector).call{value: amount}('');
      if (!isSuccess) revert UnsuccessfulFeeCollection();
    } else {
      IERC20(token).safeTransfer(allConfig.feeCollector, amount);
    }
  }

  /// @notice Claims completion fees for a pool created by the caller
  /// @param poolId The ID of the pool to claim completion fees for
  /// @dev Only the pool creator can claim fees. Pool must be completed and fees not yet claimed.
  function claimPoolCompletionFees(uint256 poolId) external nonReentrant whenNotPaused {
    _claimPoolCompletionFees(poolId);
  }

  /// Claims completions fees of the provided pools by the caller
  /// @param poolIds Array of pool IDs to claim their completion fees
  /// @dev Only the pool creator can claim fees. Pool must be completed and fees not yet claimed.
  function claimPoolCompletionFeesBulk(uint256[] calldata poolIds) external nonReentrant whenNotPaused {
    for (uint256 i = 0; i < poolIds.length; i += 1) {
      _claimPoolCompletionFees(poolIds[i]);
    }
  }

  function _claimPoolCompletionFees(uint256 poolId) internal {
    UserCreatedPool storage pool = userCreatedPools[poolId];
    if (pool.creator != msg.sender) revert NotYourPool();
    if (pool.completionTime == 0) revert PoolNotYetCompleted();
    if (pool.creatorClaimTime != 0) revert AlreadyClaimedCompletionFees();
    if (pool.completionFeesAmount == 0) revert ZeroAmountSpecified();

    // Transfer the fees
    // native token payment is when the main castora is used
    if (pool.completionFeesToken == allConfig.castora) {
      (bool isSuccess,) = payable(msg.sender).call{value: pool.completionFeesAmount}('');
      if (!isSuccess) revert UnsuccessfulSendCompletionFees();
    } else {
      IERC20(pool.completionFeesToken).safeTransfer(msg.sender, pool.completionFeesAmount);
    }

    // Update state and statistics
    pool.creatorClaimTime = block.timestamp;
    _updateClaimStats(poolId, pool.creator, pool.completionFeesToken, pool.completionFeesAmount);
    emit ClaimedCompletionFees(poolId, msg.sender, pool.completionFeesToken, pool.completionFeesAmount);
  }

  /// @notice Internal function to update statistics when completion fees are claimed
  /// @param poolId The ID of the pool where fees were claimed
  /// @param user The address of the user claiming the fees
  /// @param completionFeeToken The token used for completion fees
  /// @param claimedAmount The amount of completion fees being claimed
  function _updateClaimStats(uint256 poolId, address user, address completionFeeToken, uint256 claimedAmount) internal {
    // Update global stats
    allStats.noOfClaimedFeesPools += 1;
    allStats.noOfClaimableFeesPools -= 1;
    totalClaimedPoolIds.push(poolId);
    _removeFromArray(totalClaimablePoolIds, poolId);
    completionFeesTokenInfos[completionFeeToken].totalAmountClaimed += claimedAmount;

    // Update user stats
    userStats[user].noOfClaimedCompletionFeesPools += 1;
    userStats[user].noOfClaimableCompletionFeesPools -= 1;
    userClaimedFeesPoolIds[user].push(poolId);
    _removeFromArray(userClaimableFeesPoolIds[user], poolId);
    userCompletionTokenFeesInfo[user][completionFeeToken].claimedAmount += claimedAmount;
    userCompletionTokenFeesInfo[user][completionFeeToken].claimableAmount -= claimedAmount;
  }

  /// @notice Internal helper to remove an element from a uint256 array while preserving order
  /// @param array The array to modify
  /// @param value The value to remove
  function _removeFromArray(uint256[] storage array, uint256 value) internal {
    for (uint256 i = 0; i < array.length; i++) {
      if (array[i] == value) {
        // Shift all elements after the found index one position left
        for (uint256 j = i; j < array.length - 1; j++) {
          array[j] = array[j + 1];
        }
        array.pop();
        break;
      }
    }
  }
}
