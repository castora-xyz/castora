// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import 'openzeppelin-foundry-upgrades/Upgrades.sol';
import '../../src/Castora.sol';
import 'forge-std/Script.sol';

contract DeployCastora is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));
    address proxy = Upgrades.deployUUPSProxy(
      'Castora.sol',
      abi.encodeCall(
        Castora.initialize,
        (
          vm.envAddress('CASTORA_ACTIVITIES_ADDRESS'),
          vm.envAddress('CASTORA_POOLS_MANAGER_ADDRESS'),
          vm.envAddress('CASTORA_POOLS_RULES_ADDRESS')
        )
      )
    );
    console.log('Deployed Castora at: ', proxy);
    vm.stopBroadcast();
  }
}
