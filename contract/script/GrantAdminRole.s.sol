// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import '../src/Castora.sol';
import 'forge-std/Script.sol';

contract GrantAdminRole is Script {
  function run() public {
    // TODO: Change the following makeAddr to the appropriate deployed contract
    Castora castora = Castora(payable(makeAddr('castora')));
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));
    castora.grantAdminRole(vm.envAddress('ADMIN_ADDRESS'));
    vm.stopBroadcast();
  }
}
