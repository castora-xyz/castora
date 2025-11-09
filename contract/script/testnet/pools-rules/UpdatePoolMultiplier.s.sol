// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import '../../../src/CastoraPoolsRules.sol';
import 'forge-std/Script.sol';

contract UpdatePoolMultiplier is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    address poolsRulesProxy = vm.envAddress('CASTORA_POOLS_RULES_PROXY');
    uint16 multiplier = uint16(vm.envUint('POOL_MULTIPLIER')); // 2 decimal places
    bool allowed = vm.envBool('POOL_MULTIPLIER_ALLOWED');

    CastoraPoolsRules poolsRules = CastoraPoolsRules(poolsRulesProxy);
    poolsRules.updateAllowedPoolMultiplier(multiplier, allowed);
    console.log('Updated allowed pool multiplier ', multiplier);

    vm.stopBroadcast();
  }
}
