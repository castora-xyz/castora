import { queueJob, setWorker } from '@castora/shared';
import { syncPools } from './sync-pools';

(async () => {
  await queueJob({
    queueName: 'pool-syncer',
    jobName: 'sync-pools',
    jobData: { chain: 'monadtestnet' },
    repeat: { pattern: '5 0 0,1,5,6,7,11,12,13,17,18,19,23 * * *' },
    jobId: 'sync-pools-on-monadtestnet'
  });

  setWorker({ workerName: 'pool-syncer', handler: syncPools });
})();
