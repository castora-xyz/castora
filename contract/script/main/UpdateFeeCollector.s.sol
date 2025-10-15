// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import '../../src/Castora.sol';
import 'forge-std/Script.sol';

contract UpdateFeeCollector is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    address castoraAddress = 0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53; // vm.envAddress('CASTORA_ADDRESS');
    address newFeeCollectorAddress = 0xb4a03C32C7cAa4069f89184f93dfAe065C141061; // vm.envAddress('NEW_FEE_COLLECTOR_ADDRESS');

    Castora castora = Castora(payable(castoraAddress));
    castora.setFeeCollector(newFeeCollectorAddress);

    console.log('Updated Castora fee collector to: ', newFeeCollectorAddress);
    vm.stopBroadcast();
  }
}
