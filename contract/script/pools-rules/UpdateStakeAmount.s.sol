// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import '../../src/CastoraPoolsRules.sol';
import 'forge-std/Script.sol';

contract UpdateStakeAmount is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    address poolsRulesProxy = vm.envAddress('CASTORA_POOLS_RULES_PROXY');
    address tokenAddress = vm.envAddress('STAKE_TOKEN_ADDRESS');
    uint256 stakeAmount = vm.envUint('STAKE_AMOUNT');
    bool allowed = vm.envBool('STAKE_AMOUNT_ALLOWED');

    CastoraPoolsRules poolsRules = CastoraPoolsRules(poolsRulesProxy);
    poolsRules.updateAllowedStakeAmount(tokenAddress, stakeAmount, allowed);

    console.log('Updated stake amount allowance for token: ', tokenAddress);
    console.log('Stake amount: ', stakeAmount);
    console.log('Allowed: ', allowed);

    vm.stopBroadcast();
  }
}
