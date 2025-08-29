import { ArchivedPool, fetchPool, Job, logger, storage } from '@castora/shared';
import { fetchPredictions } from './fetch-predictions';

/**
 * Archives a pool by saving its predictions to use for completion later on
 *
 * @param job The job containing the chain and poolId to archive.
 * @returns A promise that resolves when the pool is archived.
 */
export const archivePool = async (job: Job): Promise<void> => {
  const { chain, poolId } = job.data;
  logger.info(`Start processing job for poolId: ${poolId}, chain: ${chain}`);

  const pool = await fetchPool(chain, poolId);
  const { noOfPredictions, seeds } = pool;

  logger.info('pool.seeds.windowCloseTime: ', seeds.windowCloseTime);
  logger.info('pool.seeds.windowCloseTime (display): ', new Date(seeds.windowCloseTime * 1000));
  if (Math.round(Date.now() / 1000) < seeds.windowCloseTime) {
    throw `Not yet windowCloseTime for Pool ${poolId} on ${chain}. Ending ...`;
  }

  logger.info('\npool.noOfPredictions: ', noOfPredictions);
  if (noOfPredictions === 0) {
    logger.info('Nobody joined this pool. Ending ...');
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
      'Fatal: unmatching predictions length.' +
      ` pool ID: ${pool.poolId} pool.noOfPredictions (${pool.noOfPredictions}) ` +
      `doesn't equal all fetched predictions.length (${predictions.length});`
    );
  }

  await archivalRef.save(JSON.stringify(new ArchivedPool({ chain, pool, predictions }).toJSON()));
  logger.info(`Successfully archived predictions in Pool ${poolId}`);
  logger.info(`Job for poolId: ${poolId}, chain: ${chain} completed successfully`);
};
