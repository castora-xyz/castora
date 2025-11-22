// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

/// Defines all custom error types used across the Castora ecosystem.
/// Provides consistent error handling and gas-efficient reverts throughout the system.
contract CastoraErrors {
  error AlreadyClaimedCompletionFees();
  error AlreadyClaimedWinnings();
  error CastoraAddressNotSet();
  error CreationFeeTokenAlreadyDisallowed();
  error CreationFeeTokenNotAllowed();
  error IncorrectCreationFeeValue();
  error IncorrectStakeValue();
  error InsufficientCreationFeeValue();
  error InsufficientStakeValue();
  error InvalidAddress();
  error InvalidActivityId();
  error InvalidRecordHash();
  error InvalidPoolCompletionBatchSize();
  error InvalidPoolFeesPercent();
  error InvalidPoolId();
  error InvalidPoolTimes();
  error InvalidPoolTimeInterval();
  error InvalidPoolMultiplier();
  error InvalidPredictionId();
  error InvalidSplitFeesPercent();
  error InvalidTimeRange();
  error InvalidWinnersCount();
  error NoPredictionsInPool();
  error NotAWinner();
  error NotYetSnapshotTime();
  error NotYourPool();
  error NotYourPrediction();
  error PoolAlreadyCompleted();
  error PoolCompletionAlreadyInitiated();
  error PoolCompletionAlreadyProcessed();
  error PoolCompletionBatchesAllProcessed();
  error PoolCompletionBatchesNotAllProcessed();
  error PoolCompletionNotInitiated();
  error PoolExistsAlready();
  error PoolNotYetCompleted();
  error PredictionAlreadyMarkedAsWinner(uint256 predictionId);
  error PredictionTokenNotAllowed();
  error StakeTokenNotAllowed();
  error StakeAmountNotAllowed();
  error UnauthorizedActivityLogger();
  error UnsuccessfulCreationFeeCollection();
  error UnsuccessfulFeeCollection();
  error UnsuccessfulSendCompletionFees();
  error UnsuccessfulSendWinnings();
  error WindowHasClosed();
  error ZeroAmountSpecified();
  error UnmatchingPoolsAndPredictions();
}
