import { Worker } from 'bullmq';
import 'dotenv/config';
import { completePool } from './complete-pool';
import { logger, redisConnection } from './utils';

const worker = new Worker('pool-completer', completePool, {
  connection: redisConnection
});

worker.on('ready', () => {
  logger.info('😎 Pool Completer Worker is started and ready to execute jobs.');
});

worker.on('active', (job) => {
  logger.info(`\n🔄 Job ${job.id} started processing`);
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
