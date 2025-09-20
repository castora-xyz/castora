// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import 'openzeppelin-foundry-upgrades/Upgrades.sol';
import '../../src/CastoraPoolsRules.sol';
import 'forge-std/Script.sol';

contract UpgradeCastoraPoolsRules is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    Options memory opts;
    opts.unsafeSkipAllChecks = true;

    address proxy = vm.envAddress('CASTORA_POOLS_RULES_PROXY');
    Upgrades.upgradeProxy(proxy, 'CastoraPoolsRules.sol', '', opts);
    console.log('Updated CastoraPoolsRules to: ', proxy);

    vm.stopBroadcast();
  }
}
