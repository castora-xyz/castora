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
        Castora.initialize, (vm.envAddress('FEE_COLLECTOR_ADDRESS'), vm.envAddress('FEE_COLLECTOR_ADDRESS'))
      )
    );
    console.log('Deployed Castora at: ', proxy);
    vm.stopBroadcast();
  }
}
