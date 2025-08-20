import { Job } from 'bullmq';
import { FieldValue } from 'firebase-admin/firestore';
import { Bot } from 'grammy';
import { notifyWinner } from './notify-winner';
import { Pool } from './schemas';
import { firestore, logger, storage } from './utils';

export const getNotifyWinnerJob = (bot: Bot) => {
  return async (job: Job<any, any, string>) => {
    const { poolId, chain } = job.data;
    logger.info(`Start processing job for poolId: ${poolId}, chain: ${chain}`);

    // Fetch the pool from the archive
    let pool: Pool;
    try {
      const archivalRef = storage.bucket().file(`archives/${chain}/pool-${poolId}.json`);
      pool = new Pool(JSON.parse((await archivalRef.download())[0].toString()));
      logger.info(`Fetched pool: ${poolId} on ${chain}`);
    } catch (e) {
      throw `Failed to fetch pool from archive: ${e}`;
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
    let notifiedCount = 0;
    for (const winner of pool.winners) {
      const isSuccess = await notifyWinner(bot, pool, winner);
      if (isSuccess) notifiedCount += 1;
    }
    logger.info(`\nNotified winners for pool ${poolId} on ${chain}`);

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

    logger.info(`\n📝 Total Telegram Notified Count: ${notifiedCount}`);
    // Increment global stats on the pool if there were notifications.
    if (notifiedCount > 0) {
      try {
        await firestore.doc('/counts/counts').set(
          {
            totalTelegramNotifiedCount: FieldValue.increment(notifiedCount),
            perChainTelegramNotifiedCount: {
              [chain]: FieldValue.increment(notifiedCount)
            }
          },
          { merge: true }
        );
        logger.info(
          `📝 Incremented global total and perChain telegram notified count by: ${notifiedCount}`
        );
      } catch (e) {
        logger.error('❌ Failed to increment global total and perChain telegram notified counts.');
      }
    }

    logger.info(`\nJob for poolId: ${poolId}, chain: ${chain} completed successfully`);
  };
};
