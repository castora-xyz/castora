import { Worker } from 'bullmq';
import 'dotenv/config';
import { Bot } from 'grammy';
import IORedis from 'ioredis';
import { Pool } from './schemas';
import { firestore, logger, storage } from './utils';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) throw 'Set TELEGRAM_BOT_TOKEN';
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw 'Set REDIS_URL';

const bot = new Bot(botToken);

const notify = async (pool: Pool, winner: string) => {
  // Check if the winner has a Telegram ID
  const userRef = firestore.doc(`/users/${winner}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;
  const userData = userSnap.data();
  if (!userData || !userData.telegramId) return;

  // Compute the amount won by the winner
  const count = pool.predictions.filter(
    ({ predicter, isAWinner }) => predicter === winner && isAWinner
  ).length;
  // the division by 0.95 below is to obtain the amount without fees applied
  // the amount is also ensured to be rounded to 2 decimal places
  const won = Math.trunc(((pool.winAmount / 0.95) * count) * 100) / 100;

  // Send the notification
  try {
    await bot.api.sendMessage(
      userData.telegramId,
      `You just won ${won} ${pool.stakeToken} in Pool ${pool.poolId}! Click to claim your winnings now!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Claim Now!', url: `https://castora.xyz/pool/${pool.poolId}` }]
          ]
        }
      }
    );
    logger.info(`🏆 Notified winner: ${winner} who won ${won} ${pool.stakeToken}`);
  } catch (e) {
    logger.error(
      `❌ Failed to notify winner ${winner} on Telegram for pool ${pool.poolId} on chain ${pool.chain}, error: ${e}`
    );
  }
};

const worker = new Worker(
  'pool-winners-telegram-notifications',
  async (job) => {
    const { poolId, chain } = job.data;
    logger.info(`Start processing job for poolId: ${poolId}, chain: ${chain}`);

    // Fetch the pool from the archive
    let pool: Pool;
    try {
      const archivalRef = storage.bucket().file(`archives/${chain}/pool-${poolId}.json`);
      pool = new Pool(JSON.parse((await archivalRef.download())[0].toString()));
      logger.info(`Fetched pool: ${poolId} on ${chain}`);
    } catch (e) {
      throw new Error(`Failed to fetch pool from archive: ${e}`);
    }

    // Check if winners have already been notified, if so, stop processing.
    if (pool.hasNotifiedWinnersOnTelegram) {
      logger.info(
        `Pool ${poolId} on ${chain} has already notified winners on Telegram. Ending job...`
      );
      return;
    }

    // Notify winners on Telegram
    logger.info(`Notifying winners for pool ${poolId} on ${chain}`);
    for (const winner of pool.winners) await notify(pool, winner);

    // Update the pool to mark winners as notified
    try {
      pool.json.pool.hasNotifiedWinnersOnTelegram = true;
      await storage
        .bucket()
        .file(`archives/${chain}/pool-${poolId}.json`)
        .save(JSON.stringify(pool.json));
      logger.info('Updated pool to mark winners as notified on Telegram');
    } catch (e) {
      logger.error(
        `Failed to update pool ${poolId} on ${chain} to mark winners as notified, error: ${e}`
      );
    }

    logger.info(`Job for poolId: ${poolId}, chain: ${chain} completed successfully`);
  },
  {
    connection: new IORedis(redisUrl, { maxRetriesPerRequest: null })
  }
);

worker.on('active', (job) => {
  logger.info(`\n🔄 Job ${job.id} started processing`);
});

worker.on('completed', (job) => {
  logger.info(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`);
});
