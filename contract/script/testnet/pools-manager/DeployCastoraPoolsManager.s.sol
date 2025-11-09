// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import 'openzeppelin-foundry-upgrades/Upgrades.sol';
import '../../../src/CastoraPoolsManager.sol';
import 'forge-std/Script.sol';

contract DeployCastoraPoolsManager is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    address activitiesAddress = vm.envAddress('CASTORA_ACTIVITIES_ADDRESS');
    address feeCollectorAddress = vm.envAddress('FEE_COLLECTOR_ADDRESS');
    uint16 splitPercent = 5000; // 50% , 2 decimals // vm.envUint('COMPLETION_FEES_SPLIT_PERCENT');

    address proxy = Upgrades.deployUUPSProxy(
      'CastoraPoolsManager.sol',
      abi.encodeCall(CastoraPoolsManager.initialize, (activitiesAddress, feeCollectorAddress, splitPercent))
    );

    console.log('Deployed CastoraPoolsManager at: ', proxy);
    vm.stopBroadcast();
  }
}
