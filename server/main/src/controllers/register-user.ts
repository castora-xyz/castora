import * as crypto from 'crypto';
import 'dotenv/config';
import { FieldValue } from 'firebase-admin/firestore';
import { IncomingMessage } from 'http';
import { verifyMessage } from 'viem';

import { AUTH_MESSAGE } from '../middleware';
import { firestore, logger, messaging } from '../utils';

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
if (!telegramBotToken) throw 'Set TELEGRAM_BOT_TOKEN';

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
 * Sets the Telegram details of a user with
 * a wallet address to enable them to receive notifications when they have
 * winnings available in a pool.
 *
 * @param userWalletAddress The verified wallet address of the user from auth.
 * @param details An object containing the telegram details from auth in the frontend.
 */
export const setUserTelegram = async (
  userWalletAddress: string,
  details: Record<string, string>
): Promise<void> => {
  logger.info('Got Set User Telegram ... ');
  logger.info('User Wallet Address: ', userWalletAddress);
  logger.info('Telegram Details: ', details);
  console.log(details);

  const { hash, ...otherTelegramData } = details;
  if (!hash) throw 'Missing required Telegram hash';

  logger.info('\nVerifying Telegram hash ... ');
  const checkString = Object.keys(otherTelegramData)
    .sort()
    .map((k) => `${k}=${otherTelegramData[k]}`)
    .join('\n');
  const secret = crypto.createHash('sha256').update(telegramBotToken).digest();
  const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');
  if (hmac !== hash) throw 'Invalid Telegram hash';
  logger.info('Telegram hash verified successfully.');

  const authDate = Number(details.auth_date);
  if (!authDate) throw 'Missing required Telegram auth_date';
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) throw 'Telegram auth_date expired';

  const telegramId = details.id;
  if (!telegramId) throw 'Missing required Telegram ID';
  logger.info('Telegram ID: ', telegramId);

  logger.info('\n Saving Telegram User to Firestore ... ');
  // Using the default Firestore here to save telegram IDs
  await firestore()
    .doc(`/users/${userWalletAddress}`)
    .set({ address: userWalletAddress, telegramId }, { merge: true });
  logger.info('User Telegram Saved Successfully.');
};

/**
 * Tells whether a user has Telegram details saved in Firestore.
 * 
 * @param userWalletAddress The verified wallet address of the user from auth.
 * @returns A boolean indicating whether the user has Telegram details saved.
 */
export const hasUserTelegram = async (userWalletAddress: string): Promise<boolean> => {
  logger.info('Got Has User Telegram ... ');
  logger.info('User Wallet Address: ', userWalletAddress);

  const userDoc = await firestore().doc(`/users/${userWalletAddress}`).get();
  if (!userDoc.exists) return false;

  const data = userDoc.data();
  if (!data || !data.telegramId) return false;

  logger.info('User has Telegram details saved.');
  return true;
};

/**
 * Registers the Firebase Cloud Messaging Token (fcmToken) of a user with
 * a wallet address to enable them to receive notifications when they have
 * winnings available in a pool.
 *
 * @param headers The headers of the incoming request.
 * @param params An object containing the fcmToken and the address.
 */
export const registerUser = async (
  headers: IncomingMessage['headers'],
  params: RegisterUserParams
): Promise<void> => {
  if (!headers['authorization']) throw 'Missing required authorization header';
  const signature = headers['authorization'].split(' ')[1] as `0x${string}`;
  if (!signature) throw 'Missing required signature in authorization header';
  if (!/^(0x)[a-f0-9]{1,}$/i.test(signature)) {
    throw 'Invalid provided signature';
  }

  const { address, fcmToken } = params;
  if (!address) throw 'Missing required address';
  if (!/^(0x)[0-9a-f]{40}$/i.test(address)) throw 'Invalid provided address';
  if (!fcmToken) throw 'Missing required fcmToken';

  // the following simply tests if the token is valid. If it is not, it will
  // throw an error and auto-return. The second argument is a boolean that
  // indicates for "test-only" or "dry-run" purpose.
  await messaging.send({ token: fcmToken }, true);

  logger.info('Got Register User ... ');
  logger.info('address: ', address);
  logger.info('fcmToken: ', fcmToken);

  let isVerified = false;
  try {
    isVerified = await verifyMessage({
      address: address as `0x${string}`,
      message: AUTH_MESSAGE,
      signature
    });
  } catch (e) {
    logger.info(e);
    throw `Couldn't verify signature: ${e}`;
  }
  if (!isVerified) 'Unauthorized Signature';

  logger.info('\n Saving User to Firestore ... ');
  // Using the default Firestore here to save fcmTokens
  await firestore()
    .doc(`/users/${address}`)
    .set({ address, fcmTokens: FieldValue.arrayUnion(fcmToken) }, { merge: true });
  logger.info('User Saved Successfully.');
  logger.info('User Registration Successful.');
};
