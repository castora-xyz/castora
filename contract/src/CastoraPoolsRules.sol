// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import './Castora.sol';

error InvalidPoolTimeInterval();
error InvalidPoolMultiplier();
error PredictionTokenNotAllowed();
error StakeTokenNotAllowed();
error StakeAmountNotAllowed();

/// Emitted when a stake token's allowed status is updated.
event UpdatedAllowedStakeToken(address indexed token, bool allowed);

/// Emitted when a prediction token's allowed status is updated.
event UpdatedAllowedPredictionToken(address indexed token, bool allowed);

/// Emitted when a specific stake amount's allowed status is updated for a token.
event UpdatedAllowedStakeAmount(address indexed token, uint256 amount, bool allowed);

/// Emitted when a specific multiplier's allowed status is updated for a pool.
event UpdatedAllowedPoolMultiplier(uint16 multiplier, bool allowed);

/// Emitted when the required time interval for pool timing validation is updated.
event UpdatedRequiredTimeInterval(uint256 oldInterval, uint256 newInterval);

/// @title CastoraPoolsRules - Pool Creation and Validation Rules for Castora
/// @notice This upgradeable contract manages validation rules and permissions for pool creation in the Castora protocol.
/// It controls which tokens can be used for staking and predictions, what stake amounts are allowed,
/// and enforces timing constraints for pool windows and snapshots.
/// @dev The contract is upgradeable using UUPS pattern and includes comprehensive validation functions
/// that can either revert on failure or return boolean results for integration flexibility.
/// @custom:oz-upgrades-from build-info-ref:CastoraPoolsRules
contract CastoraPoolsRules is Initializable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
  /// Required time interval in seconds for pool timing validation
  uint256 public requiredTimeInterval;
  /// Counter for the number of stake tokens that have ever been allowed
  uint256 public everAllowedStakeTokensCount;
  /// Counter for the number of prediction tokens that have ever been allowed
  uint256 public everAllowedPredictionTokensCount;
  /// Counter for the number of stake tokens that are currently allowed
  uint256 public currentlyAllowedStakeTokensCount;
  /// Counter for the number of prediction tokens that are currently allowed
  uint256 public currentlyAllowedPredictionTokensCount;
  /// Array of all stake tokens that have ever been allowed
  address[] public everAllowedStakeTokens;
  /// Array of all prediction tokens that have ever been allowed
  address[] public everAllowedPredictionTokens;
  /// Array of stake tokens that are currently allowed
  address[] public currentlyAllowedStakeTokens;
  /// Array of prediction tokens that are currently allowed
  address[] public currentlyAllowedPredictionTokens;
  /// Tracks which tokens are allowed for staking
  mapping(address => bool) public allowedStakeTokens;
  /// Tracks which tokens are allowed for predictions
  mapping(address => bool) public allowedPredictionTokens;
  /// Tracks which stake amounts are allowed per token
  mapping(address => mapping(uint256 => bool)) public allowedStakeAmounts;
  /// Tracks if a stake token has ever been added to everAllowedStakeTokens (prevents duplicates)
  mapping(address => bool) public hasEverBeenAllowedStakeToken;
  /// Tracks if a prediction token has ever been added to everAllowedPredictionTokens (prevents duplicates)
  mapping(address => bool) public hasEverBeenAllowedPredictionToken;
  /// Maps each currently allowed stake token to its index in currentlyAllowedStakeTokens (for efficient removal)
  mapping(address => uint256) public currentlyAllowedStakeTokenIndex;
  /// Maps each currently allowed prediction token to its index in currentlyAllowedPredictionTokens (for efficient removal)
  mapping(address => uint256) public currentlyAllowedPredictionTokenIndex;
  /// Maps allowed multipliers for pools, 2 decimal places (e.g. 150 = 1.5x)
  mapping(uint16 => bool) public allowedPoolMultipliers; 
  /// Tracks if a multiplier has ever been added to allowedPoolMultipliers (prevents duplicates)
  mapping(uint16 => bool) public hasEverBeenAllowedPoolMultiplier;
  /// Array of all multipliers that have ever been allowed
  uint16[] public everAllowedPoolMultipliers;
  /// Counter for the number of multipliers that have ever been allowed
  uint256 public everAllowedPoolMultipliersCount;
  /// Counter for the number of multipliers that are currently allowed
  uint256 public currentlyAllowedPoolMultipliersCount;
  /// Maps each currently allowed multiplier to its index in currentlyAllowedPoolMultipliers (for efficient removal)
  mapping(uint16 => uint256) public currentlyAllowedPoolMultiplierIndex;
  /// Array of multipliers that are currently allowed
  uint16[] public currentlyAllowedPoolMultipliers;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize() public initializer {
    __Ownable_init(msg.sender);
    __UUPSUpgradeable_init();
    __ReentrancyGuard_init();
    requiredTimeInterval = 5 * 60; // 5 minutes default
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  /// Update the required time interval for pool times
  /// @param newInterval The new time interval in seconds
  function updateRequiredTimeInterval(uint256 newInterval) external onlyOwner nonReentrant {
    uint256 oldInterval = requiredTimeInterval;
    requiredTimeInterval = newInterval;
    emit UpdatedRequiredTimeInterval(oldInterval, newInterval);
  }

  /// Set whether a stake token is allowed
  /// @param token The token address
  /// @param allowed Whether the token is allowed
  function updateAllowedStakeToken(address token, bool allowed) external onlyOwner nonReentrant {
    bool wasAllowed = allowedStakeTokens[token];
    allowedStakeTokens[token] = allowed;

    // Track in ever allowed array if this is the first time it's being allowed
    if (allowed && !hasEverBeenAllowedStakeToken[token]) {
      everAllowedStakeTokens.push(token);
      hasEverBeenAllowedStakeToken[token] = true;
      everAllowedStakeTokensCount++;
    }

    // Update currently allowed arrays
    if (allowed && !wasAllowed) {
      // Adding to currently allowed
      currentlyAllowedStakeTokenIndex[token] = currentlyAllowedStakeTokens.length;
      currentlyAllowedStakeTokens.push(token);
      currentlyAllowedStakeTokensCount++;
    } else if (!allowed && wasAllowed) {
      // Removing from currently allowed
      uint256 indexToRemove = currentlyAllowedStakeTokenIndex[token];
      uint256 lastIndex = currentlyAllowedStakeTokens.length - 1;

      if (indexToRemove != lastIndex) {
        // Move the last element to the position of the element to remove
        address lastToken = currentlyAllowedStakeTokens[lastIndex];
        currentlyAllowedStakeTokens[indexToRemove] = lastToken;
        currentlyAllowedStakeTokenIndex[lastToken] = indexToRemove;
      }

      currentlyAllowedStakeTokens.pop();
      delete currentlyAllowedStakeTokenIndex[token];
      currentlyAllowedStakeTokensCount--;
    }

    emit UpdatedAllowedStakeToken(token, allowed);
  }

  /// Set whether a prediction token is allowed
  /// @param token The token address
  /// @param allowed Whether the token is allowed
  function updateAllowedPredictionToken(address token, bool allowed) external onlyOwner nonReentrant {
    bool wasAllowed = allowedPredictionTokens[token];
    allowedPredictionTokens[token] = allowed;

    // Track in ever allowed array if this is the first time it's being allowed
    if (allowed && !hasEverBeenAllowedPredictionToken[token]) {
      everAllowedPredictionTokens.push(token);
      hasEverBeenAllowedPredictionToken[token] = true;
      everAllowedPredictionTokensCount++;
    }

    // Update currently allowed arrays
    if (allowed && !wasAllowed) {
      // Adding to currently allowed
      currentlyAllowedPredictionTokenIndex[token] = currentlyAllowedPredictionTokens.length;
      currentlyAllowedPredictionTokens.push(token);
      currentlyAllowedPredictionTokensCount++;
    } else if (!allowed && wasAllowed) {
      // Removing from currently allowed
      uint256 indexToRemove = currentlyAllowedPredictionTokenIndex[token];
      uint256 lastIndex = currentlyAllowedPredictionTokens.length - 1;

      if (indexToRemove != lastIndex) {
        // Move the last element to the position of the element to remove
        address lastToken = currentlyAllowedPredictionTokens[lastIndex];
        currentlyAllowedPredictionTokens[indexToRemove] = lastToken;
        currentlyAllowedPredictionTokenIndex[lastToken] = indexToRemove;
      }

      currentlyAllowedPredictionTokens.pop();
      delete currentlyAllowedPredictionTokenIndex[token];
      currentlyAllowedPredictionTokensCount--;
    }

    emit UpdatedAllowedPredictionToken(token, allowed);
  }

  /// Set whether a specific stake amount is allowed for a token
  /// @param token The stake token address
  /// @param amount The stake amount
  /// @param allowed Whether this amount is allowed
  function updateAllowedStakeAmount(address token, uint256 amount, bool allowed) external onlyOwner nonReentrant {
    allowedStakeAmounts[token][amount] = allowed;
    emit UpdatedAllowedStakeAmount(token, amount, allowed);
  }

  /// Set whether a specific multiplier is allowed for pools
  /// @param multiplier The multiplier value
  /// @param allowed Whether this multiplier is allowed
  function updateAllowedPoolMultiplier(uint16 multiplier, bool allowed) external onlyOwner nonReentrant {
    bool wasAllowed = allowedPoolMultipliers[multiplier];
    allowedPoolMultipliers[multiplier] = allowed;

    // Track in ever allowed array if this is the first time it's being allowed
    if (allowed && !hasEverBeenAllowedPoolMultiplier[multiplier]) {
      everAllowedPoolMultipliers.push(multiplier);
      hasEverBeenAllowedPoolMultiplier[multiplier] = true;
      everAllowedPoolMultipliersCount++;
    }
    // Update currently allowed arrays
    if (allowed && !wasAllowed) {
      // Adding to currently allowed
      currentlyAllowedPoolMultiplierIndex[multiplier] = currentlyAllowedPoolMultipliers.length;
      currentlyAllowedPoolMultipliers.push(multiplier);
      currentlyAllowedPoolMultipliersCount++;
    } else if (!allowed && wasAllowed) {
      // Removing from currently allowed
      uint256 indexToRemove = currentlyAllowedPoolMultiplierIndex[multiplier];
      uint256 lastIndex = currentlyAllowedPoolMultipliers.length - 1;

      if (indexToRemove != lastIndex) {
        // Move the last element to the position of the element to remove
        uint16 lastMultiplier = currentlyAllowedPoolMultipliers[lastIndex];
        currentlyAllowedPoolMultipliers[indexToRemove] = lastMultiplier;
        currentlyAllowedPoolMultiplierIndex[lastMultiplier] = indexToRemove;
      }

      currentlyAllowedPoolMultipliers.pop();
      delete currentlyAllowedPoolMultiplierIndex[multiplier];
      currentlyAllowedPoolMultipliersCount--;
    }
    emit UpdatedAllowedPoolMultiplier(multiplier, allowed);
  }

  /// Validate pool timing rules
  /// @param windowCloseTime When the prediction window closes
  /// @param snapshotTime When the price snapshot is taken
  function validatePoolTimes(uint256 windowCloseTime, uint256 snapshotTime) external view {
    if (snapshotTime < windowCloseTime) revert InvalidPoolTimes();
    if (
      requiredTimeInterval != 0
        && (windowCloseTime % requiredTimeInterval != 0 || snapshotTime % requiredTimeInterval != 0)
    ) revert InvalidPoolTimeInterval();
  }

  /// Validate that stake token is allowed
  /// @param token The stake token address
  function validateStakeToken(address token) external view {
    if (!allowedStakeTokens[token]) revert StakeTokenNotAllowed();
  }

  /// Validate that prediction token is allowed
  /// @param token The prediction token address
  function validatePredictionToken(address token) external view {
    if (!allowedPredictionTokens[token]) revert PredictionTokenNotAllowed();
  }

  /// Validate that stake amount is allowed for the given token
  /// @param token The stake token address
  /// @param amount The stake amount
  function validateStakeAmount(address token, uint256 amount) external view {
    if (!allowedStakeAmounts[token][amount]) revert StakeAmountNotAllowed();
  }

  /// Validate that a pool multiplier is allowed
  /// @param multiplier The pool multiplier
  function validateMultiplier(uint16 multiplier) external view {
    if (!allowedPoolMultipliers[multiplier]) revert InvalidPoolMultiplier();
  }

  /// Comprehensive validation for pool creation using PoolSeeds
  /// @param seeds The PoolSeeds struct containing all pool parameters
  function validateCreatePool(PoolSeeds memory seeds) external view {
    if (!allowedStakeTokens[seeds.stakeToken]) revert StakeTokenNotAllowed();
    if (!allowedPredictionTokens[seeds.predictionToken]) revert PredictionTokenNotAllowed();
    if (!allowedStakeAmounts[seeds.stakeToken][seeds.stakeAmount]) revert StakeAmountNotAllowed();
    if (seeds.snapshotTime < seeds.windowCloseTime) revert InvalidPoolTimes();
    if (
      requiredTimeInterval != 0
        && (seeds.windowCloseTime % requiredTimeInterval != 0 || seeds.snapshotTime % requiredTimeInterval != 0)
    ) revert InvalidPoolTimeInterval();
  }

  /// Check if pool timing rules are valid without reverting
  /// @param windowCloseTime When the prediction window closes
  /// @param snapshotTime When the price snapshot is taken
  /// @return true if times are valid, false otherwise
  function isValidPoolTimes(uint256 windowCloseTime, uint256 snapshotTime) external view returns (bool) {
    if (snapshotTime < windowCloseTime) return false;
    if (
      requiredTimeInterval != 0
        && (windowCloseTime % requiredTimeInterval != 0 || snapshotTime % requiredTimeInterval != 0)
    ) return false;
    return true;
  }

  /// Check if stake token is allowed without reverting
  /// @param token The stake token address
  /// @return true if token is allowed, false otherwise
  function isValidStakeToken(address token) external view returns (bool) {
    return allowedStakeTokens[token];
  }

  /// Check if prediction token is allowed without reverting
  /// @param token The prediction token address
  /// @return true if token is allowed, false otherwise
  function isValidPredictionToken(address token) external view returns (bool) {
    return allowedPredictionTokens[token];
  }

  /// Check if stake amount is allowed for the given token without reverting
  /// @param token The stake token address
  /// @param amount The stake amount
  /// @return true if amount is allowed, false otherwise
  function isValidStakeAmount(address token, uint256 amount) external view returns (bool) {
    return allowedStakeAmounts[token][amount];
  }

  /// Check if a pool multiplier is allowed without reverting
  /// @param multiplier The pool multiplier
  /// @return true if multiplier is allowed, false otherwise
  function isValidMultiplier(uint16 multiplier) external view returns (bool) {  
    return allowedPoolMultipliers[multiplier];
  }

  /// Comprehensive validation check for pool creation using PoolSeeds without reverting
  /// @param seeds The PoolSeeds struct containing all pool parameters
  /// @return true if all validations pass, false otherwise
  function isValidCreatePool(PoolSeeds memory seeds) external view returns (bool) {
    if (!allowedStakeTokens[seeds.stakeToken]) return false;
    if (!allowedPredictionTokens[seeds.predictionToken]) return false;
    if (!allowedStakeAmounts[seeds.stakeToken][seeds.stakeAmount]) return false;
    if (seeds.snapshotTime < seeds.windowCloseTime) return false;
    if (
      requiredTimeInterval != 0
        && (seeds.windowCloseTime % requiredTimeInterval != 0 || seeds.snapshotTime % requiredTimeInterval != 0)
    ) return false;
    return true;
  }

  /// Get paginated tokens that have ever been allowed for staking
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of tokens to return
  /// @return tokens Array of stake tokens
  function getEverAllowedStakeTokensPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory tokens)
  {
    tokens = _paginateAddressArray(everAllowedStakeTokens, everAllowedStakeTokensCount, offset, limit);
  }

  /// Get paginated tokens that have ever been allowed for predictions
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of tokens to return
  /// @return tokens Array of prediction tokens
  function getEverAllowedPredictionTokensPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory tokens)
  {
    return _paginateAddressArray(everAllowedPredictionTokens, everAllowedPredictionTokensCount, offset, limit);
  }

  /// Get paginated tokens that are currently allowed for staking
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of tokens to return
  /// @return tokens Array of currently allowed stake tokens
  function getCurrentlyAllowedStakeTokensPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory tokens)
  {
    return _paginateAddressArray(currentlyAllowedStakeTokens, currentlyAllowedStakeTokensCount, offset, limit);
  }

  /// Get paginated tokens that are currently allowed for predictions
  /// @param offset Starting index for pagination
  /// @param limit Maximum number of tokens to return
  /// @return tokens Array of currently allowed prediction tokens
  function getCurrentlyAllowedPredictionTokensPaginated(uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory tokens)
  {
    return _paginateAddressArray(currentlyAllowedPredictionTokens, currentlyAllowedPredictionTokensCount, offset, limit);
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
}
