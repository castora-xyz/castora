// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import '../../src/CastoraPoolsRules.sol';
import 'forge-std/Script.sol';

contract UpdateStakeToken is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    address poolsRulesProxy = vm.envAddress('CASTORA_POOLS_RULES_PROXY');
    address tokenAddress = vm.envAddress('STAKE_TOKEN_ADDRESS');
    uint256 minimumAmount = vm.envUint('MINIMUM_STAKE_AMOUNT');

    CastoraPoolsRules poolsRules = CastoraPoolsRules(poolsRulesProxy);
    poolsRules.allowStakeToken(tokenAddress, minimumAmount);

    console.log('Allowed stake token: ', tokenAddress);
    console.log('Minimum amount: ', minimumAmount);

    vm.stopBroadcast();
  }
}
