// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

contract CastoraErrors {
  error AlreadyClaimedCompletionFees();
  error AlreadyClaimedWinnings();
  error CreationFeeTokenAlreadyDisallowed();
  error CreationFeeTokenNotAllowed();
  error IncorrectCreationFeeValue();
  error IncorrectStakeValue();
  error InsufficientCreationFeeValue();
  error InsufficientStakeValue();
  error InvalidAddress();
  error InvalidPoolId();
  error InvalidPoolTimes();
  error InvalidPoolTimeInterval();
  error InvalidPoolMultiplier();
  error InvalidPredictionId();
  error InvalidSplitFeesPercent();
  error InvalidWinnersCount();
  error NoPredictionsInPool();
  error NotAWinner();
  error NotYetSnapshotTime();
  error NotYourPool();
  error NotYourPrediction();
  error PoolAlreadyCompleted();
  error PoolCompletionAlreadyProcessed();
  error PoolExistsAlready();
  error PoolNotYetCompleted();
  error PredictionTokenNotAllowed();
  error StakeTokenNotAllowed();
  error StakeAmountNotAllowed();
  error UnsuccessfulCreationFeeCollection();
  error UnsuccessfulFeeCollection();
  error UnsuccessfulSendCompletionFees();
  error UnsuccessfulSendWinnings();
  error WindowHasClosed();
  error ZeroAmountSpecified();
  error UnmatchingPoolsAndPredictions();
}
