import { Worker } from 'bullmq';
import 'dotenv/config';
import IORedis from 'ioredis';
import { archivePool } from './archive-pool';
import { logger } from './utils';

if (!process.env.REDIS_URL) throw 'Set REDIS_URL';

const worker = new Worker('pool-archiver', archivePool, {
  connection: new IORedis(process.env.REDIS_URL, { family: 0, maxRetriesPerRequest: null })
});

worker.on('ready', () => {
  logger.info('😎 Pool Archiver Worker is started and ready to execute jobs.');
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
