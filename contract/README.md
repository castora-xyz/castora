# Castora - Contract

## Allowed User Pool Rules

### Prediction Tokens

| Symbol | Address                                    |
| ------ | ------------------------------------------ |
| BTC    | 0x294C2647D9f3EacA43A364859c6E6a1E0E582DBD |
| ETH    | 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 |
| SOL    | 0xD31a59c85aE9D8edEFeC411D448f90841571b89c |
| HYPE   | 0x0ab0Dc55F747ADA00cC15D049CB654bbdc7d5AA6 |
| PUMP   | 0x046d5f90aCffC86BA3E77dA42095C982481F28eC |

### Stake Tokens

| Symbol | Address                                    |
| ------ | ------------------------------------------ |
| USDC   | 0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53 |

### Stake Amounts

- MON (0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53) 18 decimals
  - 0.2 MON, 0.5 MON, 1 MON, 1.5 MON, 2 MON, 2.5 MON, 5 MON, 10 MON.

## Testnet Contracts CHANGELOGs 

### Castora.sol

- v5: Sat 5th Oct 2025
  - Added getUserActivitiesPaginatedOptimized.

- v4 : Thu 2nd Oct 2025
  - Added Pagination Getters for Pools and Predictions.
  - Used PoolsManager as Fee Collector to enable Pools Manager to share with fees with user created pools.

- v3
  - Added bulkPredict function.

- v2
  - Added claimWinningsBulk function.

- v1
  - Initial version.

### CastoraPoolsManager.sol

- v3 : Thu 2nd Oct 2025
  - Fixed native token payout by checking main castora address in pay out token instead of address(this), that's the poolsManager contract itself.

- v2 : Thu 2nd Oct 2025
  - Added receive and fallback methods so that it can receive completePool's payout.

- v1
  - Initial version.

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy & Upgrading

After first deploy of a contract, copy out the contents of `out/build-info` into `deploys/...` directory.

When upgrading, create a `build-info-ref` and copy-in the contents of the reference subdirectory from `deploys/...` into this `build-info-ref` and use it to upgrade. It runs validation checks with OpenZeppelin. After successful upgrade, re-copy out the latest `out/build-info` contents to a new version folder in `deploys/...`. Remember to delete `build-info-ref` immediately to be sure to copy-in what's needed back later on, on a new upgrade.

Following are helpful commands.

```shell
$ source .env

# Deploying to Sepolia
$ forge script --chain sepolia script/DeployCUSD.s.sol:DeployCUSD --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvv
$ forge script --chain sepolia script/DeployCastora.s.sol:DeployCastora --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvv

# Deploying to Monad Devnet
$ forge script script/DeployCUSD.s.sol:DeployCUSD --rpc-url $MONAD_DEVNET_RPC_URL --broadcast -vvv
$ forge script script/DeployCastora.s.sol:DeployCastora --rpc-url $MONAD_DEVNET_RPC_URL --broadcast -vvv

# Deploying to Monad Testnet
$ forge script script/DeployCUSD.s.sol:DeployCUSD --rpc-url $MONAD_TESTNET_RPC_URL --broadcast -vvv
$ forge script script/DeployCastora.s.sol:DeployCastora --rpc-url $MONAD_TESTNET_RPC_URL --broadcast -vvv

# Upgrading in Monad Testnet
$ forge script script/main/UpgradeCastora.s.sol:UpgradeCastora --rpc-url $MONAD_TESTNET_RPC_URL \
  --broadcast -vvv --verify --verifier sourcify \
  --chain 10143
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
