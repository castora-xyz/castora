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

contract CastoraOnlyAdminsTest is CastoraErrors, CastoraEvents, CastoraStructs, Test {
// testRevertPausedCreatePool
// testRevertNotAdminCreatePool
// testRevertExistingPoolCreatePool
// testCreatePoolSuccessNativeTokenStake
// testCreatePoolSuccessERC20TokenStake
// testRevertPausedInitiatePoolCompletion
// testRevertNotAdminInitiatePoolCompletion
// testRevertInvalidPoolIdInitiatePoolCompletion
// testRevertPoolAlreadyCompletedInitiatePoolCompletion
// testRevertPoolCompletionAlreadyInitiatedInitiatePoolCompletion
// testRevertNotYetSnapshotTimeInitiatePoolCompletion
// testRevertInvalidPoolCompletionBatchSizeInitiatePoolCompletion
// testRevertInvalidPoolMultiplierInitiatePoolCompletion
// testInitiatePoolCompletionSuccessSingleWinner
// testInitiatePoolCompletionSuccessMultipleWinners
// testRevertPausedSetWinnersInBatch
// testRevertNotAdminSetWinnersInBatch
// testRevertInvalidPoolIdSetWinnersInBatch
// testRevertPoolCompletionNotInitiatedSetWinnersInBatch
// testRevertPoolAlreadyCompletedSetWinnersInBatch
// testRevertInvalidPoolCompletionBatchSizeSetWinnersInBatch
// testRevertPoolCompletionBatchesAllProcessedSetWinnersInBatch
// testRevertInvalidPoolCompletionBatchSizeSetWinnersInBatch (both cases)
// testRevertInvalidPredictionIdsSetWinnersInBatch
// testRevertPredictionAlreadyMarkedAsWinnerSetWinnersInBatch
// testSetWinnersInBatchSuccessSingleWinner
// testSetWinnersInBatchSuccessMultipleWinners
// testRevertPausedFinalizePoolCompletion
// testRevertNotAdminFinalizePoolCompletion
// testRevertInvalidPoolIdFinalizePoolCompletion
// testRevertPoolCompletionNotInitiatedFinalizePoolCompletion
// testRevertPoolAlreadyCompletedFinalizePoolCompletion
// testRevertPoolCompletionBatchesNotAllProcessedFinalizePoolCompletion
// testRevertUnsuccessfulFeeCollectionFinalizePoolCompletion
// testFinalizePoolCompletionSuccessSingleWinner
// testFinalizePoolCompletionSuccessMultipleWinners
}
