// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

contract CastoraStructs {
  /// Holds information about a given prediction in a pool.
  struct Prediction {
    /// The address of the person who made this prediction.
    address predicter;
    /// The numeric id of the pool in which this prediction was made.
    uint256 poolId;
    /// The numeric id of this prediction in the pool. It matches
    /// the nth prediction that was made in this pool.
    uint256 predictionId;
    /// The price that this predicter proposed when staking. It takes into
    /// account the decimals of the {PoolSeeds.predictionToken}.
    uint256 predictionPrice;
    /// The timestamp at which this prediction was made.
    uint256 predictionTime;
    /// When the predicter claimed their winnings.
    uint256 claimedWinningsTime;
    /// Whether this prediction was among the first half closest
    /// to the {PoolSeeds.predictionToken}'s price as of
    /// {PoolSeeds.snapshotTime}.
    bool isAWinner;
  }

  /// Holds information about the properties of a given pool.
  /// Uniquely identifies a pool alongside the pool's unique numeric poolId.
  struct PoolSeeds {
    /// The token whose price is been predicted in this pool.
    address predictionToken;
    /// The token that all participants in this pool must stake to make
    /// their predictions. It could be the same or different from the
    /// predictionToken.
    address stakeToken;
    /// The amount of the stakeToken that all participants must stake
    /// when predicting. It takes into account the stakeToken's decimals.
    uint256 stakeAmount;
    /// The timestamp for which pool participants speculate what the price
    /// of the predictionToken will be.
    uint256 snapshotTime;
    /// The timestamp at which no other participant can join this pool.
    /// This must be before or the same as snapshotTime.
    uint256 windowCloseTime;
    /// Percentage of win amount per winner prediction collected as fees
    uint16 feesPercent;
    // /// The ratio of win percentage in the pool, 2 decimal places (e.g 150 = 1.5x)
    uint16 multiplier;
    // /// Whether the pool is should be visible in the UI
    bool isUnlisted;
  }

  /// @title A pool is where participants make predictions.
  /// @notice A pool is uniquely identified by its numeric poolId and
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
    /// It is almost equal to twice of the {seeds-stakeAmount}.
    /// It takes into account the decimals of {seeds-stakeToken}.
    uint256 winAmount;
    /// The number of {winnerPredictions}. Helps in analysis.
    uint256 noOfWinners;
    /// The number of {claimedWinningsPredictions}. Helps in analysis.
    uint256 noOfClaimedWinnings;
  }

  /// Tracks global settings
  struct AllConfig {
    /// Address for main castora contract
    address castora;
    /// Address for fee collection
    address feeCollector;
    /// Split percentage for completion pool fees (with 2 decimal places: 10000 = 100%)
    uint16 creatorPoolCompletionFeesSplitPercent;
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
    uint16 creatorCompletionFeesPercent;
  }
}
