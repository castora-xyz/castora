import { Bot } from 'grammy';
import { Pool } from './schemas';
import { firestore, logger } from './utils';

const shortenAddress = (str: string) => {
  if (str.length < 10) return str;
  return str.substring(0, 5) + '...' + str.split('').reverse().slice(0, 5).reverse().join('');
};

export const notifyWinner = async (bot: Bot, pool: Pool, winner: string) => {
  // Check if the winner has a Telegram ID
  const userRef = firestore.doc(`/users/${winner}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;
  const userData = userSnap.data();
  if (!userData || !userData.telegramId) return;

  // Compute the amount won by the winner. Winner could have made multiple predictions.
  const count = pool.predictions.filter(
    ({ predicter, isAWinner }) => predicter === winner && isAWinner
  ).length;
  // the division by 0.95 below is to obtain the amount without 5% fees applied
  // the amount is also ensured to be rounded to 2 decimal places
  const won = Math.trunc((pool.winAmount / 0.95) * count * 100) / 100;

  // Send the notification
  try {
    await bot.api.sendMessage(
      userData.telegramId,
      `🏆 You (${shortenAddress(winner)}) just won ${won} ${pool.stakeToken} in Pool ${
        pool.poolId
      }! Tap to go and claim your winnings now!`,
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
