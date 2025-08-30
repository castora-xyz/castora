import { FieldValue, firebaseAuth, firestore, logger } from '@castora/shared';
import { nanoid } from 'nanoid';

if (!process.env.TELEGRAM_BOT_USERNAME) throw 'Set TELEGRAM_BOT_USERNAME';

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
  logger.info(`User Wallet Address: ${userWalletAddress}`);

  // Using the default Firestore here to remove telegram IDs
  await firestore().doc(`/users/${userWalletAddress}`).update({ telegramId: FieldValue.delete() });
  logger.info('User Telegram Removed Successfully.');
};

/**
 * Returns frontend Firebase Auth sign in token for the user. Necessary to allow direct access
 * of signed in user Firestore object details in frontend after we've verified their
 * signature here in the backend.
 *
 * @param userWalletAddress The verified wallet address of the user from auth.
 */
export const signInWithFirebase = async (userWalletAddress: string): Promise<string> => {
  logger.info('Got Sign In with Firebase ... ');
  logger.info(`User Wallet Address: ${userWalletAddress}`);

  // Get the custom sign in token from Firebase for the user and return it
  const token = await firebaseAuth.createCustomToken(userWalletAddress);
  logger.info('Created Custom Sign In with Firebase Token');
  return token;
};

/**
 * Starts the auth process for a user to link their Telegram account.
 *
 * @param userWalletAddress The verified wallet address of the user from auth.
 * @returns A URL to redirect the user to for Telegram authentication.
 */
export const startTelegramAuth = async (userWalletAddress: string): Promise<string> => {
  logger.info('Got Start Telegram Auth ... ');
  logger.info(`User Wallet Address: ${userWalletAddress}`);

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
  const telegramAuthUrl = `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${token}`;

  logger.info(`Telegram Auth URL: ${telegramAuthUrl}`);
  return telegramAuthUrl;
};
