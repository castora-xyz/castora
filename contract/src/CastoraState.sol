// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {CastoraErrors} from './CastoraErrors.sol';
import {CastoraStructs} from './CastoraStructs.sol';

/// Abstract contract containing all state variables for the main Castora contract.
/// This dedicated contract allows CastoraGetters contract to reference the storage layout of the 
/// main Castora contract without accessing the entire main Castora contract itself. 
/// The main Castora contract extends this CastoraState. 
abstract contract CastoraState is CastoraErrors, CastoraStructs {
  /// Address of the CastoraActivities contract for logging user actions and system events
  address public activities;

  /// Address of the CastoraPoolsManager contract that serves as feeCollector and processes pool completions
  address public poolsManager;

  /// Address of the CastoraPoolsRules contract for validating PoolSeeds on creation.
  address public poolsRules;

  /// Role identifier for addresses authorized to create or complete pools.
  bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');

  /// Aggregated statistics across all pools, users, predictions, and tokens in the main Castora contract
  AllPredictionStats public allStats;

  /// Array of all unique user addresses that have ever made predictions in any pool
  address[] public users;

  /// Array of all token addresses that have been used as prediction targets across any pool
  address[] public predictionTokens;

  /// Array of all token addresses that have been used for staking/payment across any pool
  address[] public stakeTokens;

  /// Array containing hashes of all prediction records in the main Castora contract
  bytes32[] public predictionRecordHashes;

  /// Array containing hashes of all winning prediction records across completed pools
  bytes32[] public winnerRecordHashes;

  /// Array containing hashes of all claimed winning prediction records
  bytes32[] public claimedRecordHashes;

  mapping(address => UserPredictionStats stats) public userStats;

  /// Maps user addresses to arrays of pool IDs they have participated in
  mapping(address => uint256[]) public joinedPoolIdsByAddresses;

  /// Maps user addresses to arrays of their prediction record hashes for activity tracking
  mapping(address => bytes32[]) public userPredictionRecords;

  /// Maps user addresses to arrays of their winning prediction record hashes
  mapping(address => bytes32[]) public winnerRecordHashesByAddresses;

  /// Maps user addresses to arrays of their unclaimed winning prediction record hashes
  mapping(address => bytes32[]) public claimableRecordHashesByAddresses;

  /// Maps prediction record hashes to their corresponding PredictionRecord data structures
  /// Enables efficient retrieval of prediction details from hashes stored in arrays
  mapping(bytes32 => PredictionRecord) public predictionRecords;

  /// Maps pool seed hashes to their assigned pool IDs to prevent duplicate pool creation
  mapping(bytes32 => uint256) public poolIdsBySeedsHashes;

  /// Maps pool IDs to their complete Pool data structures containing all pool information
  mapping(uint256 => Pool) public pools;

  /// Maps pool ID and prediction ID to complete Prediction data structures
  mapping(uint256 => mapping(uint256 => Prediction)) public predictions;

  /// Maps pool ID and user address to their specific statistics within that pool
  mapping(uint256 => mapping(address => UserInPoolPredictionStats)) public userInPoolPredictionStats;

  /// Maps pool ID and user address to arrays of prediction IDs they made in that pool
  mapping(uint256 => mapping(address => uint256[])) public predictionIdsByAddressesPerPool;

  /// Maps pool ID and user address to arrays of their winning prediction IDs in that pool
  mapping(uint256 => mapping(address => uint256[])) public winnerPredictionIdsByAddressesPerPool;

  /// Maps pool ID and user address to arrays of their unclaimed winning prediction IDs in that pool
  mapping(uint256 => mapping(address => uint256[])) public claimablePredictionIdsByAddressesPerPool;

  /// Maps prediction token addresses to their usage statistics across all pools
  mapping(address => PredictionTokenDetails) public predictionTokenDetails;

  /// Maps stake token addresses to their usage statistics across all pools and predictions
  mapping(address => StakeTokenDetails) public stakeTokenDetails;

  /// Maps user addresses to arrays of prediction token addresses they have ever used
  mapping(address => address[]) public userPredictionTokens;

  /// Maps user address and prediction token to user-specific usage statistics for that token
  mapping(address => mapping(address => PredictionTokenDetails)) public userPredictionTokenDetails;

  /// Maps user addresses to arrays of stake token addresses they have ever used for payments
  mapping(address => address[]) public userStakeTokens;

  /// Maps user address and stake token to user-specific usage statistics for that token
  mapping(address => mapping(address => StakeTokenDetails)) public userStakeTokenDetails;

  /// Maps user address and record hash to the index position in their claimable records array
  /// Enables efficient removal of claimed records using swap-and-pop pattern
  mapping(address => mapping(bytes32 => uint256)) public claimableRecordHashesIndex;

  /// Maps pool ID, user address, and prediction ID to index position in claimable predictions array
  /// Enables efficient removal of claimed predictions within specific pools
  mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public claimablePredictionIdsInPoolIndex;

  /// Maps pool IDs to boolean indicating if pool completion process has been started
  mapping(uint256 => bool) public hasPoolCompletionBeenInitiated;

  /// Maps pool IDs to the batch size used for processing winners during pool completion
  mapping(uint256 => uint256) public poolCompletionBatchSize;

  /// Maps pool IDs to the number of winner batches that have been successfully processed
  mapping(uint256 => uint256) public poolCompletionBatchesProcessed;
}
