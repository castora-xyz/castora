// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import 'openzeppelin-foundry-upgrades/Upgrades.sol';
import '../../src/CastoraPoolsManager.sol';
import 'forge-std/Script.sol';

contract DeployCastoraPoolsManager is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    address castoraAddress = 0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53; // vm.envAddress('CASTORA_ADDRESS');
    address poolsRulesAddress = 0x00Ae1567c73f74b8445A013FD71E518E2EFD326e; // vm.envAddress('POOLS_RULES_ADDRESS');
    address feeCollectorAddress = vm.envAddress('FEE_COLLECTOR_ADDRESS');
    uint16 splitPercent = 5000; // 50% , 2 decimals // vm.envUint('COMPLETION_FEES_SPLIT_PERCENT');

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
