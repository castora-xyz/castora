// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import '../../src/CastoraPoolsRules.sol';
import 'forge-std/Script.sol';

contract UpdateStakeToken is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    address poolsRulesProxy = vm.envAddress('CASTORA_POOLS_RULES_PROXY');
    address tokenAddress = vm.envAddress('STAKE_TOKEN_ADDRESS');
    bool allowed = vm.envBool('STAKE_TOKEN_ALLOWED');

    CastoraPoolsRules poolsRules = CastoraPoolsRules(poolsRulesProxy);
    poolsRules.updateAllowedStakeToken(tokenAddress, allowed);

    console.log('Updated stake token allowance for: ', tokenAddress);
    console.log('Allowed: ', allowed);

    vm.stopBroadcast();
  }
}
