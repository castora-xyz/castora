// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import 'openzeppelin-foundry-upgrades/Upgrades.sol';
import '../../src/CastoraPoolsRules.sol';
import 'forge-std/Script.sol';

contract DeployCastoraPoolsRules is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));
    address proxy = Upgrades.deployUUPSProxy('CastoraPoolsRules.sol', abi.encodeCall(CastoraPoolsRules.initialize, ()));
    console.log('Deployed CastoraPoolsRules at: ', proxy);
    vm.stopBroadcast();
  }
}
