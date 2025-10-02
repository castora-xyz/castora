// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import '../../src/CastoraPoolsRules.sol';
import 'forge-std/Script.sol';

contract UpdatePoolTimeInterval is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    address poolsRulesProxy = vm.envAddress('CASTORA_POOLS_RULES_PROXY');
    uint256 newInterval = vm.envUint('REQUIRED_TIME_INTERVAL');

    CastoraPoolsRules poolsRules = CastoraPoolsRules(poolsRulesProxy);
    uint256 oldInterval = poolsRules.requiredTimeInterval();

    poolsRules.updateRequiredTimeInterval(newInterval);

    console.log('Updated required time interval from: ', oldInterval);
    console.log('Updated required time interval to: ', newInterval);

    vm.stopBroadcast();
  }
}
