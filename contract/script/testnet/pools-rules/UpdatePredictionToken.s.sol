// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import '../../../src/CastoraPoolsRules.sol';
import 'forge-std/Script.sol';

contract UpdatePredictionToken is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    address poolsRulesProxy = vm.envAddress('CASTORA_POOLS_RULES_PROXY');
    address tokenAddress = vm.envAddress('PREDICTION_TOKEN_ADDRESS');
    bool allowed = vm.envBool('PREDICTION_TOKEN_ALLOWED');

    CastoraPoolsRules poolsRules = CastoraPoolsRules(poolsRulesProxy);
    poolsRules.updateAllowedPredictionToken(tokenAddress, allowed);

    console.log('Updated prediction token allowance for: ', tokenAddress);
    console.log('Allowed: ', allowed);

    vm.stopBroadcast();
  }
}
