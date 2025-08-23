import 'dotenv/config';
import { FieldValue } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';
import { firestore, logger } from '../utils';

const telegramBotUsername = process.env.TELEGRAM_BOT_USERNAME;
if (!telegramBotUsername) throw 'Set TELEGRAM_BOT_USERNAME';

export interface RegisterUserParams {
  address: string;
  fcmToken: string;
}

/**
 * Removes the Telegram details of a user from Firestore.
 *
 * @param userWalletAddress The verified wallet address of the user from auth.
 */
export const removeUserTelegram = async (userWalletAddress: string): Promise<void> => {
  logger.info('Got Remove User Telegram ... ');
  logger.info('User Wallet Address: ', userWalletAddress);

  // Using the default Firestore here to remove telegram IDs
  await firestore().doc(`/users/${userWalletAddress}`).update({ telegramId: FieldValue.delete() });
  logger.info('User Telegram Removed Successfully.');
};

/**
 * Starts the auth process for a user to link their Telegram account.
 *
 * @param userWalletAddress The verified wallet address of the user from auth.
 * @returns A URL to redirect the user to for Telegram authentication.
 */
export const startTelegramAuth = async (userWalletAddress: string): Promise<string> => {
  logger.info('Got Start Telegram Auth ... ');
  logger.info('User Wallet Address: ', userWalletAddress);

  // Generate a random hash to verify the user later
  const token = nanoid(16);

  // Save the token and timestamp in Firestore
  await firestore().doc(`/users/${userWalletAddress}`).set(
    {
      address: userWalletAddress,
      pendingTelegramAuthToken: token,
      pendingTelegramAuthTime: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  // Construct the URL for Telegram authentication
  const telegramAuthUrl = `https://t.me/${telegramBotUsername}?start=${token}`;

  logger.info('Telegram Auth URL: ', telegramAuthUrl);
  return telegramAuthUrl;
};

/**
 * Tells whether a user has Telegram details saved in Firestore.
 *
 * @param userWalletAddress The verified wallet address of the user from auth.
 * @returns An object indicating whether the user has Telegram details saved.
 */
export const hasUserTelegram = async (userWalletAddress: string): Promise<any> => {
  logger.info('Got Has User Telegram ... ');
  logger.info('User Wallet Address: ', userWalletAddress);

  const userDoc = await firestore().doc(`/users/${userWalletAddress}`).get();
  if (!userDoc.exists) return { hasTelegram: false };

  const data = userDoc.data();
  if (!data || !data.telegramId) return { hasTelegram: false };

  logger.info('User has Telegram details saved.');
  return { hasTelegram: true };
};
