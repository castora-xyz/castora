// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

import '@openzeppelin/contracts/access/Ownable.sol';
import './Castora.sol';

error InvalidPoolTimeInterval();
error PredictionTokenNotAllowed();
error StakeTokenNotAllowed();
error StakeAmountNotAllowed();

/// Emitted when a stake token's allowed status is updated.
event UpdatedAllowedStakeToken(address indexed token, bool allowed);

/// Emitted when a prediction token's allowed status is updated.
event UpdatedAllowedPredictionToken(address indexed token, bool allowed);

/// Emitted when a specific stake amount's allowed status is updated for a token.
event UpdatedAllowedStakeAmount(address indexed token, uint256 amount, bool allowed);

/// Emitted when the required time interval for pool timing validation is updated.
event UpdatedRequiredTimeInterval(uint256 oldInterval, uint256 newInterval);

contract CastoraPoolsRules is Ownable {
  /// Required time interval in seconds for pool timing validation
  uint256 public requiredTimeInterval = 5 * 60;
  /// Tracks which tokens are allowed for staking
  mapping(address => bool) public allowedStakeTokens;
  /// Tracks which tokens are allowed for predictions
  mapping(address => bool) public allowedPredictionTokens;
  /// Tracks which stake amounts are allowed per token
  mapping(address => mapping(uint256 => bool)) public allowedStakeAmounts;

  constructor() Ownable(msg.sender) {}

  /// Update the required time interval for pool times
  /// @param newInterval The new time interval in seconds
  function updateRequiredTimeInterval(uint256 newInterval) external onlyOwner {
    uint256 oldInterval = requiredTimeInterval;
    requiredTimeInterval = newInterval;
    emit UpdatedRequiredTimeInterval(oldInterval, newInterval);
  }

  /// Set whether a stake token is allowed
  /// @param token The token address
  /// @param allowed Whether the token is allowed
  function updateAllowedStakeToken(address token, bool allowed) external onlyOwner {
    allowedStakeTokens[token] = allowed;
    emit UpdatedAllowedStakeToken(token, allowed);
  }

  /// Set whether a prediction token is allowed
  /// @param token The token address
  /// @param allowed Whether the token is allowed
  function updateAllowedPredictionToken(address token, bool allowed) external onlyOwner {
    allowedPredictionTokens[token] = allowed;
    emit UpdatedAllowedPredictionToken(token, allowed);
  }

  /// Set whether a specific stake amount is allowed for a token
  /// @param token The stake token address
  /// @param amount The stake amount
  /// @param allowed Whether this amount is allowed
  function updateAllowedStakeAmount(address token, uint256 amount, bool allowed) external onlyOwner {
    allowedStakeAmounts[token][amount] = allowed;
    emit UpdatedAllowedStakeAmount(token, amount, allowed);
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
}
