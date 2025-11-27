// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {Initializable} from '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import {PausableUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import {UUPSUpgradeable} from '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import {Castora} from './Castora.sol';
import {CastoraActivities} from './CastoraActivities.sol';
import {CastoraErrors} from './CastoraErrors.sol';
import {CastoraEvents} from './CastoraEvents.sol';
import {CastoraStructs} from './CastoraStructs.sol';

/// Manages user-created pools with fee collection and creator rewards system.
/// Users pay creation fees to create pools and receive completion fees when their pools finish.
/// @custom:oz-upgrades-from build-info-ref:CastoraPoolsManager
contract CastoraPoolsManager is
  CastoraErrors,
  CastoraEvents,
  CastoraStructs,
  Initializable,
  OwnableUpgradeable,
  ReentrancyGuardUpgradeable,
  PausableUpgradeable,
  UUPSUpgradeable
{
  using SafeERC20 for IERC20;

  /// Address for CastoraActivities contract
  address public activities;
  /// Address for main castora contract
  address public castora;
  /// Address for fee collection
  address public feeCollector;
  /// Split percentage for completion pool fees (with 2 decimal places: 10000 = 100%)
  uint16 public creatorPoolCompletionFeesSplitPercent;
  /// Global statistics for all pools and users
  AllUserCreatedPoolStats public allStats;
  /// Array of users who have created pools
  address[] public users;
  /// Array of all created pool IDs
  uint256[] public totalCreatedPoolIds;
  /// Array of all created pool IDs
  uint256[] public totalPaidCreatedPoolIds;
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
  mapping(address user => UserCreatedPoolStats stats) public userStats;
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

  /// Returns comprehensive statistics for all user-created pools and fees
  /// @return stats Global statistics including pool counts and fee tokens usage
  function getAllStats() external view returns (AllUserCreatedPoolStats memory stats) {
    return allStats;
  }

  /// Returns detailed information about a creation fee token
  /// @param token Address of the token to query
  /// @return info Token configuration and usage statistics for pool creation
  function getCreationFeesTokenInfo(address token) external view returns (CreationFeesTokenInfo memory info) {
    return creationFeesTokenInfos[token];
  }

  /// Returns detailed information about a completion fee token
  /// @param token Address of the token to query
  /// @return info Token statistics for pool completion rewards
  function getCompletionFeesTokenInfo(address token) external view returns (CompletionFeesTokenInfo memory info) {
    return completionFeesTokenInfos[token];
  }

  /// Gets user statistics
  /// @param user The user address to query
  /// @return stats The UserCreatedPoolStats struct for the user
  function getUserStats(address user) external view returns (UserCreatedPoolStats memory stats) {
    return userStats[user];
  }

  /// Gets multiple user statistics
  /// @param addresses The user addresses to query
  /// @return statsList Array of UserCreatedPoolStats structs for the users
  function getUserStatsBulk(address[] calldata addresses)
    external
    view
    returns (UserCreatedPoolStats[] memory statsList)
  {
    statsList = new UserCreatedPoolStats[](addresses.length);
    for (uint256 i = 0; i < addresses.length; i++) {
      statsList[i] = userStats[addresses[i]];
    }
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

  function getAllPaidCreatedPoolIdsPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory poolIds)
  {
    return _paginateUint256Array(totalPaidCreatedPoolIds, allStats.noOfUserPaidPoolCreations, offset, limit);
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

  receive() external payable {
    emit ReceiveWasCalled(msg.sender, msg.value);
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// Sets up this smart contract when it is deployed.
  /// @param activities_ The address of the CastoraActivities contract.
  /// @param feeCollector_ The address that will collect pool completion fees for Castora.
  /// @param splitPercent_ The split percentage for completion pool fees (10000 = 100%).
  function initialize(address activities_, address feeCollector_, uint16 splitPercent_) public initializer {
    if (activities_ == address(0)) revert InvalidAddress();
    if (feeCollector_ == address(0)) revert InvalidAddress();
    if (splitPercent_ > 10000) revert InvalidSplitFeesPercent();

    activities = activities_;
    feeCollector = feeCollector_;
    creatorPoolCompletionFeesSplitPercent = splitPercent_;

    __Ownable_init(msg.sender);
    __ReentrancyGuard_init();
    __Pausable_init();
    __UUPSUpgradeable_init();
  }

  function _authorizeUpgrade(address newImpl) internal override onlyOwner {}

  function pause() external onlyOwner nonReentrant whenNotPaused {
    _pause();
  }

  function unpause() external onlyOwner nonReentrant whenPaused {
    _unpause();
  }

  function setActivities(address _activities) external onlyOwner {
    if (_activities == address(0)) revert InvalidAddress();
    address oldActivities = activities;
    activities = _activities;
    emit SetActivitiesInPoolsManager(oldActivities, _activities);
  }

  /// Sets the Castora contract address
  /// @param _castora The new Castora contract address
  function setCastora(address _castora) external onlyOwner {
    if (_castora == address(0)) revert InvalidAddress();
    address oldCastora = castora;
    castora = _castora;
    emit SetCastoraInPoolsManager(oldCastora, _castora);
  }

  /// Sets the fee collector address
  /// @param _feeCollector The new fee collector address
  function setFeeCollector(address _feeCollector) external onlyOwner {
    if (_feeCollector == address(0)) revert InvalidAddress();
    address oldFeeCollector = feeCollector;
    feeCollector = _feeCollector;
    emit SetFeeCollector(oldFeeCollector, _feeCollector);
  }

  /// Updates the completion pool fees split percent
  /// @param _percentage Split percentage with 2 decimal places (10000 = 100%)
  function setCreatorPoolCompletionFeesSplitPercent(uint16 _percentage) external onlyOwner nonReentrant {
    if (_percentage > 10000) revert InvalidSplitFeesPercent();
    uint256 oldPercentage = creatorPoolCompletionFeesSplitPercent;
    creatorPoolCompletionFeesSplitPercent = _percentage;
    emit SetCreatorPoolCompletionFeesSplitPercent(oldPercentage, _percentage);
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

  function _checkNewUserOnCreate(uint256 poolId) internal {
    if (userStats[msg.sender].nthUserCount == 0) {
      allStats.noOfUsers += 1;
      userStats[msg.sender].nthUserCount = allStats.noOfUsers;
      users.push(msg.sender);
      emit NewUserCreatedPool(msg.sender, poolId, userStats[msg.sender].nthUserCount);
      CastoraActivities(activities).log(poolId, msg.sender, ActivityType.NEW_USER_ACTIVITY, allStats.noOfUsers);
    }
  }

  /// Internal function to update statistics after pool creation
  /// @param poolId The ID of the created pool
  /// @param stakeToken The stake token from pool seeds
  /// @param creationFeeToken The token used for creation fees
  /// @param creationFeeAmount The amount of creation fees paid
  function _updatePoolCreationStats(
    uint256 poolId,
    address stakeToken,
    address creationFeeToken,
    uint256 creationFeeAmount
  ) internal {
    // Update global and user statistics
    allStats.noOfUserCreatedPools += 1;
    totalCreatedPoolIds.push(poolId);
    userStats[msg.sender].noOfPoolsCreated += 1;
    userCreatedPoolIds[msg.sender].push(poolId);

    // Update fee statistics
    if (creationFeeAmount > 0) {
      totalPaidCreatedPoolIds.push(poolId);
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
      nthAllCreatedPoolsCount: allStats.noOfUserCreatedPools,
      nthCreatorPoolCount: userStats[msg.sender].noOfPoolsCreated,
      creationTime: block.timestamp,
      creationFeesAmount: creationFeeAmount,
      completionTime: 0,
      creatorClaimTime: 0,
      completionFeesAmount: 0,
      creatorCompletionFeesPercent: creatorPoolCompletionFeesSplitPercent
    });
  }

  /// Internal function to collect creation fees
  /// @param creationFeeToken The token to collect fees in
  /// @param creationFeeAmount The amount of fees collected
  function _collectCreationFee(address creationFeeToken, uint256 creationFeeAmount) internal {
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

  /// Sends fees to castora fee collector
  /// @param token Token address
  /// @param amount Amount to send
  function _sendToCastoraFeeCollectorInCreate(address token, uint256 amount) internal {
    if (amount == 0) return;
    // native token payment is when the main castora is used
    if (token == address(this)) {
      (bool isSuccess,) = payable(feeCollector).call{value: amount}('');
      if (!isSuccess) revert UnsuccessfulFeeCollection();
    } else {
      IERC20(token).safeTransfer(feeCollector, amount);
    }
  }

  /// Creates a new pool with the provided seeds and creation fee token
  /// @param seeds The PoolSeeds struct containing pool parameters
  /// @param creationFeeToken The token to pay creation fees with
  /// @return poolId The ID of the newly created pool
  function createPool(PoolSeeds memory seeds, address creationFeeToken)
    external
    payable
    nonReentrant
    whenNotPaused
    returns (uint256 poolId)
  {
    if (creationFeeToken == address(0)) revert InvalidAddress();

    // Check if creation fee token is allowed
    if (!creationFeesTokenInfos[creationFeeToken].isAllowed) revert CreationFeeTokenNotAllowed();

    if (castora == address(0)) revert CastoraAddressNotSet();
    poolId = Castora(castora).createPool(seeds);

    // Update statistics and user data
    _checkNewUserOnCreate(poolId);
    uint256 creationFeeAmount = creationFeesTokenInfos[creationFeeToken].amount;
    _updatePoolCreationStats(poolId, seeds.stakeToken, creationFeeToken, creationFeeAmount);
    emit UserHasCreatedPool(poolId, msg.sender, creationFeeToken, creationFeeAmount);
    CastoraActivities(activities).log(
      poolId, msg.sender, ActivityType.USER_HAS_CREATED_POOL, allStats.noOfUserCreatedPools
    );

    // Collect creation fee and create pool
    _collectCreationFee(creationFeeToken, creationFeeAmount);
    _sendToCastoraFeeCollectorInCreate(creationFeeToken, creationFeeAmount);
  }

  /// Internal function to update statistics after pool completion
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

  /// Sends fees to castora fee collector
  /// @param amount Amount to send
  /// @param token Token address
  function _sendToCastoraFeeCollectorInComplete(uint256 amount, address token) internal {
    if (amount == 0) return;
    // native token payment is when the main castora is used as it is the pool's stake token
    if (token == castora) {
      (bool isSuccess,) = payable(feeCollector).call{value: amount}('');
      if (!isSuccess) revert UnsuccessfulFeeCollection();
    } else {
      IERC20(token).safeTransfer(feeCollector, amount);
    }
  }

  /// Processes completion fees for a completed pool
  /// @param poolId The pool ID that was completed
  function processPoolCompletion(uint256 poolId) external nonReentrant {
    // Verify pool is completed in main Castora
    if (castora == address(0)) revert CastoraAddressNotSet();
    Pool memory pool = Castora(castora).getPool(poolId);
    if (pool.completionTime == 0) revert PoolNotYetCompleted();

    // Get the total fees. Following is Same logic as is in Castora.finalizePoolCompletion
    uint256 totalStaked = pool.seeds.stakeAmount * pool.noOfPredictions;
    uint256 totalFees = pool.seeds.feesPercent * totalStaked / 10000; // feesPercent is in 2 decimal places

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
    uint256 userShare = (totalFees * userPool.creatorCompletionFeesPercent) / 10000;
    uint256 castoraShare = totalFees - userShare;

    // update user pool data, marking it as processed. also emit event.
    userPool.completionTime = block.timestamp;
    userPool.completionFeesAmount = userShare;
    emit IssuedCompletionFees(poolId, pool.seeds.stakeToken, userShare);

    // update state for user's share payout. user will come and claim themselves
    if (userShare > 0) _updatePoolCompletionStats(poolId, userPool.creator, pool.seeds.stakeToken, userShare);

    // payout Castora's share to fee collector
    if (castoraShare > 0) {
      _sendToCastoraFeeCollectorInComplete(castoraShare, pool.seeds.stakeToken);
    }
  }

  /// Internal helper to remove an element from a uint256 array
  /// @param array The array to modify
  /// @param value The value to remove
  function _removeFromArray(uint256[] storage array, uint256 value) internal {
    for (uint256 i = 0; i < array.length; i++) {
      if (array[i] == value) {
        array[i] = array[array.length - 1];
        // Remove last element
        array.pop();
        break;
      }
    }
  }

  /// Internal function to update statistics when completion fees are claimed
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

  function _claimPoolCompletionFees(uint256 poolId) internal {
    UserCreatedPool storage pool = userCreatedPools[poolId];
    if (pool.creator != msg.sender) revert NotYourPool();
    if (pool.completionTime == 0) revert PoolNotYetCompleted();
    if (pool.creatorClaimTime != 0) revert AlreadyClaimedCompletionFees();
    if (pool.completionFeesAmount == 0) revert ZeroAmountSpecified();

    // Update state and statistics
    pool.creatorClaimTime = block.timestamp;
    _updateClaimStats(poolId, pool.creator, pool.completionFeesToken, pool.completionFeesAmount);
    emit ClaimedCompletionFees(poolId, msg.sender, pool.completionFeesToken, pool.completionFeesAmount);
    CastoraActivities(activities).log(
      poolId, msg.sender, ActivityType.CLAIMED_COMPLETION_FEES, allStats.noOfClaimedFeesPools
    );

    // Send the completion fees to the user
    // native token payment is when the main castora is used as that was the original stake token
    if (pool.completionFeesToken == castora) {
      (bool isSuccess,) = payable(msg.sender).call{value: pool.completionFeesAmount}('');
      if (!isSuccess) revert UnsuccessfulSendCompletionFees();
    } else {
      IERC20(pool.completionFeesToken).safeTransfer(msg.sender, pool.completionFeesAmount);
    }
  }

  /// Claims completion fees for a pool created by the caller
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
}
