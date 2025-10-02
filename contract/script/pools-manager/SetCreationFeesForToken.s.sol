// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import '../../src/CastoraPoolsManager.sol';
import 'forge-std/Script.sol';

contract SetCreationFeesForToken is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));
    
    address poolsManagerAddress = 0xb4a03C32C7cAa4069f89184f93dfAe065C141061; // vm.envAddress('POOLS_MANAGER_ADDRESS');
    address feeTokenAddress = 0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53;// vm.envAddress('CREATION_FEE_TOKEN_ADDRESS');
    uint256 feeAmount = 10e18; // 10 MON // vm.envUint('CREATION_FEE_AMOUNT');

    CastoraPoolsManager poolsManager = CastoraPoolsManager(payable(poolsManagerAddress));
    poolsManager.setCreationFees(feeTokenAddress, feeAmount);
    
    console.log('Set creation fees for token: ', feeTokenAddress);
    console.log('Creation fee amount: ', feeAmount);
    vm.stopBroadcast();
  }
}
