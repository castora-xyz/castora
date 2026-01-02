import { Job, Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from './logger.js';

export { Job } from 'bullmq';

if (!process.env.REDIS_URL) throw 'Set REDIS_URL in env';
const connection = new Redis(process.env.REDIS_URL, {
  family: 0,
  maxRetriesPerRequest: null
});

export const redisClient = connection;

export interface QueueJobOpts {
  queueName: string;
  jobName: string;
  jobData: any;
  delay?: number;
  repeat?: any;
  jobId?: any;
}

export const queueJob = async ({ queueName, jobName, jobData, delay, repeat, jobId }: QueueJobOpts) =>
  await new Queue(queueName, { connection }).add(jobName, jobData, {
    attempts: 7,
    backoff: { type: 'exponential', delay: 15000 } /* retry after 15secs, 30secs, 1min ... 16mins */,
    removeOnComplete: 10, // Keep only last 10 completed jobs
    removeOnFail: 5, // Keep only last 5 failed jobs
    ...(delay ? { delay } : {}),
    ...(repeat ? { repeat } : {}),
    ...(jobId ? { jobId } : {})
  });

export interface SetWorkerOpts {
  workerName: string;
  handler: (job: Job) => Promise<void>;
  reduceLogs?: boolean;
}

export const setWorker = ({ workerName, handler, reduceLogs }: SetWorkerOpts) => {
  const worker = new Worker(workerName, handler, { connection });

  worker.on('ready', () => {
    logger.info(`😎 ${workerName} Worker is started and ready to execute jobs.`);
  });

  worker.on('active', (job) => {
    if (!reduceLogs) logger.info(`\n\n\n🔄 Job ${job.id} started processing`);
  });

  worker.on('completed', (job) => {
    if (!reduceLogs) logger.info(`✅ Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, e) => {
    logger.error(e, `❌ Job ${job?.id} failed: ${e}`);
  });

  worker.on('error', (e) => {
    logger.error(e, `❌ Worker error: ${e}`);
  });
};
