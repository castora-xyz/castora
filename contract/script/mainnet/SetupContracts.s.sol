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
  CastoraActivities public activities;
  Castora public castora;
  CastoraGetters public getters;
  CastoraPoolsManager public poolsManager;
  CastoraPoolsRules public poolsRules;

  address public admin;
  address public feeCollector;

  uint16 public constant CREATOR_POOLS_SPLIT_FEES_PERCENT = 3000; // 30% to creators in 2 decimal places

  function run() public {
    // Load environment variables
    feeCollector = vm.envAddress('FEE_COLLECTOR_ADDRESS');
    admin = vm.envAddress('ADMIN_ADDRESS');
    vm.startBroadcast(vm.envUint('CASTORA_OWNER_KEY'));

    // Deploy CastoraActivities
    console.log('Deploying CastoraActivities...');
    address activitiesProxy =
      Upgrades.deployUUPSProxy('CastoraActivities.sol', abi.encodeCall(CastoraActivities.initialize, ()));
    activities = CastoraActivities(activitiesProxy);
    console.log('CastoraActivities deployed at:', activitiesProxy);

    // Deploy CastoraPoolsManager
    console.log('Deploying CastoraPoolsManager...');
    address poolsManagerProxy = Upgrades.deployUUPSProxy(
      'CastoraPoolsManager.sol',
      abi.encodeCall(
        CastoraPoolsManager.initialize, (address(activities), feeCollector, CREATOR_POOLS_SPLIT_FEES_PERCENT)
      )
    );
    poolsManager = CastoraPoolsManager(payable(poolsManagerProxy));
    console.log('CastoraPoolsManager deployed at:', poolsManagerProxy);

    // Deploy CastoraPoolsRules
    console.log('Deploying CastoraPoolsRules...');
    address poolsRulesProxy =
      Upgrades.deployUUPSProxy('CastoraPoolsRules.sol', abi.encodeCall(CastoraPoolsRules.initialize, ()));
    poolsRules = CastoraPoolsRules(poolsRulesProxy);
    console.log('CastoraPoolsRules deployed at:', poolsRulesProxy);

    // Deploy Castora
    console.log('Deploying Castora...');
    address castoraProxy = Upgrades.deployUUPSProxy(
      'Castora.sol',
      abi.encodeCall(Castora.initialize, (address(activities), address(poolsManager), address(poolsRules)))
    );
    castora = Castora(payable(castoraProxy));
    console.log('Castora deployed at:', castoraProxy);

    // Deploy CastoraGetters
    console.log('Deploying CastoraGetters...');
    getters = new CastoraGetters(address(castora));
    console.log('CastoraGetters deployed at:', address(getters));

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

    console.log('All contracts deployed and configured successfully!');
    console.log('=== Deployment Summary ===');
    console.log('CastoraActivities:', address(activities));
    console.log('CastoraPoolsManager:', address(poolsManager));
    console.log('CastoraPoolsRules:', address(poolsRules));
    console.log('Castora:', address(castora));
    console.log('CastoraGetters:', address(getters));
    console.log('Fee Collector:', feeCollector);
    console.log('Admin:', admin);

    vm.stopBroadcast();
  }
}
