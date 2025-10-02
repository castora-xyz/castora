// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import '../../src/CastoraPoolsManager.sol';
import 'forge-std/Script.sol';

contract SetCreationFeesForToken is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));
    
    address poolsManagerAddress = vm.envAddress('POOLS_MANAGER_ADDRESS');
    address feeTokenAddress = vm.envAddress('CREATION_FEE_TOKEN_ADDRESS');
    uint256 feeAmount = vm.envUint('CREATION_FEE_AMOUNT');
    
    CastoraPoolsManager poolsManager = CastoraPoolsManager(poolsManagerAddress);
    poolsManager.setCreationFees(feeTokenAddress, feeAmount);
    
    console.log('Set creation fees for token: ', feeTokenAddress);
    console.log('Creation fee amount: ', feeAmount);
    vm.stopBroadcast();
  }
}
