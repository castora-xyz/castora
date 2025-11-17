import { queueJob, setWorker } from '@castora/shared';
import { processPendingLeaderboardPools } from './process-pending-leaderboard-pools.js';
import { updateLeaderboardFromPool } from './update-leaderboard-from-pool.js';

(async () => {
  await queueJob({
    queueName: 'leaderboard-pools-processor',
    jobName: 'process-pending-leaderboard-pools',
    jobData: {},
    repeat: { pattern: '15 0 0 * *' }, // At 00:15 UTC every day
    jobId: 'process-pending-leaderboard-pools'
  });
})();

setWorker({ workerName: 'leaderboard-pools-processor', handler: processPendingLeaderboardPools });

setWorker({ workerName: 'leaderboard-pool-updater', handler: updateLeaderboardFromPool });
