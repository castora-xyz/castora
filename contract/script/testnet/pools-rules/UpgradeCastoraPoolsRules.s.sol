// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import 'openzeppelin-foundry-upgrades/Upgrades.sol';
import '../../../src/CastoraPoolsRules.sol';
import 'forge-std/Script.sol';

contract UpgradeCastoraPoolsRules is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    Options memory opts;
    opts.referenceBuildInfoDir = 'build-info-ref';

    address proxy = 0x00Ae1567c73f74b8445A013FD71E518E2EFD326e;
    Upgrades.upgradeProxy(proxy, 'CastoraPoolsRules.sol', '', opts);
    console.log('Updated CastoraPoolsRules to: ', proxy);

    vm.stopBroadcast();
  }
}
