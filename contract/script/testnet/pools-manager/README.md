# CastoraPoolsManager Scripts

This directory contains deployment and management scripts for the CastoraPoolsManager contract.

## Scripts

### DeployCastoraPoolsManager.s.sol

Deploys a new CastoraPoolsManager contract using UUPS proxy pattern.

**Required Environment Variables:**

- `CASTORA_OWNER_KEY`: Private key of the contract owner
- `CASTORA_ADDRESS`: Address of the deployed Castora contract
- `POOLS_RULES_ADDRESS`: Address of the deployed CastoraPoolsRules contract
- `FEE_COLLECTOR_ADDRESS`: Address that will collect fees for Castora
- `COMPLETION_FEES_SPLIT_PERCENT`: Split percentage for completion pool fees (10000 = 100%)

**Usage:**

```bash
forge script script/pools-manager/DeployCastoraPoolsManager.s.sol --rpc-url $RPC_URL --broadcast --verify --verifier sourcify -vvv
```

### UpgradeCastoraPoolsManager.s.sol

Upgrades an existing CastoraPoolsManager proxy to a new implementation.

**Required Environment Variables:**

- `CASTORA_OWNER_KEY`: Private key of the contract owner
- `POOLS_MANAGER_PROXY_ADDRESS`: Address of the existing CastoraPoolsManager proxy

**Usage:**

```bash
forge script script/pools-manager/UpgradeCastoraPoolsManager.s.sol --rpc-url $RPC_URL --broadcast --verify --verifier sourcify -vvv
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Network Configuration
RPC_URL=https://your-rpc-endpoint

# Account Configuration
CASTORA_OWNER_KEY=0x...

# Contract Addresses
CASTORA_ADDRESS=0x...
POOLS_RULES_ADDRESS=0x...
POOLS_MANAGER_PROXY_ADDRESS=0x...

# Configuration
FEE_COLLECTOR_ADDRESS=0x...
COMPLETION_FEES_SPLIT_PERCENT=2500  # 25% for example
```

## Deployment Flow

1. First deploy Castora contract (using `script/main/DeployCastora.s.sol`)
2. Deploy CastoraPoolsRules contract (using `script/pools-rules/DeployCastoraPoolsRules.s.sol`)
3. Deploy CastoraPoolsManager contract (using `script/pools-manager/DeployCastoraPoolsManager.s.sol`)
4. Update Castora fee collector to point to CastoraPoolsManager (using `script/main/UpdateFeeCollector.s.sol`)
