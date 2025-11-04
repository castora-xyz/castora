// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

/// Defines all data structures used across the Castora prediction gaming system.
/// Contains structures for pools, predictions, user statistics, and activity tracking.
contract CastoraStructs {
  /// Contains all data for a single prediction made by a user in a pool
  struct Prediction {
    /// Address of the user who made this prediction
    address predicter;
    /// ID of the pool containing this prediction
    uint256 poolId;
    /// Sequential ID of this prediction within the pool
    uint256 predictionId;
    /// Price predicted by the user for the target token
    uint256 predictionPrice;
    /// Timestamp when this prediction was submitted
    uint256 predictionTime;
    /// Timestamp when winnings were claimed (0 if not claimed)
    uint256 claimedWinningsTime;
    /// Whether this prediction won based on accuracy to actual price
    bool isAWinner;
  }

  /// Configuration parameters that define a prediction pool
  struct PoolSeeds {
    /// Token whose price participants will predict
    address predictionToken;
    /// Token that participants must stake to join the pool
    address stakeToken;
    /// Required stake amount per prediction
    uint256 stakeAmount;
    /// Future timestamp when actual price will be measured
    uint256 snapshotTime;
    /// Deadline for joining the pool (must be <= snapshotTime)
    uint256 windowCloseTime;
    /// Fee percentage taken from total stakes (basis points)
    uint16 feesPercent;
    /// Determines winner ratio. Is in 2 decimal places (200 = 2x = top 50% win)
    uint16 multiplier;
    /// Whether pool should be hidden from public UI
    bool isUnlisted;
  }

  /// @title A pool is where participants make predictions.
  /// A pool is uniquely identified by its numeric poolId and
  /// seeds struct. At the point when a pool is created, the poolId
  /// corresponds to the current {noOfPools}.
  struct Pool {
    /// The numeric id of this pool. It matches the nth pool that was ever
    /// created.
    uint256 poolId;
    /// Details about constants of this pool.
    PoolSeeds seeds;
    /// A hash of the {seeds}. Helps with fetching a poolId.
    bytes32 seedsHash;
    /// When this pool was created.
    uint256 creationTime;
    /// Keeps track of the sum of predictions that were made in this pool.
    uint256 noOfPredictions;
    /// The price of {seeds-predictionToken} as of
    /// {seeds-snapshotTime}.
    uint256 snapshotPrice;
    /// When the {snapshotPrice} of this pool was taken.
    uint256 completionTime;
    /// The amount of the {seeds-stakeToken} that is winners claim.
    uint256 winAmount;
    /// The number of {winnerPredictions}. Helps in analysis.
    uint256 noOfWinners;
    /// The number of {claimedWinningsPredictions}. Helps in analysis.
    uint256 noOfClaimedWinnings;
  }

  /// Tracks global activity info
  struct AllPredictionStats {
    /// Total number of unique users who have interacted with pools
    uint256 noOfUsers;
    /// Total number of pools ever created by user or admin
    uint256 noOfPools;
    /// Total number of predictions ever made across all pools
    uint256 noOfPredictions;
    /// Total number of winnings predictions across all pools
    uint256 noOfWinnings;
    /// Total number of Claimable winning predictions across all pools
    uint256 noOfClaimableWinnings;
    /// Total number of claimed winnings across all pools
    uint256 noOfClaimedWinnings;
    /// Total number of unique tokens used for predictions
    uint256 noOfPredictionTokens;
    /// Total number of unique tokens used for staking
    uint256 noOfStakeTokens;
  }

  /// Tracks info about user activity in main Castora
  struct UserPredictionStats {
    /// The sequential number of when this user first made a creation
    uint256 nthUserCount;
    /// Total number of pools joined by this user
    uint256 noOfJoinedPools;
    /// Total number of predictions made by this user
    uint256 noOfPredictions;
    /// Total number of won predictions
    uint256 noOfWinnings;
    /// Total number of Claimable winning predictions across all pools
    uint256 noOfClaimableWinnings;
    /// Total number of claimed winnings across all pools
    uint256 noOfClaimedWinnings;
    /// Number of different tokens this user has used for prediction fees
    uint256 noOfPredictionTokens;
    /// Number of different tokens this user has used for staking fees
    uint256 noOfStakeTokens;
  }

  /// Tracks info about user predictions activity in a given pool
  struct UserInPoolPredictionStats {
    /// Total number of predictions in the pool
    uint256 noOfPredictions;
    /// Total number of won predictions
    uint256 noOfWinnings;
    /// Total number of Claimable winning predictions
    uint256 noOfClaimableWinnings;
    /// Total number of claimed winnings
    uint256 noOfClaimedWinnings;
  }

  /// Tracks info about pool and prediction activity of a user
  struct PredictionRecord {
    /// The ID of the pool in which the prediction was made
    uint256 poolId;
    /// The ID of the specific prediction made by the user
    uint256 predictionId;
  }

  /// Tracks info about tokens used for predictions generally
  struct PredictionTokenDetails {
    /// Total number of pools where this token has been used as a prediction token
    uint256 noOfPools;
    /// Total number of predictions made using this token as prediction token across all pools
    uint256 noOfPredictions;
  }

  /// Tracks info about tokens used for staking generally
  struct StakeTokenDetails {
    /// Total number of pools where this token has been used as a stake token
    uint256 noOfPools;
    /// Total number of predictions made using this token as stake across all pools
    uint256 noOfPredictions;
    /// Total number of winning predictions made with this token as stake
    uint256 noOfWinnings;
    /// Total number of Claimable winning predictions across all pools
    uint256 noOfClaimableWinnings;
    /// Total number of claimed winnings across all pools
    uint256 noOfClaimedWinnings;
    /// The total amount of the token used in predictions
    uint256 totalStaked;
    /// The total amount of the token won in predictions
    uint256 totalWon;
    /// The total amount available to be claimed
    uint256 totalClaimable;
    /// The total amount of the token claimed as winnings
    uint256 totalClaimed;
  }

  /// Tracks global activity info
  struct AllUserCreatedPoolStats {
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

  /// Tracks info about user activity in Pools Manager
  struct UserCreatedPoolStats {
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
    uint16 creatorCompletionFeesPercent;
  }

  /// Activity types that can be tracked
  enum ActivityType {
    POOL_CREATED, // Admin created pool (Castora)
    NEW_USER_ACTIVITY, // Either contracts
    USER_HAS_CREATED_POOL, // User created pool (CastoraPoolsManager)
    PREDICTED, // User made prediction (Castora)
    POOL_COMPLETION_INITIATED, // Pool completion started (Castora)
    POOL_COMPLETED, // Pool fully completed (Castora)
    CLAIMED_WINNINGS, // User claimed winnings (Castora)
    CLAIMED_COMPLETION_FEES // Creator claimed completion fees (CastoraPoolsManager)

  }

  /// Structure representing a single activity in the protocol
  struct CastoraActivity {
    uint256 timestamp; // Block timestamp when activity occurred
    uint256 poolId; // Related pool ID
    address user; // Primary actor of the activity
    ActivityType activityType; // Type of activity
    address sourceContract; // Contract that logged this activity
    uint256 refGlobalCount; // Reference count in source contract's global arrays
  }
}
