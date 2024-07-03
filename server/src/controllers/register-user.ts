import { FieldValue } from 'firebase-admin/firestore';
import { IncomingMessage } from 'http';
import { verifyMessage } from 'viem';

import { firestore, messaging } from '../utils';

export const AUTH_MESSAGE = 'authentication';

export interface RegisterUserParams {
  address: string;
  fcmToken: string;
}

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

  console.log('Got Register User ... ');
  console.log('address: ', address);
  console.log('fcmToken: ', fcmToken);

  let isVerified = false;
  try {
    isVerified = await verifyMessage({
      address: address as `0x${string}`,
      message: AUTH_MESSAGE,
      signature
    });
  } catch (e) {
    console.error(e);
    throw `Couldn't verify signature: ${e}`;
  }
  if (!isVerified) 'Unauthorized Signature';

  console.log('\n Saving User to Firestore ... ');
  await firestore
    .doc(`/users/${address}`)
    .set(
      { address, fcmTokens: FieldValue.arrayUnion(fcmToken) },
      { merge: true }
    );
  console.log('User Saved Successfully.');
  console.log('User Registration Successful.');
};
