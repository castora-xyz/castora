# Castora - Contract

Castora lets you earn rewards for your price predictions. It’s a decentralized platform where you can compete in price pools and win based on your prediction accuracy. You can also create your own price pools with custom rules. For more details, visit the [main Castora README](../README.md).

This `contract` folder contains the Solidity smart contracts for Castora. The architecture is modular and has separate contracts for various purposes.

## Table of Contents

- [Modularization](#modularization)
- [How Contracts Interact](#how-contracts-interact)
- [Data and State](#data-and-state)
- [Supporting Various Tokens](#supporting-various-tokens)
- [About Fees](#about-fees)
- [Testing](#testing)
- [Upgradeability](#upgradeability)
- [Security](#security)

## Modularization

Castora Contracts are split across multiple files. Each file has a unique contract that serves a specific purpose. Altogether, these contracts make the system work. Additionally, this design makes the codebase easier to understand, test, and maintain.

The following is a table of the contracts and what they are/do:

| Contract                                                     | Purpose                                                                                                                                                                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**Castora.sol**](./src/Castora.sol)                         | Main contract for creating pool, predicting, completing pools, and claiming winnings.                                                                                              |
| [**CastoraState.sol**](./src/CastoraState.sol)               | Abstract contract defining all state variables for the main Castora contract. The Getters contract use CastoraState as the template to access state variables in the main Castora. |
| [**CastoraGetters.sol**](./src/CastoraGetters.sol)           | Dedicated contract for view functions and pagination support for the main Castora contract. Split out of main Castora to solve the max. size issue of Solidity contracts.          |
| [**CastoraPoolsManager.sol**](./src/CastoraPoolsManager.sol) | Handles user-created pools, fee collection for pool creation, and splitting pool completion fee with pool creators.                                                                |
| [**CastoraPoolsRules.sol**](./src/CastoraPoolsRules.sol)     | Manages validation rules and constraints for pool creation (allowed tokens, stake amounts, timing, etc.)                                                                           |
| [**CastoraActivities.sol**](./src/CastoraActivities.sol)     | Logs all user activities across Castora and PoolsManager for chronological activity records                                                                                        |
| [**CastoraStructs.sol**](./src/CastoraStructs.sol)           | Defines all data structures (Pool, Prediction, PoolSeeds, etc.) used throughout Castora.                                                                                           |
| [**CastoraErrors.sol**](./src/CastoraErrors.sol)             | Contains all custom error definitions for consistent error handling.                                                                                                               |
| [**CastoraEvents.sol**](./src/CastoraEvents.sol)             | Defines all on-chain events emitted by the contracts.                                                                                                                              |

## How Contracts Interact

The foundation contracts: CastoraErrors, CastoraEvents, and CastoraStructs; define the base types, error messages, and events used everywhere else. Other contracts extend or import them as needed, even tests.

CastoraState contains all state variable definitions for the main Castora contract. The main Castora contract extends CastoraState and builds on that state layout. By having CastoraState defining all state variables, CastoraGetters can use them to promptly expose getter and paginated functions without reference to the main Castora contract.

CastoraPoolsRules is a gatekeeper for pool creation. It defines what tokens are allowed for predictions and staking, which stake amounts are valid, what timing constraints are valid, valid pool multipliers and valid pools' fees percentages. The `createPool` function in the main Castora contract first calls PoolsRules to validate all parameters before proceeding to create and store the pool irrespective of whether the pool is user-created or admin/system-created.

The main Castora contract handles pool creation, user predictions, pool completions, and claiming winnings. When users call `predict` or `bulkPredict`, they provide a predictionPrice and their stake amount is collected either via native token or ERC20 transfer. During pool completion, the winners are determined based on price accuracy and funds are distributed proportionally. Winners can come and claim their winnings anytime. The prediction/winnings funds are stored in the main Castora contract.

CastoraPoolsManager works alongside the main Castora contract but focuses on user-created pools. Users interact with PoolsManager to create their own pools by paying creation fees. PoolsManager tracks pool ownership and lets creators claim completion fees after their pools finish. It has separate state variables and its own getter functions. The creator-claimable fees are stored in the PoolsManager contract. When pools are completed in Castora, the collected completion fees are sent to PoolsManager for either a distribution between Castora and the pool creator (if user-created) or full allocation to Castora (if admin-created).

CastoraActivities logs every action across both Castora and PoolsManager contracts. When someone creates a pool, makes a prediction, completes a pool, claims winnings or claims pool completion fees, CastoraActivities records it with timestamps and enough context to retrieve the action details. This creates a complete chronological record for displaying global or user history.

CastoraGetters provides specialized query functions for the main Castora contract. In development, the main Castora contract went big in code size (above the 24kb Solidity limit). It also needed all the getter and pagination functions for easy data retrieval. Separating these query functions to CastoraGetters solved the size issue. In addition, since the contract's name is "getters", all its functions omitted the "get" prefix for brevity.

In summary,

- Errors, Events, Structs, and State are base layers.
- PoolsRules validates pool seeds.
- Castora is core and validates pool creation with PoolsRules.
- PoolsManager handles user-created pools and distributes completion fees.
- Activities log all actions across Castora and PoolsManager.
- Getters provides query access to Castora state.

## Data and State

Data is as important as the actions themselves. Users need to see everything they did and query it in different ways. Based on testnet iterations, we kept improving data structures to suit this onchain prediction model. Every interaction creates queryable records that frontends can display comprehensively.

We track every necessary piece of information in both the main Castora and the PoolsManager contracts. In both contracts, there are state variables which are either structs, arrays, or mappings. They also have necessary counters for the involved data types. There are dedicated getters for retrieving all that rich data. State changes update multiple tracking structures simultaneously. Data storage occurs at two levels: both globally and per-user. For example:

```solidity
// In CastoraState.sol

// ...
/// Global statistics for all pools and users
AllPredictionStats public allStats;

// ...
/// Array of predictionRecords stored globally
bytes32[] public predictionRecordHashes;

// ...
/// Keeps track of user addresses to their activity info
mapping(address => UserPredictionStats stats) public userStats;

// ...
/// Keeps track of user addresses to the records of their predictions
mapping(address => bytes32[]) public userPredictionRecords;
// ...
```

Castora and PoolsManager both store claimable winnings and claimable pool completion fees directly in contract state. Users can bulk claim these funds efficiently. Without storing claimables, client code would need to manually fetch all user predictions or created pools and check which are claimable.

Getter functions either return one struct, multiple structs, or paginated data. Every list or array query uses pagination. Even if you want one item, use the paginator - it serves both single and multiple purposes. Using getters ensures that clients get data in the same format as they are defined in the contract. Otherwise, they will obtain contract data as arrays of primitive types which is hard to work with. The names of getters are consistent to help with easy understanding.

For every action that changes state, an event is emitted with all relevant parameters. All events are defined in [`CastoraEvents.sol`](./src/CastoraEvents.sol).

CastoraActivities logs every action across both Castora and PoolsManager contracts. Among other properties of each activity, there is an `activityType` and `refGlobalCount` that makes it easy to locate exactly which activity is being referenced in the `sourceContract`. The `refGlobalCount` points to a counter in either Castora or PoolsManager that represents the nth occurrence of that activity type globally. Following are activity types to their corresponding `refGlobalCount` code sources:

| ActivityType              | refGlobalCount                                    |
| ------------------------- | ------------------------------------------------- |
| POOL_CREATED              | `poolId`                                          |
| NEW_USER_ACTIVITY         | `(Castora / PoolsManager).allStats.noOfUsers`     |
| USER_HAS_CREATED_POOL     | `PoolsManager.allStats.noOfUserCreatedPools`      |
| PREDICTED                 | `Castora.allStats.noOfPredictions`                |
| POOL_COMPLETION_INITIATED | `poolId`                                          |
| POOL_COMPLETED            | `poolId`                                          |
| CLAIMED_WINNINGS          | `Castora.allStats.noOfClaimedWinnings`            |
| CLAIMED_COMPLETION_FEES   | `PoolsManager.allStats.noOfClaimedCompletionFees` |

Pool IDs are numerically increasing in the main Castora contract. As such they serve as the `refGlobalCount` on pool creation and completion activities. Pool IDs are also used like this because creating, initiating completion of, and completing pools, all can happen only once per pool. So only one activity will have a unique combo of the matching activity type with the involved pool ID. Furthermore, at creation time, the pool ID represents `Castora.allStats.noOfPools`.

Regarding pool completions or settlements, they cannot be fully computed on-chain due to blockchain execution limits. Comparing all predictions with the snapshot price requires too many loops that exceed block limits. In order to still achieve the intended functionality, computing winners securely takes place off-chain in our [open-source server code](../server). In turn, the winners are set into the contract with appropriate on-chain methods.

Only admin addresses can call these winner-setting functions to ensure data integrity. Also, only the comparison and winner identification happens off-chain. Fee calculations and winAmount computations remain in the main Castora contract.

In addition, pool completion with the contract occurs across 3 functions because of execution limits:

a. `initiatePoolCompletion` - starts the process and sets snapshot price

b. `setWinnersInBatch` - sets winners in batches (can be called multiple times if needed)

c. `finalizePoolCompletion` - finalizes the completion, computes fees, and allows winners to claim winnings.

This batching approach lets us complete pools of any size, no matter how many predictions they contain.

## Supporting Various Tokens

Castora handles both native tokens and ERC20 tokens for staking and fee payments. The detection method is simple: if the token address equals the contract's own address (`address(this)`), it's treated as native token. Otherwise, it's an ERC20 token. In the case of native token (where the amount is sent via `msg.value`), we check that the sent value matches the expected stake amount exactly (no more, no less).

```solidity
if (seeds.stakeToken == address(this)) {
  if (msg.value < seeds.stakeAmount) revert InsufficientStakeValue();
  if (msg.value > seeds.stakeAmount) revert IncorrectStakeValue();
} else {
  IERC20(seeds.stakeToken).safeTransferFrom(msg.sender, address(this), seeds.stakeAmount);
}
```

All ERC20 token interactions use OpenZeppelin's SafeERC20 library. This protects against tokens with non-standard implementations that don't return boolean values. SafeERC20 handles these edge cases automatically and reverts on failed transfers.

For native token transfers out of contracts, we use the recommended `call` method with proper error handling:

```solidity
if (pool.seeds.stakeToken == address(this)) {
  (bool isSuccess,) = payable(prediction.predicter).call{value: pool.winAmount}('');
  if (!isSuccess) revert UnsuccessfulSendWinnings();
} else {
  IERC20(pool.seeds.stakeToken).safeTransfer(prediction.predicter, pool.winAmount);
}
```

CastoraPoolsRules defines which tokens are allowed for predictions and staking. Only whitelisted tokens can be used in pools. The rules contract also defines the minimum stake amounts per token.

When collecting fees, the same pattern applies. PoolsManager handles both native and ERC20 creation fees using identical detection logic. Fee transfers to PoolsManager also use the same native/ERC20 branching.

However, when paying out completion fees as native token from PoolsManager, the token address is actually Castora's contract address and not PoolsManager's. So we check `token == address(castora)` rather than `token == address(this)`.

## About Fees

Currently, fees are collected at two places:

1. Pool Creation Fee - paid by users when they create a pool through PoolsManager.
2. Pool Completion Fee - deducted from total staked amount when a pool is completed in the main Castora contract.

The PoolsManager defines some fixed creation fee amounts for different tokens. A user can create a pool by paying the creation fee in either native token or ERC20. This fee is adjustable by admin/system.

The `PoolSeeds` struct defines a `feesPercent` property which indicates the percentage of total staked amount of a pool that needs to be collected as fees from that pool during settlement (pool completion). This percentage is set at pool creation time and cannot be changed later. This percentage is defined in PoolsRules and validated during pool creation. When pools are created (either by users via PoolsManager or by admin/system via Castora), the provided `feesPercent` in the `PoolSeeds` must match the currently set percentage in PoolsRules.

If a pool was created by a user via PoolsManager, then during pool completion, the collected fees are split between Castora and the pool creator based on another percentage defined in `creatorCompletionFeesPercent` in `UserCreatedPool` struct in PoolsManager. This percentage indicates how much of the collected fees should go to the pool creator. The rest goes to the Castora `feeCollector` address. This percentage is originally defined in PoolsManager and copied over to the `UserCreatedPool` struct when the pool is created. This percentage is also adjustable by admin/system.

When a user creates a pool by calling the `CastoraPoolsManager.createPool` function, PoolsManager sends the received fees (if any, as fee can be zero) to the Castora `feeCollector` address. In addition, it calls the main `Castora.createPool` which in turn validates the provided `PoolSeeds` and creates the pool in Castora.

When an admin calls `Castora.initiatePoolCompletion` to start completing a pool, no fees are collected yet. The actual fee deduction happens in `Castora.finalizePoolCompletion` after all winners have been set. In this function, the fees are sent to the PoolsManager and the `CastoraPoolsManager.processPoolCompletion` function is called to split the fees accordingly.

Overall in Castora fees percentages are stored with 2 decimal place precision. For example, 200 means 2% and 150 means 1.5%. Also, these percentages are adjustable to allow for free activities or promotions.

```solidity
// In CastoraPoolsManager.processPoolCompletion

// ...
uint256 totalFees = pool.seeds.feesPercent * totalStaked / 10000; // feesPercent is in 2 decimal places

// ...
// compute user's share and castora's share
uint256 userShare = (totalFees * userPool.creatorCompletionFeesPercent) / 10000;
uint256 castoraShare = totalFees - userShare;
```

## Testing

Castora has comprehensive tests covering all functionalities in an end-to-end manner. The test suite covers complete user journeys from pool creation to winnings claims, ensuring the entire flow works correctly.

Tests are organized by contract functionality with dedicated test files for each major feature:

- `CastoraCreatePool.t.sol` - Pool creation validation and edge cases
- `CastoraPredict.t.sol` - User predictions and bulk predictions
- `CastoraCompletePool.t.sol` - Pool completion workflow and winner determination
- `CastoraClaim.t.sol` - Winnings claiming for single and bulk operations
- `CastoraOnlyOwner.t.sol` - Administrative functions and access control
- `CastoraPoolsManagerOnlyOwner.t.sol` - Administrative functions and access control for PoolsManager
- `CastoraPoolsManagerUserCreate.t.sol` - User pool creation with fee payments and validation
- `CastoraPoolsManagerUserClaim.t.sol` - User claiming of completion fees from pools they created
- `CastoraPoolsRules.t.sol` - Validation rules and constraint testing
- `CastoraActivities.t.sol` - Activity logging verification

Tests verify proper error handling, boundary conditions, and invalid input rejection. This includes testing with zero amounts, invalid addresses, unauthorized access attempts, among others.

Tests achieve near 100% code coverage across all contracts.

Tests use Foundry's testing framework with proper setup. Each test starts with a clean contract state and attempts to mirror actual user interactions. They verify that cross-contract interactions work correctly.

## Upgradeability

The major contracts (main Castora, PoolsManager, PoolsRules, and CastoraActivities) are upgradeable for bug fixes and feature enhancements without disrupting existing user data or requiring migration.

They use OpenZeppelin's UUPS (Universal Upgradeable Proxy Standard) proxy pattern. UUPS provides gas-efficient upgrades with upgrade authorization controlled by the implementation contract itself, not the proxy.

```solidity
// In each upgradeable contract
function _authorizeUpgrade(address newImpl) internal override onlyOwner {}
```

The modular contract structure facilitates targeted upgrades. Instead of upgrading everything at once, specific components can be upgraded independently where possible. For example, if only the PoolsRules logic needs enhancement, only that contract can be upgraded without touching the main Castora contract.

We use a multisig wallet as the `owner` of the contracts, ensuring that upgrades require multiple approvals for added security.

## Security

As a platform, Castora follows smart contract development best practices throughout the codebase. State-changing functions use access controls, input validation, and follow the checks-effects-interactions pattern.

In function calls, all inputs and state changes are validated before execution. Address checks prevent zero addresses, amount validations prevent invalid values, and timing checks ensure operations happen within valid windows.

OpenZeppelin libraries provide security and reliability:

- **AccessControl** - Role-based permissions for admin functions like in creating and completing pools
- **SafeERC20** - Protection against non-standard token implementations
- **Pausable** - Emergency pause mechanism for critical situations
- **UUPSUpgradeable** - Secure upgrade pattern with proper authorization
- **ReentrancyGuard** - Protection against reentrancy attacks

Role-based access control separates different functionalities. The contract `owner` handles upgrades and administrative settings. The `admin` role manages pool creations and pool completions in the main Castora contract. PoolsManager contract has this admin role that allows it to create pools for users after they pay the creation fee. In the main Castora contract, regular users can only call `predict` and `claim` related functions.

We use a multisig wallet as `owner` of the contracts. Multiple signatures are required for upgrades, admin role grants, and emergency actions.

All token transfers use SafeERC20 for ERC20 tokens and proper error handling for native token transfers.

Emergency pause mechanism allows immediate protocol suspension during security incidents. The `pause()` function stops all user operations while preserving funds and state integrity. Only the owner can pause/unpause the contracts.
