// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import 'forge-std/Script.sol';
import '../../src/cUSD.sol';

contract DeployCUSD is Script {
  cUSD public cUSD_;

  function run() public {
    vm.startBroadcast(vm.envUint('CUSD_OWNER_KEY'));
    cUSD_ = new cUSD();
    vm.stopBroadcast();
  }
}
