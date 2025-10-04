import {
  FieldValue,
  firestore,
  Job,
  logger,
  queueJob,
  readCastoraContract,
  readPoolsManagerContract,
  redisClient
} from '@castora/shared';

/**
 * Checks for newly created community pools and
 * 1. post the target time archive and complete jobs for the pools
 * 2. list them in firestore if they are public
 *    (not unlisted in manager contract) and also post the job
 *    unlisting them after completion in that case.
 *
 * @param job The job containing the chain to check for its newly
 *      created community pools
 */
export const checkCommunityPools = async (job: Job): Promise<void> => {
  const { chain } = job.data;

  // Retrieve the last handled nth community pool from redis
  const redisKey = `last-handled-community-pool-index:chain-${chain}`;
  let lastHandledNthRaw = await redisClient.get(redisKey);

  if (!lastHandledNthRaw) {
    throw `No last handled nth community pool found in redis for chain: ${chain} in checkCommunityPools`;
  }

  const lastHandledNth = +lastHandledNthRaw;
  logger.info(`Last handled nth community pool from Redis for chain ${chain} is ${lastHandledNth}`);
  if (isNaN(lastHandledNth)) {
    throw `Invalid last handled nth community pool found in redis for chain: ${chain} value: ${lastHandledNthRaw}`;
  }

  // Retrieve current total of userCreatedPools from the poolsManager contract
  let allStats: any = await readPoolsManagerContract(chain, 'getAllStats');
  if (!allStats) {
    throw `Couldn't getAllStats of Pools Manager Contract for chain: ${chain} in checkCommunityPools`;
  }

  const noOfUserCreatedPools = Number(allStats['noOfUserCreatedPools']);
  logger.info(`noOfUserCreatedPools from Pools Manager Contract for chain ${chain} is ${noOfUserCreatedPools}`);
  if (isNaN(noOfUserCreatedPools)) {
    throw (
      `Invalid noOfUserCreatedPools from Pools Manager Contract for chain: ${chain},` +
      ` value: ${allStats['noOfUserCreatedPools']}`
    );
  }

  // Compare the retrieved numbers, if equal, return, no new pool yet
  if (lastHandledNth === noOfUserCreatedPools) {
    logger.info('Redis Processed Count and Contract Counts are the same. No new pools to process. Ending Job.');
    return;
  }

  // If contract retrieved is less than redis retrieved, stop and let devs investigate.
  if (noOfUserCreatedPools < lastHandledNth) {
    throw (
      `FATAL: In checkCommunityPools, Contract's noOfUserCreatedPools ${noOfUserCreatedPools} ` +
      `was less than lastHandledNth count from Redis ${lastHandledNth}`
    );
  }

  // If we are still here, then contract retrieved is greater than last handled and there are new pools
  // Retrieve all the new pool IDs from the poolsManager contract
  const newPoolIds = await readPoolsManagerContract(chain, 'getAllCreatedPoolIdsPaginated', [
    lastHandledNth + 1,
    noOfUserCreatedPools - lastHandledNth
  ]);

  logger.info(newPoolIds, `Fetched newPoolIds with size: ${(newPoolIds as any).length}`);
  if (!newPoolIds || !Array.isArray(newPoolIds) || newPoolIds.length === 0) {
    throw (
      `Invalid fetched newPoolIds from Pools Manager Contract on chain: ${chain}` +
      ` in checkCommunityPools, value: ${newPoolIds}`
    );
  }

  // Fetch their UserCreatedPools and main Pools from Castora contract
  const userCreatedPools = (await readPoolsManagerContract(chain, 'getUserCreatedPools', [newPoolIds])) as any[];
  const pools = await readCastoraContract(chain, 'getPools', [newPoolIds]);
  logger.info('Fetched their userCreatedPools and main Castora pools equivalents. Started processing each ...');

  // Loop across the pool IDs and pools and act on each.
  for (let i = 0; i < newPoolIds.length; i++) {
    const poolId = Number(newPoolIds[i]);
    const { isUnlisted } = userCreatedPools[i];
    const windowCloseTime = Number(pools[i].seeds.windowCloseTime);
    const snapshotTime = Number(pools[i].seeds.snapshotTime);
    const now = Math.trunc(Date.now() / 1000);
    logger.info(
      `\n\nProcessing new community pool ${poolId} on chain ${chain} with ` +
        `isUnlisted: ${isUnlisted}, windowCloseTime: ${windowCloseTime}, ` +
        `snapshotTime: ${snapshotTime}, and the current timestamp: ${now}`
    );

    // For every pool, post an archive job
    await queueJob({
      queueName: 'pool-archiver',
      jobName: 'archive-pool',
      jobData: { chain, poolId },
      delay: (windowCloseTime - now) * 1000
    });
    logger.info(`Posted job to archive Pool ${poolId} on chain ${chain} at windowCloseTime`);

    // post a completion job
    await queueJob({
      queueName: 'pool-completer',
      jobName: 'complete-pool',
      jobData: { poolId, chain },
      // 20 seconds after snapshotTime for price availability
      delay: (snapshotTime - now) * 1000 + 20000
    });
    logger.info(`Posted job to complete Pool ${poolId} on chain ${chain} after snapshotTime`);

    // For pools that are public ...
    if (!isUnlisted) {
      // a. List them firestore
      await firestore.doc(`/chains/${chain}/live/community`).update({ poolIds: FieldValue.arrayUnion(poolId) });
      logger.info(`\nListed Public Community Pool ID: ${poolId} on chain: ${chain}`);

      // b. post their unlisting jobs
      // we will use the same time interval between the windowCloseTime and snapshotTime as the time interval
      // for the completed pool to stay in the community listings, like the difference will serve as delay.
      const delay = (snapshotTime - windowCloseTime) * 1000;
      await queueJob({
        queueName: 'community-pools-unlister',
        jobName: 'unlist-community-pool',
        jobData: { chain, poolId },
        delay
      });
      logger.info(
        `Posted job to unlist Community Pool ${poolId} on chain: ${chain}, ${delay} seconds after snapshotTime`
      );
    }
  }

  // finally, record the last handled nth community pool to Redis
  await redisClient.set(redisKey, noOfUserCreatedPools);
};
