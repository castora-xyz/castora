import { queueJob, setWorker } from '@castora/shared';
import { checkCommunityPools } from './check-community-pools.js';
import { syncPools } from './sync-pools.js';
import { unlistCommunityPool } from './unlist-community-pool.js';

(async () => {
  await queueJob({
    queueName: 'pool-syncer',
    jobName: 'sync-pools',
    jobData: { chain: 'monadmainnet' },
    repeat: { pattern: '10 0 0 * * *' }, // 10 secs every midnight
    jobId: 'sync-pools'
  });

  await queueJob({
    queueName: 'community-pools-checker',
    jobName: 'check-community-pools',
    jobData: { chain: 'monadmainnet' },
    repeat: { pattern: '*/15 * * * * *' }, // every 15 seconds
    jobId: 'check-community-pools'
  });
})();

setWorker({ workerName: 'pool-syncer', handler: syncPools });

setWorker({ workerName: 'community-pools-checker', handler: checkCommunityPools, reduceLogs: true });

setWorker({ workerName: 'community-pools-unlister', handler: unlistCommunityPool });
