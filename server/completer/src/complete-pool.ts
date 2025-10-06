import { fetchPool, Job, logger, queueJob, readPoolsManagerContract } from '@castora/shared';
import { PoolMultiplier } from './get-no-of-winners.js';
import { getSnapshotPrice } from './get-snapshot-price.js';
import { rearchivePool } from './rearchive-pool.js';
import { setWinners } from './set-winners.js';

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
  logger.info(`pool.seeds.snapshotTime: ${seeds.snapshotTime}`);
  logger.info(`pool.seeds.snapshotTime (display): ${new Date(seeds.snapshotTime * 1000)}`);
  if (Math.round(Date.now() / 1000) < seeds.snapshotTime) {
    logger.error(`Not yet snapshotTime for Pool ${poolId} on ${chain}. Ending ...`);
    throw 'Not yet snapshotTime';
  }

  logger.info(`pool.noOfPredictions: ${noOfPredictions}`);
  if (noOfPredictions === 0) {
    logger.info('Nobody joined this pool. Ending Process...');
    return;
  }

  if (completionTime !== 0) {
    logger.info(`pool.completionTime: ${completionTime}`);
    logger.info(`pool.completionTime (display): ${new Date(completionTime * 1000)}`);
    logger.info('Pool has been completed. Ending Process.');
  } else {
    logger.info('Getting Snapshot Price ...');
    const snapshotPrice = await getSnapshotPrice(pool, chain);
    logger.info(`Got Snapshot Price: ${snapshotPrice}`);

    // Check if this is a community created pool and use accompanying data
    let creatorDetails;
    let multiplier: PoolMultiplier = 2;
    const isCommunity = await readPoolsManagerContract(chain, 'doesUserCreatedPoolExist', [poolId]);

    // if this is a community created pool, extract creator details to re-archival
    // also extract the right pool multiplier to apply
    if (isCommunity) {
      logger.info('Community Created Pool found, gathering extra data ...');
      const userCreatedPool = (await readPoolsManagerContract(chain, 'getUserCreatedPool', [poolId])) as any;
      const { creator, completionFeesAmount: amt, multiplier: multiplierRaw } = userCreatedPool;

      // completion fees token always match pool stake token
      const { decimals, name } = pool.seeds.getStakeTokenDetails();
      const gainedRaw = Number(amt) / 10 ** decimals;

      // If the amount is less than 0.01, keep up to the first three non-zero decimal places
      // Otherwise, round to 3 decimal places
      const gained =
        gainedRaw < 0.003 && gainedRaw > 0 ? parseFloat(gainedRaw.toPrecision(3)) : Math.trunc(gainedRaw * 1000) / 1000;
      const creatorCompletionFees = `${gained} ${name}`;
      creatorDetails = { creator, creatorCompletionFees };
      
      // multiplier is store in contract with 2 decimal places
      multiplier = (multiplierRaw / 100) as PoolMultiplier;
      logger.info(
        `Have noted pool creator ${creator}, their completion fees ${creatorCompletionFees}` +
          ` and the pool multiplier ${multiplier}`
      );
    } else {
      logger.info('Not a Community Created Pool, proceeding to split result ...');
    }

    const splitResult = await setWinners(chain, pool, snapshotPrice, multiplier);

    // refetching the pool here so that the winAmount and completionTime will now be valid
    pool = await fetchPool(chain, poolId);

    // re-archiving to store the updated winner predictions and creator info for notifications.
    await rearchivePool(chain, pool, splitResult, creatorDetails);

    // if is a community created pool, send telegram notification to the creator
    if (isCommunity) {
      await queueJob({
        queueName: 'pool-creator-telegram-notifications',
        jobName: 'notify-pool-creator-telegram',
        jobData: { poolId, chain }
      });
      logger.info('Posted job to notify pool creator via telegram');
    }

    // send telegram notifications to winners through redis
    await queueJob({
      queueName: 'pool-winners-telegram-notifications',
      jobName: 'notify-winners-telegram',
      jobData: { poolId, chain }
    });

    logger.info('Posted job to notify winners via telegram');
    logger.info(`Successfully completed Pool ${poolId} on chain ${chain}`);
  }
};
