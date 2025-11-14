import { queueJob, setWorker } from '@castora/shared';
import { updateLeaderboardFromPool } from './update-leaderboard-from-pool.js';

setWorker({ workerName: 'leaderboard', handler: updateLeaderboardFromPool });

for (let poolId = 15; poolId <= 6900; poolId++) {
  await queueJob({
    queueName: 'leaderboard',
    jobName: 'update-leaderboard',
    jobData: { chain: 'monadtestnet', poolId }
  });
}
