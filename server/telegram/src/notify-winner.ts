import { FieldValue, firestore, logger } from '@castora/shared';
import { Bot } from 'grammy';
import { Pool } from './schemas.js';

const escapeChars = (str: string) => str.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');

const shortenAddress = (str: string) => {
  if (str.length < 10) return str;
  return str.substring(0, 5) + '...' + str.split('').reverse().slice(0, 5).reverse().join('');
};

export const notifyWinner = async (jobId: any, bot: Bot, pool: Pool, winner: string): Promise<boolean> => {
  // Check if the winner has a Telegram ID
  const userRef = firestore.doc(`/users/${winner}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return false;
  const userData = userSnap.data();
  if (!userData || !userData.telegramId) return false;

  // Update how many times the predicter won as a winner could have made
  // multiple predictions.
  const count = pool.predictions.filter(({ predicter, isAWinner }) => predicter === winner && isAWinner).length;
  if (count === 0) {
    logger.error(
      `❌ FATAL: Got winner ${winner} who had no winner ` +
        `predictions in pool: ${pool.poolId} on chain: ${pool.chain}`
    );
    return false;
  }

  // Compute the amount won by the winner.
  // the division by 0.95 below is to obtain the amount without 5% fees applied
  // the amount is also ensured to be rounded to 2 decimal places
  const won = Math.trunc((pool.winAmount / 0.95) * count * 100) / 100;

  // Send the notification
  try {
    const winnerEsc = escapeChars(`(${shortenAddress(winner)})`);
    const stakeEsc = escapeChars(`${won} ${pool.stakeToken}`);
    const restMsgEsc = escapeChars(`in Pool ${pool.poolId}! Tap to go and claim your winnings now!`);

    await bot.api.sendMessage(userData.telegramId, `🏆 You ${winnerEsc} just won *${stakeEsc}* ${restMsgEsc}`, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [[{ text: 'Claim Now!', url: `https://castora.xyz/pool/${pool.poolId}` }]]
      }
    });
    logger.info(`\n🏆 Notified winner: ${winner} who won ${won} ${pool.stakeToken}`);
  } catch (e) {
    logger.error(
      `❌ Failed to notify winner ${winner} on Telegram in Job ID ${jobId} for pool ${pool.poolId} on chain ${pool.chain}, error: ${e}`
    );
    return false;
  }

  // Record update stats for winner
  await userRef.set(
    {
      lastTelegramNotifiedTime: FieldValue.serverTimestamp(),
      totalTelegramNotifiedCount: FieldValue.increment(1),
      perChainTelegramNotifiedCounts: {
        [pool.chain]: FieldValue.increment(1)
      }
    },
    { merge: true }
  );
  logger.info(`📝 Incremented total and perChain telegram count for winner: ${winner}`);

  return true;
};
