export * from '../middleware/validate-chain';
export * from './abi';
export * from './complete-pool';
export * from './contract';
export * from './create-pool';
export * from './fetch-pool';
export * from './get-pool-id';
export * from './get-pool-seeds';
export * from './tokens';
import { LoggingBunyan } from '@google-cloud/logging-bunyan';
import { createLogger } from 'bunyan';
import 'dotenv/config';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getStorage } from 'firebase-admin/storage';
import { Transform } from 'stream';

export type Chain = 'monaddevnet' | 'monadtestnet' | 'sepolia';

// Initialize Firebase Admin SDK with custom service account in dotenv
initializeApp({
  credential: applicationDefault(),
  storageBucket: 'castora-xyz.firebasestorage.app'
});

// To use default firestore, don't pass a chain. Otherwise
// send in the chain of choice to use its own firestore database
export const firestore = (chain?: Chain) => (chain ? getFirestore(chain) : getFirestore());
export const messaging = getMessaging();
export const storage = getStorage();

// The Bunyan Logger doesn't handle BigInts well because it uses JSON.stringify
// This method helps to serialize nested BigInts and prevent the error.
// Call it when sending/logging custom object that might have BigInts.
// Also call console.log for those objects as the custom stream transformer
// might not pick the object.
export const convertNestedBigInts = (obj: any) => {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? `${v}` : v)));
};

export const logger = createLogger({
  name: 'castora-main-backend',
  streams: [
    {
      // Print to the console, but only the message
      stream: new Transform({
        objectMode: true,
        transform(chunk, _, callback) {
          const log = JSON.parse(chunk);
          (log.level == 50 ? console.error : console.log)(log.msg);
          callback();
        }
      })
    },
    // Stream to Google Cloud alongside log levels in production
    ...(process.env.NODE_ENV === 'production'
      ? [new LoggingBunyan({ logName: 'castora-main-backend' }).stream('info')]
      : [])
  ]
});
