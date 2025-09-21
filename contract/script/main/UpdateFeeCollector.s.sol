// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import '../../src/Castora.sol';
import 'forge-std/Script.sol';

contract UpdateFeeCollector is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));
    
    address castoraAddress = vm.envAddress('CASTORA_ADDRESS');
    address newFeeCollectorAddress = vm.envAddress('NEW_FEE_COLLECTOR_ADDRESS');
    
    Castora castora = Castora(payable(castoraAddress));
    castora.setFeeCollector(newFeeCollectorAddress);
    
    console.log('Updated Castora fee collector to: ', newFeeCollectorAddress);
    vm.stopBroadcast();
  }
}
