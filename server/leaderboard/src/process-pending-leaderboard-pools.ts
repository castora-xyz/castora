import { clearPoolsForLeaderboardUpdate, getPoolsForLeaderboardUpdate, logger, queueJob } from '@castora/shared';

export const processPendingLeaderboardPools = async () => {
  logger.info('Start processing pending leaderboard pools...');

  const pendingPools = await getPoolsForLeaderboardUpdate();
  logger.info(`Found ${pendingPools.length} pending pools to process.`);

  if (pendingPools.length === 0) {
    logger.info('No pending pools to process. Ending job...');
    return;
  }

  logger.info(pendingPools, 'Pending pools data: ');
  for (const { poolId, chain } of pendingPools) {
    await queueJob({
      queueName: 'leaderboard-pool-updater',
      jobName: 'update-leaderboard-from-pool',
      jobData: { poolId, chain }
    });
    logger.info(`Queued leaderboard job for poolId: ${poolId}, chain: ${chain}`);
  }
  await clearPoolsForLeaderboardUpdate();
  logger.info('Finished processing pending leaderboard pools.');
};
