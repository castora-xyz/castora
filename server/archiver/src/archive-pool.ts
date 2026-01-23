import { ArchivedPool, Chain, fetchPool, Job, logger, normalizeChain, PoolSeeds, queueJob, storage } from '@castora/shared';
import { fetchPredictions } from './fetch-predictions.js';

const queueCompletionJob = async (poolId: any, chain: Chain, seeds: PoolSeeds): Promise<void> => {
  logger.info('\nGot shouldComplete, posting job for pool completion.');

  let delay;
  const now = Math.trunc(Date.now() / 1000);
  // 20 seconds after snapshotTime for price availability
  if (seeds.snapshotTime > now) delay = (seeds.snapshotTime - now) * 1000 + 20000;

  await queueJob({
    queueName: 'pool-completer',
    jobName: 'complete-pool',
    jobData: { poolId, chain },
    ...(delay ? { delay } : {})
  });
  logger.info(`Posted job to complete Pool ${poolId} on chain ${chain} after snapshotTime`);
};

/**
 * Archives a pool by saving its predictions to use for completion later on
 *
 * @param job The job containing the chain and poolId to archive.
 * @returns A promise that resolves when the pool is archived.
 */
export const archivePool = async (job: Job): Promise<void> => {
  const { chain: rawChain, poolId, shouldComplete } = job.data;
  const chain = normalizeChain(rawChain);
  logger.info(`Start processing job for poolId: ${poolId}, chain: ${chain}`);

  const pool = await fetchPool(chain, poolId);
  const { noOfPredictions, seeds } = pool;
  logger.info(`pool.seeds.windowCloseTime: ${seeds.windowCloseTime}`);
  logger.info(`pool.seeds.windowCloseTime (display): ${new Date(seeds.windowCloseTime * 1000)}`);
  if (Math.round(Date.now() / 1000) < seeds.windowCloseTime) {
    throw `Not yet windowCloseTime for Pool ${poolId} on ${chain}. Ending ...`;
  }

  logger.info(`\npool.noOfPredictions: ${noOfPredictions}`);
  if (noOfPredictions === 0) {
    logger.info(`Nobody joined this pool. Ending ...`);
    return;
  }

  const archivalRef = storage.bucket().file(`archives/${chain}/pool-${poolId}.json`);
  const [exists] = await archivalRef.exists();

  if (exists) {
    logger.info(`Pool ${poolId} already pre-archived.`);
    if (shouldComplete) await queueCompletionJob(poolId, chain, seeds);
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

  await archivalRef.save(JSON.stringify(new ArchivedPool({ chain, pool, predictions }).toJSON()));
  logger.info(`Successfully archived predictions in Pool ${poolId}`);
  logger.info(`Job for poolId: ${poolId}, chain: ${chain} completed successfully`);

  if (shouldComplete) await queueCompletionJob(poolId, chain, seeds);
};
