import { FieldValue, firestore, Job, logger, storage } from '@castora/shared';
import { Bot } from 'grammy';
import { Pool } from './schemas.js';
import { notifyPoolCreator } from './telegram-notifiers.js';

export const getNotifyPoolCreatorJob = (bot: Bot) => {
  return async (job: Job<any, any, string>) => {
    const { poolId, chain } = job.data;
    logger.info(`Start processing Pool Creator Telegram Notifier job for poolId: ${poolId}, chain: ${chain}`);

    // Fetch the pool from the archive
    let pool: Pool;
    try {
      const archivalRef = storage.bucket().file(`archives/${chain}/pool-${poolId}.json`);
      pool = new Pool(JSON.parse((await archivalRef.download())[0].toString()));
      logger.info(`Fetched pool: ${poolId} on ${chain}`);
    } catch (e) {
      throw `Failed to fetch pool from archive: ${e}`;
    }

    // Check if the creator has already been notified, if so, stop processing.
    if (pool.hasNotifiedCreatorOnTelegram) {
      logger.info(`Pool ${poolId} on ${chain} has already notified creator on Telegram. Ending job...`);
      return;
    }

    const isSuccess = await notifyPoolCreator(job.id, bot, pool);
    if (isSuccess) {
      // Update the pool to mark the creator as notified
      try {
        pool.json.pool.hasNotifiedCreatorOnTelegram = true;
        await storage.bucket().file(`archives/${chain}/pool-${poolId}.json`).save(JSON.stringify(pool.json));
        logger.info('Updated pool to mark creator as notified on Telegram');
      } catch (e) {
        logger.error(`Failed to update pool ${poolId} on ${chain} to mark creator as notified, error: ${e}`);
      }

      // Increment global stats on the pool if there were notifications.
      try {
        await firestore.doc('/counts/counts').set(
          {
            totalTelegramNotifiedCount: FieldValue.increment(1),
            perChainTelegramNotifiedCount: {
              [chain]: FieldValue.increment(1)
            }
          },
          { merge: true }
        );
        logger.info(`📝 Incremented global total and perChain telegram notified count by 1`);
      } catch (e) {
        logger.error('❌ Failed to increment global total and perChain telegram notified counts.');
      }
    }

    logger.info(`Pool Creator Telegram Notifier Job for poolId: ${poolId}, chain: ${chain} completed successfully`);
  };
};
