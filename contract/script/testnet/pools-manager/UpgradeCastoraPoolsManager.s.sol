// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import 'openzeppelin-foundry-upgrades/Upgrades.sol';
import '../../../src/CastoraPoolsManager.sol';
import 'forge-std/Script.sol';

contract UpgradeCastoraPoolsManager is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    Options memory opts;
    opts.referenceBuildInfoDir = 'build-info-ref';

    address proxyAddress = 0xb4a03C32C7cAa4069f89184f93dfAe065C141061;
    // vm.envAddress('POOLS_MANAGER_PROXY_ADDRESS');

    Upgrades.upgradeProxy(proxyAddress, 'CastoraPoolsManager.sol', '', opts);

    console.log('Upgraded CastoraPoolsManager at: ', proxyAddress);
    vm.stopBroadcast();
  }
}
