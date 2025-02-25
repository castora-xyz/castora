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

### Deploy

```shell
$ source .env

# Deploying to Sepolia
$ forge script --chain sepolia script/DeployCUSD.s.sol:DeployCUSD --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv
$ forge script --chain sepolia script/DeployCastora.s.sol:DeployCastora --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv

# Deploying to Monad Devnet 
$ forge script script/DeployCUSD.s.sol:DeployCUSD --rpc-url $MONAD_DEVNET_RPC_URL --broadcast -vvvv
$ forge script script/DeployCastora.s.sol:DeployCastora --rpc-url $MONAD_DEVNET_RPC_URL --broadcast -vvvv

# Deploying to Monad Testnet
$ forge script script/DeployCUSD.s.sol:DeployCUSD --rpc-url $MONAD_TESTNET_RPC_URL --broadcast -vvvv
$ forge script script/DeployCastora.s.sol:DeployCastora --rpc-url $MONAD_TESTNET_RPC_URL --broadcast -vvvv

# Upgrading in Monad Testnet
$ forge script script/UpgradeCastora.s.sol:UpgradeCastora --rpc-url $MONAD_TESTNET_RPC_URL \
  --broadcast -vvvv --verify --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org \
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
