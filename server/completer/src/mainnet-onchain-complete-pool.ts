import { Chain, fetchPool, logger, Pool, SplitPredictionResult, writeContract } from '@castora/shared';
import { fetchArchivedPredictions } from './fetch-archived-predictions.js';
import { getNoOfWinners, PoolMultiplier } from './get-no-of-winners.js';
import { getSplittedPredictions } from './get-splitted-predictions.js';

/**
 * Completes a pool onchain by calling 3 functions:
 * 1. initiatePoolCompletion
 * 2. setWinnersInBatch
 * 3. finalizePoolCompletion
 *
 * @param chain The chain to fetch the pool from.
 * @param pool The pool in which to compute its winners.
 * @param snapshotPrice The price snapshot used for winner calculation.
 * @returns The result containing winner prediction IDs.
 */
export const mainnetOnchainCompletePool = async (
  chain: Chain,
  pool: Pool,
  snapshotPrice: number
): Promise<SplitPredictionResult> => {
  // 1. initiatePoolCompletion
  let noOfWinners = getNoOfWinners(pool.noOfPredictions, pool.seeds.multiplier as PoolMultiplier);
  logger.info(`\nCalculated noOfWinners off-chain as: ${noOfWinners}`);

  const batchSize = noOfWinners > 1000 ? 1000 : noOfWinners;
  logger.info(`Calling initiatePoolCompletion with batchSize: ${batchSize} ...`);
  await writeContract(
    chain,
    'initiatePoolCompletion',
    [pool.poolId, snapshotPrice, batchSize],
    'initiating pool completion'
  );
  logger.info('Successfully called initiatePoolCompletion.');

  // 2. setWinnersInBatch
  logger.info('\nFetching Predictions from Archive ... ');
  const predictions = await fetchArchivedPredictions(chain, pool.poolId);
  logger.info(`Fetched all ${predictions.length} predictions.`);

  if (predictions.length != pool.noOfPredictions) {
    throw (
      'FATAL: unmatching predictions length.' +
      ` pool ID: ${pool.poolId} pool.noOfPredictions (${pool.noOfPredictions}) ` +
      `doesn't equal all fetched predictions.length (${predictions.length});`
    );
  }

  // refetching pool to get updated noOfWinners after initiatePoolCompletion
  pool = await fetchPool(chain, pool.poolId);
  logger.info(`Refetched pool ${pool.poolId}, updated noOfWinners: ${pool.noOfWinners}`);

  // throw if the noOfWinners doesn't match, shouldn't be an issue, but the
  // algorithm must be consistent
  if (pool.noOfWinners !== noOfWinners) {
    throw (
      `FATAL: unmatching noOfWinners after initiatePoolCompletion. off-chain ` +
      `calculated noOfWinners: ${noOfWinners} doesn't equal on-chain updated ` +
      `noOfWinners: ${pool.noOfWinners} in pool ${pool.poolId} on chain ${chain}.`
    );
  }

  logger.info('\nComputing Winners ... ');
  const splitted = getSplittedPredictions(snapshotPrice, predictions, noOfWinners);
  logger.info(`Computed ${splitted.winnerPredictionIdsBigInts.length} winners.`);

  // setting winners in batches of batchSize
  for (let i = 0; i < splitted.winnerPredictionIdsBigInts.length; i += batchSize) {
    const batch = splitted.winnerPredictionIdsBigInts.slice(i, i + batchSize);
    logger.info(`\nCalling setWinnersInBatch with batch of size: ${batch.length} ...`);
    await writeContract(
      chain,
      'setWinnersInBatch',
      [pool.poolId, batch],
      `setting winners in batch for pool ${pool.poolId}`
    );
  }
  logger.info('Successfully called setWinnersInBatch.');

  // 3. finalizePoolCompletion
  logger.info('\nCalling finalizePoolCompletion ... ');
  await writeContract(chain, 'finalizePoolCompletion', [pool.poolId], `finalizing pool ${pool.poolId}`);
  logger.info('Successfully called finalizePoolCompletion.');

  return splitted;
};
