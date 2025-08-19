import { Worker } from 'bullmq';
import 'dotenv/config';
import { Bot } from 'grammy';
import IORedis from 'ioredis';
import { completeTelegramAuth } from './complete-telegram-auth';
import { getNotifyWinnerJob } from './get-notify-winner-job';
import { logger } from './utils';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) throw 'Set TELEGRAM_BOT_TOKEN';
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw 'Set REDIS_URL';

const bot = new Bot(botToken);
bot.command('start', completeTelegramAuth);
bot.start({ timeout: 0 });
logger.info('😎 Telegram bot started and listening for start commands.');

const worker = new Worker('pool-winners-telegram-notifications', getNotifyWinnerJob(bot), {
  connection: new IORedis(redisUrl, { family: 0, maxRetriesPerRequest: null })
});

worker.on('ready', () => {
  logger.info('😎 Telegram Notifications Worker is started and ready to execute jobs.');
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
