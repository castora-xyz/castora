// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import 'openzeppelin-foundry-upgrades/Upgrades.sol';
import 'forge-std/Script.sol';
import '../../src/Castora.sol';
import '../../src/CastoraActivities.sol';
import '../../src/CastoraGetters.sol';
import '../../src/CastoraPoolsManager.sol';
import '../../src/CastoraPoolsRules.sol';

contract SetupContracts is Script {
  CastoraActivities public activities = CastoraActivities(0x83d063ACDe4C3E799F0F0162d36D8b0605081b6e);
  Castora public castora = Castora(payable(0x9E1e6f277dF3f2cD150Ae1E08b05f45B3297bE6D));
  CastoraGetters public getters = CastoraGetters(0xf08959E66614027AE76303F4C5359eBfFd00Bc30);
  CastoraPoolsManager public poolsManager = CastoraPoolsManager(payable(0xF8f179Ab96165b61833F2930309bCE9c6aB281bE));
  CastoraPoolsRules public poolsRules = CastoraPoolsRules(0xfacA692BfeaFB4c6DCaF95a25E5CBCDB65d6eC41);
  address public admin;

  function run() public {
    // Load environment variables
    admin = vm.envAddress('ADMIN_ADDRESS');
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    // Setup contract relationships
    console.log('Setting up contract relationships...');

    // Set Castora address in PoolsManager
    poolsManager.setCastora(address(castora));

    // Authorize Castora and PoolsManager to log activities
    activities.setAuthorizedLogger(address(castora), true);
    activities.setAuthorizedLogger(address(poolsManager), true);

    // Grant admin roles
    castora.grantAdminRole(admin);
    castora.grantAdminRole(address(poolsManager));

    console.log('All contracts relationships have been set up successfully.');

    vm.stopBroadcast();
  }
}
