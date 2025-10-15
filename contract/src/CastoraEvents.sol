// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

contract CastoraEvents {
  /// Emitted when a {Pool} is created with `poolId` and `seedsHash`.
  event CreatedPool(uint256 indexed poolId, bytes32 indexed seedsHash);

  /// Emitted when a participant (with `predicter` address) joins a {Pool}
  /// with matching `poolId` with the new `predictionId` for a
  /// `predictionPrice`.
  event Predicted(
    uint256 indexed poolId, uint256 indexed predictionId, address indexed predicter, uint256 predictionPrice
  );

  /// Emitted when the {Pool} with `poolId` obtains what the price
  /// (`snapshotPrice`) of the `predictionToken` was at `snapshotTime`.
  event CompletedPool(
    uint256 indexed poolId, uint256 snapshotTime, uint256 snapshotPrice, uint256 winAmount, uint256 noOfWinners
  );

  /// Emitted when the address of predicter (now a `winner`) that made the
  /// {Prediction} with `predictionId` in a {Pool} with `poolId` claims
  /// the `awardedAmount` of the `stakeToken` for their initial `stakeAmount`.
  event ClaimedWinnings(
    uint256 indexed poolId,
    uint256 indexed predictionId,
    address indexed winner,
    address stakeToken,
    uint256 stakedAmount,
    uint256 wonAmount
  );

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

  /// Emitted when the current pool fees percentage from winnings is updated.
  event UpdatedCurrentPoolFeesPercent(uint16 oldPercent, uint16 newPercent);

  /// Emitted when the Castora contract address is updated
  /// @param oldCastora The previous Castora contract address
  /// @param newCastora The new Castora contract address
  event SetCastoraInPoolsManager(address indexed oldCastora, address indexed newCastora);

  /// Emitted when the CastoraPoolsRules contract address is updated
  /// @param oldPoolsRules The previous CastoraPoolsRules contract address
  /// @param newPoolsRules The new CastoraPoolsRules contract address
  event SetPoolsRulesInCastora(address indexed oldPoolsRules, address indexed newPoolsRules);

  /// Emitted when the fee collector address is updated
  /// @param oldFeeCollector The previous fee collector address
  /// @param newFeeCollector The new fee collector address
  event SetFeeCollector(address indexed oldFeeCollector, address indexed newFeeCollector);

  /// Emitted when the completion pool fees split percentage is updated
  /// @param oldPercentage The previous split percentage
  /// @param newPercentage The new split percentage
  event SetCreatorPoolCompletionFeesSplitPercent(uint256 oldPercentage, uint256 newPercentage);

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
  event ReceiveWasCalled(address indexed sender, uint256 amount);
}
