import { Queue, Worker } from 'bullmq';
import 'dotenv/config';
import { syncPools } from './sync-pools';
import { logger, redisConnection } from './utils';

new Queue('pool-syncer', { connection: redisConnection }).add(
  'sync-pools',
  { chain: 'monadtestnet' },
  {
    repeat: { pattern: '5 0 0,1,5,6,7,11,12,13,17,18,19,23 * * *' },
    jobId: 'sync-pools-on-monadtestnet',
    attempts: 10,
    backoff: { type: 'exponential', delay: 60000 } // retry after 1min, 2min, 4min...
  }
);

const worker = new Worker('pool-syncer', syncPools, {
  connection: redisConnection
});

worker.on('ready', () => {
  logger.info('😎 Pool Syncer Worker is started and ready to execute jobs.');
});

worker.on('active', (job) => {
  logger.info(`\n\n\n🔄 Job ${job.id} started processing`);
});

worker.on('completed', (job) => {
  logger.info(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, e) => {
  logger.error(`❌ Job ${job?.id} failed: ${e}`);
});

worker.on('error', (e) => {
  logger.error(`❌ Worker error: ${e}`);
});
