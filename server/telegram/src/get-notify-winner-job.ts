import { FieldValue, firestore, Job, logger, storage } from '@castora/shared';
import { Bot } from 'grammy';
import { notifyWinner } from './notify-winner.js';
import { Pool } from './schemas.js';

interface NotificationProgress {
  processed: number;
  notified: number;
}

const isNotificationProgress = (value: any): value is NotificationProgress => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.processed === 'number' &&
    typeof value.notified === 'number'
  );
};

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
      logger.info(`Pool ${poolId} on ${chain} has already notified winners on Telegram. Ending job...`);
      return;
    }

    // Notify winners on Telegram
    logger.info(`Notifying winners for pool ${poolId} on ${chain}`);

    // Check if this was a notify job that was halted for whatever reason
    // and resume safely from it ended previously
    let progress: NotificationProgress;
    if (isNotificationProgress(job.progress)) {
      progress = job.progress;
      logger.info(`Resuming job from previous progress: ${progress}`);
    } else {
      progress = { processed: 0, notified: 0 };
    }

    for (let i = progress.processed; i < pool.winners.length; i++) {
      const isSuccess = await notifyWinner(job.id, bot, pool, pool.winners[i]);
      if (isSuccess) progress.notified += 1;
      logger.info(`📝 Processed ${i + 1} of ${pool.winners.length} winners.`);

      // In batches of 10, update the worker with the current status to re-use
      // the update should in case the worker/job is restarted either due to
      // restarts from automatic redeployments or system resource re-allocation.
      if ((i + 1) % 10 === 0 || i === pool.winners.length - 1) {
        progress.processed = i + 1;
        await job.updateProgress(progress);
        logger.info(`📝 Updated Job Progress to ${i + 1} out of ${pool.winners.length} winners.`);
      }
    }

    logger.info(`\nNotified winners for pool ${poolId} on ${chain}`);

    // Update the pool to mark winners as notified
    try {
      pool.json.pool.hasNotifiedWinnersOnTelegram = true;
      await storage.bucket().file(`archives/${chain}/pool-${poolId}.json`).save(JSON.stringify(pool.json));
      logger.info('Updated pool to mark winners as notified on Telegram');
    } catch (e) {
      logger.error(`Failed to update pool ${poolId} on ${chain} to mark winners as notified, error: ${e}`);
    }

    logger.info(`\n📝 Total Telegram Notified Count: ${progress.notified}`);
    // Increment global stats on the pool if there were notifications.
    if (progress.notified > 0) {
      try {
        await firestore.doc('/counts/counts').set(
          {
            totalTelegramNotifiedCount: FieldValue.increment(progress.notified),
            perChainTelegramNotifiedCount: {
              [chain]: FieldValue.increment(progress.notified)
            }
          },
          { merge: true }
        );
        logger.info(`📝 Incremented global total and perChain telegram notified count by: ${progress.notified}`);
      } catch (e) {
        logger.error('❌ Failed to increment global total and perChain telegram notified counts.');
      }
    }

    logger.info(`\nJob for poolId: ${poolId}, chain: ${chain} completed successfully`);
  };
};
