// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import 'openzeppelin-foundry-upgrades/Upgrades.sol';
import '../../src/CastoraPoolsManager.sol';
import 'forge-std/Script.sol';

contract DeployCastoraPoolsManager is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    address castoraAddress = vm.envAddress('CASTORA_ADDRESS');
    address poolsRulesAddress = vm.envAddress('POOLS_RULES_ADDRESS');
    address feeCollectorAddress = vm.envAddress('FEE_COLLECTOR_ADDRESS');
    uint256 splitPercent = vm.envUint('COMPLETION_FEES_SPLIT_PERCENT');

    address proxy = Upgrades.deployUUPSProxy(
      'CastoraPoolsManager.sol',
      abi.encodeCall(
        CastoraPoolsManager.initialize, (castoraAddress, poolsRulesAddress, feeCollectorAddress, splitPercent)
      )
    );

    console.log('Deployed CastoraPoolsManager at: ', proxy);
    vm.stopBroadcast();
  }
}
