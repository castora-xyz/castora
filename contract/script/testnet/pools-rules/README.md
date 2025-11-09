# CastoraPoolsRules Scripts

This folder contains scripts for deploying and managing the CastoraPoolsRules contract.

## Scripts Overview

### Deployment & Upgrade Scripts

- **DeployCastoraPoolsRules.s.sol**: Deploys a new CastoraPoolsRules proxy contract
- **UpgradeCastoraPoolsRules.s.sol**: Upgrades an existing CastoraPoolsRules proxy contract

### Management Scripts

- **UpdatePredictionToken.s.sol**: Updates the allowed status of a prediction token
- **AllowStakeToken.s.sol**: Marks a stake token as allowed with a specified minimum stake amount
- **UpdatePoolTimeInterval.s.sol**: Updates the required time interval for pool timing validation

## Environment Variables Required

### For Deployment

```bash
CASTORA_OWNER_KEY=<private_key_of_contract_owner>
```

### For Upgrades

```bash
CASTORA_OWNER_KEY=<private_key_of_contract_owner>
CASTORA_POOLS_RULES_PROXY=<address_of_deployed_proxy_contract>
```

### For Token Management

```bash
CASTORA_OWNER_KEY=<private_key_of_contract_owner>
CASTORA_POOLS_RULES_PROXY=<address_of_deployed_proxy_contract>

# For prediction token updates
PREDICTION_TOKEN_ADDRESS=<address_of_prediction_token>
PREDICTION_TOKEN_ALLOWED=<true_or_false>

# For stake token updates
STAKE_TOKEN_ADDRESS=<address_of_stake_token>
STAKE_TOKEN_ALLOWED=<true_or_false>

# For stake amount updates
STAKE_TOKEN_ADDRESS=<address_of_stake_token>
STAKE_AMOUNT=<amount_in_wei>
STAKE_AMOUNT_ALLOWED=<true_or_false>

# For time interval updates
REQUIRED_TIME_INTERVAL=<interval_in_seconds>
```

## Usage Examples

### Deploy CastoraPoolsRules

```bash
forge script script/pools-rules/DeployCastoraPoolsRules.s.sol:DeployCastoraPoolsRules --rpc-url <rpc_url> --broadcast -vvv --verifier sourcify --verify --chain 10143
```

### Upgrade CastoraPoolsRules

```bash
forge script script/pools-rules/UpgradeCastoraPoolsRules.s.sol:UpgradeCastoraPoolsRules --rpc-url <rpc_url> --broadcast -vvv --verifier sourcify --verify --chain <chain_id>
```

### Allow a Prediction Token

```bash
export PREDICTION_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890
export PREDICTION_TOKEN_ALLOWED=true
forge script script/pools-rules/UpdatePredictionToken.s.sol:UpdatePredictionToken --rpc-url <rpc_url> --broadcast -vvv --chain <chain_id> 
```

### Allow a Stake Token

```bash
export STAKE_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890
export STAKE_TOKEN_ALLOWED=true
forge script script/pools-rules/UpdateStakeToken.s.sol:UpdateStakeToken --rpc-url <rpc_url> --broadcast -vvv --chain <chain_id>
```

### Allow a Specific Stake Amount

```bash
export STAKE_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890
export STAKE_AMOUNT=1000000
export STAKE_AMOUNT_ALLOWED=true
forge script script/pools-rules/UpdateStakeAmount.s.sol:UpdateStakeAmount --rpc-url <rpc_url> --broadcast -vvv --chain <chain_id>
```

### Update Time Interval (e.g., to 10 minutes)

```bash
export REQUIRED_TIME_INTERVAL=600
forge script script/pools-rules/UpdatePoolTimeInterval.s.sol:UpdatePoolTimeInterval --rpc-url <rpc_url> --broadcast -vvv --chain <chain_id>
```

## Notes

- All scripts require the `CASTORA_OWNER_KEY` environment variable to be set with the private key of the contract owner
- Management scripts require the `CASTORA_POOLS_RULES_PROXY` environment variable to be set with the deployed proxy contract address
- Time intervals are specified in seconds (e.g., 300 = 5 minutes, 600 = 10 minutes)
- Stake amounts should be specified in the token's smallest unit (wei for ETH, considering decimals for ERC20 tokens)
- Use `--dry-run` flag to simulate transactions without broadcasting them
