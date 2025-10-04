import { queueJob, setWorker } from '@castora/shared';
import { checkCommunityPools } from './check-community-pools.js';
import { syncPools } from './sync-pools.js';
import { unlistCommunityPool } from './unlist-community-pool.js';

(async () => {
  await queueJob({
    queueName: 'pool-syncer',
    jobName: 'sync-pools',
    jobData: { chain: 'monadtestnet' },
    repeat: { pattern: '5 0 0,1,5,6,7,11,12,13,17,18,19,23 * * *' },
    jobId: 'sync-pools-on-monadtestnet'
  });

  await queueJob({
    queueName: 'community-pools-checker',
    jobName: 'check-community-pools',
    jobData: { chain: 'monadtestnet' },
    repeat: { pattern: '*/15 * * * * *' }, // every 15 seconds
    jobId: 'check-community-pools-on-monadtestnet'
  });
})();

setWorker({ workerName: 'pool-syncer', handler: syncPools });

setWorker({ workerName: 'community-pools-checker', handler: checkCommunityPools });

setWorker({ workerName: 'community-pools-unlister', handler: unlistCommunityPool });
