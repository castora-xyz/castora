import { queueJob, setWorker } from '@castora/shared';
import { checkCommunityPools } from './check-community-pools.js';
import { syncPools } from './sync-pools.js';
import { unlistCommunityPool } from './unlist-community-pool.js';

(async () => {
  await queueJob({
    queueName: 'testnet-pool-syncer',
    jobName: 'sync-testnet-pools',
    jobData: { chain: 'monadtestnet' },
    repeat: { pattern: '5 0 0,1,5,6,7,11,12,13,17,18,19,23 * * *' },
    jobId: 'sync-pools-on-monadtestnet'
  });

  await queueJob({
    queueName: 'mainnet-pool-syncer',
    jobName: 'sync-mainnet-pools',
    jobData: { chain: 'monadmainnet' },
    repeat: { pattern: '0 0 */1 * * *' }, // every 1 hour
    jobId: 'sync-pools-on-monadmainnet'
  });

  await queueJob({
    queueName: 'testnet-community-pools-checker',
    jobName: 'check-testnet-community-pools',
    jobData: { chain: 'monadtestnet' },
    repeat: { pattern: '5 */1 * * * *' }, // every 1 min at :05 seconds
    jobId: 'check-community-pools-on-monadtestnet'
  });

  await queueJob({
    queueName: 'mainnet-community-pools-checker',
    jobName: 'check-mainnet-community-pools',
    jobData: { chain: 'monadmainnet' },
    repeat: { pattern: '*/15 * * * * *' }, // every 15 seconds
    jobId: 'check-community-pools-on-monadmainnet'
  });
})();

setWorker({ workerName: 'testnet-pool-syncer', handler: syncPools });

setWorker({ workerName: 'mainnet-pool-syncer', handler: syncPools });

setWorker({ workerName: 'testnet-community-pools-checker', handler: checkCommunityPools });

setWorker({ workerName: 'mainnet-community-pools-checker', handler: checkCommunityPools });

setWorker({ workerName: 'community-pools-unlister', handler: unlistCommunityPool });
