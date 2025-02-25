// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import 'openzeppelin-foundry-upgrades/Upgrades.sol';
import '../src/Castora.sol';
import 'forge-std/Script.sol';

contract UpgradeCastora is Script {
  function run() public {
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    Options memory opts;
    opts.unsafeSkipAllChecks = true;

    address proxy = 0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53;
    Upgrades.upgradeProxy(proxy, 'Castora.sol', '', opts);
    console.log('Updated Castora to: ', proxy);

    vm.stopBroadcast();
  }
}
