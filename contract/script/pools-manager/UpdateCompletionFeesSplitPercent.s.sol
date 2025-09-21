// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import '../../src/CastoraPoolsManager.sol';
import 'forge-std/Script.sol';

contract UpdateCompletionFeesSplitPercent is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));
    
    address poolsManagerAddress = vm.envAddress('POOLS_MANAGER_ADDRESS');
    uint256 newSplitPercent = vm.envUint('NEW_COMPLETION_FEES_SPLIT_PERCENT');
    
    CastoraPoolsManager poolsManager = CastoraPoolsManager(poolsManagerAddress);
    poolsManager.setCompletionPoolFeesSplitPercent(newSplitPercent);
    
    console.log('Updated completion fees split percent to: ', newSplitPercent);
    vm.stopBroadcast();
  }
}
