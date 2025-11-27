// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import 'forge-std/Script.sol';
import '../../src/CastoraPoolsManager.sol';
import '../../src/CastoraPoolsRules.sol';

contract SetupRules is Script {
  // Contract addresses
  address constant CASTORA_ADDRESS = 0x9E1e6f277dF3f2cD150Ae1E08b05f45B3297bE6D;
  address constant CASTORA_POOLS_MANAGER_ADDRESS = 0xF8f179Ab96165b61833F2930309bCE9c6aB281bE;
  address constant CASTORA_POOLS_RULES_ADDRESS = 0xfacA692BfeaFB4c6DCaF95a25E5CBCDB65d6eC41;

  // Prediction token addresses
  // Gotten via different methods when in testnet
  address constant MON = CASTORA_ADDRESS; // Castora Contract Address as native token
  address constant USDC = 0x754704Bc059F8C67012fEd69BC8A327a5aafb603; // Circle USD
  address constant BTC = 0x294C2647D9f3EacA43A364859c6E6a1E0E582DBD; // Bitcoin
  address constant ETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // Ethereum
  address constant SOL = 0xD31a59c85aE9D8edEFeC411D448f90841571b89c; // Solana

  // Pool multipliers (2 decimal places: 200 = 2x, 300 = 3x, etc.)
  uint16 constant MLT2X = 200; // 2x
  uint16 constant MLT3X = 300; // 3x
  uint16 constant MLT4X = 400; // 4x
  uint16 constant MLT5X = 500; // 5x
  uint16 constant MLT10X = 1000; // 10x

  // Creation fee amount: 500 MON with 18 decimals
  uint256 constant MON_CREATION_FEE = 500 * 1e18;

  // Minimum stake amount: 100 MON with 18 decimals
  uint256 constant MON_MIN_STAKE = 100 * 1e18;

  // Minimum stake amount: 5 USDC with 6 decimals
  uint256 constant USDC_MIN_STAKE = 5 * 1e6;

  function run() public {
    CastoraPoolsManager poolsManager = CastoraPoolsManager(payable(CASTORA_POOLS_MANAGER_ADDRESS));
    CastoraPoolsRules poolsRules = CastoraPoolsRules(CASTORA_POOLS_RULES_ADDRESS);
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    // ===== Setup PoolsManager Creation Fees =====
    console.log('Setting up PoolsManager creation fees...');

    // Set creation fee for MON token
    poolsManager.setCreationFees(MON, MON_CREATION_FEE);
    console.log('Set creation fee for MON:', MON_CREATION_FEE);

    // ===== Setup PoolsRules =====
    console.log('Setting up PoolsRules...');

    // Allow MON as stake token with minimum amount
    poolsRules.allowStakeToken(MON, MON_MIN_STAKE);
    console.log('Allowed MON as stake token with minimum:', MON_MIN_STAKE);

    // Allow USDC as stake token with minimum amount
    poolsRules.allowStakeToken(USDC, USDC_MIN_STAKE);
    console.log('Allowed USDC as stake token with minimum:', USDC_MIN_STAKE);

    // Setup prediction tokens array
    address[] memory predictionTokens = new address[](3);
    predictionTokens[0] = BTC; // Bitcoin
    predictionTokens[1] = ETH; // Ethereum
    predictionTokens[2] = SOL; // Solana

    // Allow each prediction token
    for (uint256 i = 0; i < predictionTokens.length; i++) {
      poolsRules.updateAllowedPredictionToken(predictionTokens[i], true);
    }
    console.log('Allowed prediction tokens: BTC, ETH, SOL');

    // Setup pool multipliers array
    uint16[] memory multipliers = new uint16[](5);
    multipliers[0] = MLT2X; // 2x
    multipliers[1] = MLT3X; // 3x
    multipliers[2] = MLT4X; // 4x
    multipliers[3] = MLT5X; // 5x
    multipliers[4] = MLT10X; // 10x

    // Allow each pool multiplier
    for (uint256 i = 0; i < multipliers.length; i++) {
      poolsRules.updateAllowedPoolMultiplier(multipliers[i], true);
    }
    console.log('Allowed pool multipliers: 2x, 3x, 4x, 5x, 10x');

    console.log('PoolsRules and PoolsManager setup completed successfully!');
    console.log('=== Setup Summary ===');
    console.log('MON creation fee:', MON_CREATION_FEE);
    console.log('MON minimum stake:', MON_MIN_STAKE);
    console.log('USDC minimum stake:', USDC_MIN_STAKE);
    console.log('Prediction tokens: BTC, ETH, SOL');
    console.log('Pool multipliers: 2x, 3x, 4x, 5x, 10x');

    vm.stopBroadcast();
  }
}
