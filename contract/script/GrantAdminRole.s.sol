// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import '../src/Castora.sol';
import 'forge-std/Script.sol';

contract GrantAdminRole is Script {
  function run() public {
    Castora castora = Castora(payable(0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53));
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));
    castora.grantAdminRole(vm.envAddress('ADMIN_ADDRESS'));
    vm.stopBroadcast();
  }
}
