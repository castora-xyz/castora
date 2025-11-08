// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {CastoraErrors} from './CastoraErrors.sol';
import {CastoraStructs} from './CastoraStructs.sol';

abstract contract CastoraState is CastoraErrors, CastoraStructs {
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
  /// Array of users who have predicted in pools
  address[] public users;
  /// Array of tokens ever used for predictions overall
  address[] public predictionTokens;
  /// Array of tokens ever used for staking overall
  address[] public stakeTokens;
  /// Array of predictionRecords stored globally
  bytes32[] public predictionRecordHashes;
  /// Array of won predictions
  bytes32[] public winnerRecordHashes;
  /// Array of claimed predictions
  bytes32[] public claimedRecordHashes;
  /// Keeps track of user addresses to their activity info
  mapping(address => UserPredictionStats stats) public userStats;
  /// Keeps track of user addresses to the number of unique pools they have joined
  mapping(address => uint256[]) public joinedPoolIdsByAddresses;
  /// Keeps track of user addresses to the records of their predictions
  mapping(address => bytes32[]) public userPredictionRecords;
  /// Keeps track of all winner predictions of the user across pools
  mapping(address => bytes32[]) public winnerRecordHashesByAddresses;
  /// Keeps track of all claimable predictions that the user can claim winnings
  mapping(address => bytes32[]) public claimableRecordHashesByAddresses;
  /// All PredictionRecords against the hash of the records.
  /// Helps in retrieving an activity from either the general context or
  /// when querying a user's chronological actions or getting their claimables.
  mapping(bytes32 => PredictionRecord) public predictionRecords;
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
  mapping(uint256 => mapping(address => uint256[])) public claimablePredictionIdsByAddressesPerPool;
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
  /// Maps each recordHash for the user's claimable to the right index
  mapping(address => mapping(bytes32 => uint256)) public claimableRecordHashesIndex;
  /// Maps each predictionId for the user's claimable to the right index in each pool
  mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public claimablePredictionIdsInPoolIndex;
  /// Tracks if a pool's completion has been initiated
  mapping(uint256 => bool) public hasPoolCompletionBeenInitiated;
  /// Tracks the total batch sizes for processing pool completion
  mapping(uint256 => uint256) public poolCompletionBatchSize;
  /// Tracks how many batches have been processed for each pool
  mapping(uint256 => uint256) public poolCompletionBatchesProcessed;
}
