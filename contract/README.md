# Castora - Contract

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
