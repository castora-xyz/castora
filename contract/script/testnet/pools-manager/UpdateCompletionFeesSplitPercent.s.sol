// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import '../../../src/CastoraPoolsManager.sol';
import 'forge-std/Script.sol';

contract UpdateCompletionFeesSplitPercent is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    address poolsManagerAddress = 0xb4a03C32C7cAa4069f89184f93dfAe065C141061; // vm.envAddress('POOLS_MANAGER_ADDRESS');
    uint16 newSplitPercent = 3000; // vm.envUint('NEW_COMPLETION_FEES_SPLIT_PERCENT');

    CastoraPoolsManager poolsManager = CastoraPoolsManager(payable(poolsManagerAddress));
    poolsManager.setCreatorPoolCompletionFeesSplitPercent(newSplitPercent);

    console.log('Updated completion fees split percent to: ', newSplitPercent);
    vm.stopBroadcast();
  }
}
