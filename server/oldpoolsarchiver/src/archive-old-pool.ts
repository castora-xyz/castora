import { ArchivedPool, fetchPool, Job, logger, storage } from '@castora/shared';
import { fetchPredictions } from './fetch-predictions.js';
import { getSplittedPredictionsForOldPool } from './get-splitted-predictions-for-old-pool.js';

/**
 * Archives an old pool by saving its predictions and splitted results
 *
 * @param job The job containing the chain and poolId to archive.
 * @returns A promise that resolves when the pool is archived.
 */
export const archiveOldPool = async (job: Job): Promise<void> => {
  const { chain, poolId } = job.data;
  logger.info(`Start processing job for poolId: ${poolId}, chain: ${chain}`);

  const pool = await fetchPool(chain, poolId);
  const { noOfPredictions } = pool;
  logger.info(`\npool.noOfPredictions: ${noOfPredictions}`);
  if (noOfPredictions === 0) {
    logger.info(`Nobody joined this pool. Ending ...`);
    return;
  }

  const archivalRef = storage.bucket().file(`archives/${chain}/pool-${poolId}.json`);
  const [exists] = await archivalRef.exists();

  if (exists) {
    logger.info(`Pool ${poolId} already pre-archived.`);
    return;
  }

  logger.info('\nFetching Predictions ... ');
  const predictions = await fetchPredictions(chain, pool);
  logger.info(`Fetched all ${predictions.length} predictions.`);

  if (predictions.length != pool.noOfPredictions) {
    throw (
      'FATAL: unmatching predictions length.' +
      ` pool ID: ${pool.poolId} pool.noOfPredictions (${pool.noOfPredictions}) ` +
      `doesn't equal all fetched predictions.length (${predictions.length});`
    );
  }

  const { winnerAddressesUniqued, winnerPredictionIds } = getSplittedPredictionsForOldPool(pool, predictions);
  logger.info(
    `Got splitResults with ${winnerAddressesUniqued.length} unique winners.` +
      ` in pool ID: ${pool.poolId} with pool.noOfWinners:${pool.noOfWinners}, ` +
      `and ${winnerPredictionIds.length} winnerPredictionIds.`
  );
  if (winnerPredictionIds.length != pool.noOfWinners) {
    throw (
      'FATAL: unmatching winnerPredictionIds length.' +
      ` pool ID: ${pool.poolId} pool.noOfWinners (${pool.noOfWinners}) ` +
      `doesn't equal all computed winnerPredictionIds.length (${winnerPredictionIds.length});`
    );
  }

  logger.info('Archiving old pool ...');
  await archivalRef.save(
    JSON.stringify(
      new ArchivedPool({ chain, pool, predictions, results: { winnerAddressesUniqued, winnerPredictionIds } }).toJSON()
    )
  );
  logger.info(`Successfully archived Old Pool ${poolId}`);
  logger.info(`Job for poolId: ${poolId}, chain: ${chain} completed successfully`);
};
