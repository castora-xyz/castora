// // SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {ERC1967Proxy} from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import {Test} from 'forge-std/Test.sol';
import {Castora} from '../src/Castora.sol';
import {CastoraErrors} from '../src/CastoraErrors.sol';
import {CastoraEvents} from '../src/CastoraEvents.sol';
import {CastoraPoolsRules} from '../src/CastoraPoolsRules.sol';
import {CastoraStructs} from '../src/CastoraStructs.sol';
import {cUSD} from '../src/cUSD.sol';

contract CastoraGettersTest is CastoraErrors, CastoraEvents, CastoraStructs, Test {
// testGetAllStats
// testGetUsersPaginated
// testGetPredictionTokensPaginated
// testGetStakeTokensPaginated
// testGetAllPredictionActivitiesPaginated
// testGetUserStats
// testGetJoinedPoolIdsForUserPaginated
// testGetUserPredictionActivitiesPaginated
// testGetClaimableActivitiesForAddressPaginated
// testGetPool
// testGetPrediction
// testGetPools
// testGetPredictions
// testGetUserInPoolPredictionStats
// testGetPredictionIdsInPoolForUserPaginated
// testGetWinnerPredictionIdsInPoolForUserPaginated
// testGetClaimableWinnerPredictionIdsInPoolForUserPaginated
// testGetPredictionTokenDetails
// testGetStakeTokenDetails
// testGetUserPredictionTokensPaginated
// testGetUserPredictionTokenDetails
// testGetUserStakeTokensPaginated
// testGetUserStakeTokenDetails
// testHashPoolSeeds
// testHashUserPredictionActivity
}
