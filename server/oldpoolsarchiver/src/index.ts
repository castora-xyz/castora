import { queueJob, setWorker } from '@castora/shared';
import { archiveOldPool } from './archive-old-pool.js';

setWorker({ workerName: 'oldpoolsarchiver', handler: archiveOldPool });

for (let poolId = 3000; poolId <= 3359; poolId++) {
  await queueJob({
    queueName: 'oldpoolsarchiver',
    jobName: 'archive-old-pool',
    jobData: { chain: 'monadtestnet', poolId }
  });
}
