// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import '../../../src/CastoraPoolsRules.sol';
import 'forge-std/Script.sol';

contract UpdateStakeToken is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    address poolsRulesProxy = vm.envAddress('CASTORA_POOLS_RULES_PROXY');
    address tokenAddress = vm.envAddress('STAKE_TOKEN_ADDRESS');
    uint256 minimumAmount = vm.envUint('MINIMUM_STAKE_AMOUNT');
    bool allowed = vm.envBool('STAKE_TOKEN_ALLOWED');

    CastoraPoolsRules poolsRules = CastoraPoolsRules(poolsRulesProxy);

    if (allowed) {
      poolsRules.allowStakeToken(tokenAddress, minimumAmount);
      console.log('Allowed stake token: ', tokenAddress);
      console.log('Minimum stake amount: ', minimumAmount);
    } else {
      poolsRules.disallowStakeToken(tokenAddress);
      console.log('Disallowed stake token: ', tokenAddress);
    }

    vm.stopBroadcast();
  }
}
