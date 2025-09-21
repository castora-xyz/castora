// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import 'openzeppelin-foundry-upgrades/Upgrades.sol';
import '../../src/CastoraPoolsManager.sol';
import 'forge-std/Script.sol';

contract UpgradeCastoraPoolsManager is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));
    
    address proxyAddress = vm.envAddress('POOLS_MANAGER_PROXY_ADDRESS');
    
    Upgrades.upgradeProxy(proxyAddress, 'CastoraPoolsManager.sol', '');
    
    console.log('Upgraded CastoraPoolsManager at: ', proxyAddress);
    vm.stopBroadcast();
  }
}
