import { Job, Queue } from 'bullmq';
import {
  fetchPool,
  getSnapshotPrice,
  logger,
  rearchivePool,
  redisConnection,
  setWinners
} from './utils';

/**
 * Completes a pool by taking its snapshot and computing its winners.
 *
 * @param job The job containing the chain and poolId to complete.
 * @returns A promise that resolves when the pool is completed.
 */
export const completePool = async (job: Job): Promise<void> => {
  const { chain, poolId } = job.data;
  logger.info(`Start processing job for poolId: ${poolId}, chain: ${chain}`);
  let pool = await fetchPool(chain, poolId);
  const { noOfPredictions, completionTime, seeds } = pool;

  logger.info('pool.seeds.snapshotTime: ', seeds.snapshotTime);
  logger.info('pool.seeds.snapshotTime (display): ', new Date(seeds.snapshotTime * 1000));
  if (Math.round(Date.now() / 1000) < seeds.snapshotTime) {
    logger.error(`Not yet snapshotTime for Pool ${poolId} on ${chain}. Ending ...`);
    throw 'Not yet snapshotTime';
  }

  logger.info('\npool.noOfPredictions: ', noOfPredictions);
  if (noOfPredictions === 0) {
    logger.info('Nobody joined this pool. Ending Process...');
    return;
  }

  if (completionTime !== 0) {
    logger.info('\npool.completionTime: ', completionTime);
    logger.info('pool.completionTime (display): ', new Date(completionTime * 1000));
    logger.info('Pool has been completed. Ending Process.');
  } else {
    logger.info('Getting Snapshot Price ...');
    const snapshotPrice = await getSnapshotPrice(pool);
    logger.info('Got Snapshot Price: ', snapshotPrice);

    const splitResult = await setWinners(chain, pool, snapshotPrice);

    // refetching the pool here so that the winAmount and completionTime will now be valid
    pool = await fetchPool(chain, poolId);

    // re-archiving to store the updated winner predictions off-chain for leaderboard updates.
    await rearchivePool(chain, pool, splitResult);

    // send telegram notifications to winners through redis
    // not adding retries here to manually review when this fails
    await new Queue('pool-winners-telegram-notifications', {
      connection: redisConnection
    }).add('notify', { poolId, chain });

    logger.info('Posted job to notify winners via telegram');
    logger.info(`Successfully completed Pool ${poolId} on chain ${chain}`);
  }
};
