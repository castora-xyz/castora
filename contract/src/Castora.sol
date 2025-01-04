// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

error AlreadyClaimedWinnings();
error InsufficientStakeValue();
error InvalidAddress();
error InvalidPoolId();
error InvalidPoolTimes();
error InvalidPredictionId();
error InvalidWinnersCount();
error NoPredictionsInPool();
error NotAWinner();
error NotYetSnapshotTime();
error NotYourPrediction();
error PoolAlreadyCompleted();
error PoolExistsAlready();
error PoolNotYetCompleted();
error UnsuccessfulFeeCollection();
error UnsuccessfulSendWinnings();
error UnsuccessfulStaking();
error WindowHasClosed();
error ZeroAmountSpecified();

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
}

/// @title A pool is where participants make predictions.
/// @notice A pool is uniquely identified by its numeric poolId and
/// seeds struct. At the point when a pool is created, the poolId
/// corresponds to the current {noOfPools}.
struct Pool {
  /// A hash of the {seeds}. Helps with fetching a poolId.
  bytes32 seedsHash;
  /// The numeric id of this pool. It matches the nth pool that was ever
  /// created.
  uint256 poolId;
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

/// @title Rewards participants' accuracy in predicting prices of tokens.
/// @notice Participants predict what the price of a predictionToken will be at
/// a future snapshotTime. When predicting, they have to stake some funds.
/// After snapshotTime, those whose predictedPrices are closest to the token's
/// price are the winners of the {Pool}. They go with all the pool's money or
/// rather they each go with almost twice of what they initially staked.
contract Castora is
  Initializable,
  OwnableUpgradeable,
  AccessControlUpgradeable,
  ReentrancyGuardUpgradeable,
  UUPSUpgradeable
{
  /// An address to which all winner fees are sent to.
  address public feeCollector;
  /// Keeps tracks of the total number of pools that have ever been created.
  uint256 public noOfPools;
  /// Keeps track of the total number of predictions that have ever been made.
  uint256 public totalNoOfPredictions;
  /// Keeps track of the total number of predictions that claimed their winnings.
  uint256 public totalNoOfClaimedWinningsPredictions;
  /// Specifies the role that allow perculiar addresses to call the
  /// {takeSnapshot} function.
  bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
  /// Maximum decimal points for prediction prices.
  uint8 public constant PREDICTION_DECIMALS = 8;
  /// Maximum decimal points for prediction prices.
  uint8 public constant WINNER_FEE_PERCENT = 5;
  /// All pools that were ever created against their poolIds.
  mapping(uint256 => Pool) public pools;
  /// All poolseeds of created pools against their poolIds.
  mapping(uint256 => PoolSeeds) public poolSeeds;
  /// All poolIds against the hash of their seeds. Helps when there is a
  /// need to fetch a poolId.
  mapping(bytes32 => uint256) public poolIdsBySeedsHashes;
  /// Keeps track of the noOfPools that a participant with a given address
  /// has ever joined.
  mapping(address => uint256) public noOfJoinedPoolsByAddresses;
  /// Keeps track of the poolIds that a participant with a given address
  /// has ever joined.
  mapping(address => uint256[]) public joinedPoolIdsByAddresses;
  /// Keeps track of predictions in pools by their predictionIds.
  mapping(uint256 => mapping(uint256 => Prediction)) predictions;
  /// Keeps track of predictions in pools by the predicter's address.
  /// Helps in fetching predictions made by participants.
  mapping(uint256 => mapping(address => uint256[])) predictionIdsByAddresses;
  /// Keeps track of total ever staked amount per token.
  mapping(address => uint256) public totalStakedAmounts;
  /// Keeps track of total ever claimed amount per token.
  mapping(address => uint256) public totalClaimedWinningsAmounts;

  fallback() external payable {}

  receive() external payable {}

  function initialize(address feeCollector_) public initializer {
    feeCollector = feeCollector_;
    __Ownable_init(msg.sender);
    __AccessControl_init();
    __ReentrancyGuard_init();
    __UUPSUpgradeable_init();
    _grantRole(DEFAULT_ADMIN_ROLE, owner());
    _grantRole(ADMIN_ROLE, owner());
  }

  function _authorizeUpgrade(address newImpl) internal override onlyOwner {}

  /// Sets the address of the `feeCollector` to the provided `newFeeCollector`.
  function setFeeCollector(address newFeeCollector) public onlyOwner {
    if (newFeeCollector == address(0)) revert InvalidAddress();
    feeCollector = newFeeCollector;
  }

  /// Grants the {ADMIN_ROLE} to the provided `admin` address.
  function grantAdminRole(address admin) public onlyOwner {
    if (admin == address(0)) revert InvalidAddress();
    _grantRole(ADMIN_ROLE, admin);
  }

  /// Revokes the {ADMIN_ROLE} from the provided `admin` address.
  function revokeAdminRole(address admin) public onlyOwner {
    if (admin == address(0)) revert InvalidAddress();
    _revokeRole(ADMIN_ROLE, admin);
  }

  /// Withdraws the specified `amount` of the provided `token` to the {owner}.
  /// If the provided `token` is this contract's address, ETH is withdrawn.
  function withdraw(address token, uint256 amount) public onlyOwner {
    if (token == address(0)) revert InvalidAddress();
    if (amount == 0) revert ZeroAmountSpecified();
    if (token == address(this)) (payable(owner()).call{value: amount}(''));
    else IERC20(token).transfer(owner(), amount);
  }

  /// Returns the {PoolSeeds} of the {Pool} with the provided `poolId`.
  /// Fails if the provided `poolId` is invalid.
  function getPoolSeeds(uint256 poolId) public view returns (PoolSeeds memory seeds) {
    if (poolId == 0 || poolId > noOfPools) revert InvalidPoolId();
    seeds = poolSeeds[poolId];
  }

  /// Returns the {Pool} with the provided `poolId`. Fails if the provided
  /// `poolId` is invalid.
  function getPool(uint256 poolId) public view returns (Pool memory pool) {
    if (poolId == 0 || poolId > noOfPools) revert InvalidPoolId();
    pool = pools[poolId];
  }

  /// Returns the {Prediction} with the corresponding `predictionId` that was
  /// made in the {Pool} with the provided `poolId`.
  ///
  /// Fails if either the provided `poolId` or `predictionId` are invalid.
  function getPrediction(uint256 poolId, uint256 predictionId) public view returns (Prediction memory prediction) {
    if (poolId == 0 || poolId > noOfPools) revert InvalidPoolId();
    Pool storage pool = pools[poolId];
    if (predictionId == 0 || predictionId > pool.noOfPredictions) {
      revert InvalidPredictionId();
    }
    prediction = predictions[poolId][predictionId];
  }

  /// Returns the predictionIds that made by the participant with address
  /// `predicter` in {Pool} with the provided `poolId`.
  function getPredictionIdsForAddress(uint256 poolId, address predicter)
    public
    view
    returns (uint256[] memory predictionIds)
  {
    if (predicter == address(0)) revert InvalidAddress();
    if (poolId == 0 || poolId > noOfPools) revert InvalidPoolId();
    predictionIds = predictionIdsByAddresses[poolId][predicter];
  }

  /// Returns a hash of the provided `seeds`.
  function hashPoolSeeds(PoolSeeds memory seeds) public pure returns (bytes32) {
    return keccak256(
      abi.encodePacked(
        seeds.predictionToken, seeds.stakeToken, seeds.stakeAmount, seeds.windowCloseTime, seeds.snapshotTime
      )
    );
  }

  /// Creates a {Pool} with the provided `seeds`.
  ///
  /// Fails if any of the {PoolSeeds} properties are invalid or if there
  /// is a pool with the same `seeds`.
  ///
  /// Emits a {CreatedPool} event.
  function createPool(PoolSeeds memory seeds) public onlyRole(ADMIN_ROLE) nonReentrant returns (uint256) {
    if (seeds.predictionToken == address(0)) revert InvalidAddress();
    if (seeds.stakeToken == address(0)) revert InvalidAddress();
    if (seeds.stakeAmount == 0) revert ZeroAmountSpecified();
    if (block.timestamp > seeds.windowCloseTime) revert WindowHasClosed();
    if (seeds.windowCloseTime > seeds.snapshotTime) revert InvalidPoolTimes();

    bytes32 seedsHash = hashPoolSeeds(seeds);
    if (poolIdsBySeedsHashes[seedsHash] != 0) revert PoolExistsAlready();

    noOfPools += 1;
    poolIdsBySeedsHashes[seedsHash] = noOfPools;
    poolSeeds[noOfPools] = seeds;
    Pool storage pool = pools[noOfPools];
    pool.poolId = noOfPools;
    pool.seedsHash = seedsHash;

    emit CreatedPool(noOfPools, seedsHash);
    return noOfPools;
  }

  /// Makes a prediction with the provided `predictionPrice` in the {Pool}
  /// with the provided `poolId`.
  ///
  /// By calling this function, the predicter
  /// effectively joins the pool. Also, the {PoolSeeds-stakeAmount} of the
  /// {PoolSeeds-stakeToken} of the pool will be deducted from the predicter.
  ///
  /// Emits a {Predicted} event.
  function predict(uint256 poolId, uint256 predictionPrice) public payable nonReentrant returns (uint256) {
    if (poolId == 0 || poolId > noOfPools) revert InvalidPoolId();
    Pool storage pool = pools[poolId];
    PoolSeeds storage seeds = poolSeeds[poolId];
    if (block.timestamp > seeds.windowCloseTime) revert WindowHasClosed();

    if (seeds.stakeToken == address(this)) {
      if (msg.value < seeds.stakeAmount) revert InsufficientStakeValue();
    } else {
      if (!IERC20(seeds.stakeToken).transferFrom(msg.sender, address(this), seeds.stakeAmount)) {
        revert UnsuccessfulStaking();
      }
    }

    totalNoOfPredictions += 1;
    totalStakedAmounts[seeds.stakeToken] += seeds.stakeAmount;
    pool.noOfPredictions += 1;
    predictions[poolId][pool.noOfPredictions] =
      Prediction(msg.sender, poolId, pool.noOfPredictions, predictionPrice, block.timestamp, 0, false);

    predictionIdsByAddresses[poolId][msg.sender].push(pool.noOfPredictions);
    noOfJoinedPoolsByAddresses[msg.sender] += 1;
    joinedPoolIdsByAddresses[msg.sender].push(poolId);

    emit Predicted(poolId, pool.noOfPredictions, msg.sender, predictionPrice);
    return pool.noOfPredictions;
  }

  /// Sets the {Pool-snapshotPrice}, {Pool-noOfWinners}, {Pool-winAmount},
  /// and {Pool-winnerPredictions} of the {Pool} with the provided `poolId`.
  ///
  /// Emits a {CompletedPool} event.
  function completePool(
    uint256 poolId,
    uint256 snapshotPrice,
    uint256 noOfWinners,
    uint256 winAmount,
    uint256[] memory winnerPredictions
  ) public nonReentrant onlyRole(ADMIN_ROLE) {
    if (poolId == 0 || poolId > noOfPools) revert InvalidPoolId();
    Pool storage pool = pools[poolId];
    if (pool.completionTime != 0) revert PoolAlreadyCompleted();
    PoolSeeds storage seeds = poolSeeds[poolId];
    if (block.timestamp < seeds.snapshotTime) revert NotYetSnapshotTime();
    if (pool.noOfPredictions == 0) revert NoPredictionsInPool();
    if (noOfWinners == 0) revert InvalidWinnersCount();
    if (noOfWinners > pool.noOfPredictions) revert InvalidWinnersCount();
    if (noOfWinners != winnerPredictions.length) revert InvalidWinnersCount();
    if (winAmount == 0) revert ZeroAmountSpecified();

    uint256 fees = (seeds.stakeAmount * pool.noOfPredictions) - (winAmount * noOfWinners);
    bool isSuccess = false;
    if (seeds.stakeToken == address(this)) {
      (isSuccess,) = payable(feeCollector).call{value: fees}('');
    } else {
      isSuccess = IERC20(seeds.stakeToken).transfer(feeCollector, fees);
    }
    if (!isSuccess) revert UnsuccessfulFeeCollection();

    pool.snapshotPrice = snapshotPrice;
    pool.completionTime = block.timestamp;
    pool.noOfWinners = noOfWinners;
    pool.winAmount = winAmount;
    for (uint256 i = 0; i < noOfWinners; i += 1) {
      predictions[poolId][winnerPredictions[i]].isAWinner = true;
    }

    emit CompletedPool(poolId, seeds.snapshotTime, snapshotPrice, pool.winAmount, noOfWinners);
  }

  /// Awards the predicter who made the {Prediction} with `predictionId` in
  /// the {Pool} with `poolId` if the {Prediction-predictionPrice} is among
  /// the {Pool-winnerPrediction}s.
  ///
  /// Fails if the pool has not yet been completed, if the caller is not the
  /// predicter, if the predicter is not a winner, or if the predicter has
  /// already claimed their winnings.
  ///
  /// Emits an {ClaimedWinnings} event.
  function claimWinnings(uint256 poolId, uint256 predictionId) public nonReentrant {
    if (poolId == 0 || poolId > noOfPools) revert InvalidPoolId();

    Pool storage pool = pools[poolId];
    if (pool.completionTime == 0) revert PoolNotYetCompleted();
    if (predictionId == 0 || predictionId > pool.noOfPredictions) {
      revert InvalidPredictionId();
    }

    Prediction storage prediction = predictions[poolId][predictionId];
    if (prediction.predicter != msg.sender) revert NotYourPrediction();
    if (!prediction.isAWinner) revert NotAWinner();
    if (prediction.claimedWinningsTime != 0) revert AlreadyClaimedWinnings();

    bool isSuccess = false;
    PoolSeeds storage seeds = poolSeeds[poolId];
    if (seeds.stakeToken == address(this)) {
      (isSuccess,) = payable(prediction.predicter).call{value: pool.winAmount}('');
    } else {
      isSuccess = IERC20(seeds.stakeToken).transfer(prediction.predicter, pool.winAmount);
    }
    if (!isSuccess) revert UnsuccessfulSendWinnings();

    totalNoOfClaimedWinningsPredictions += 1;
    totalClaimedWinningsAmounts[seeds.stakeToken] += pool.winAmount;
    pool.noOfClaimedWinnings += 1;
    prediction.claimedWinningsTime = block.timestamp;

    emit ClaimedWinnings(
      poolId, predictionId, prediction.predicter, seeds.stakeToken, seeds.stakeAmount, pool.winAmount
    );
  }
}
