export * from './accessories';
export * from './contract';
export * from './get-no-of-winners';
export * from './get-snapshot-price';
export * from './get-splitted-predictions';
export * from './set-winners';
export * from './tokens';

import { LoggingBunyan } from '@google-cloud/logging-bunyan';
import { createLogger } from 'bunyan';
import 'dotenv/config';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import IORedis from 'ioredis';
import { Transform } from 'stream';

if (!process.env.REDIS_URL) throw 'Set REDIS_URL';
export const redisConnection = new IORedis(process.env.REDIS_URL, {
  family: 0,
  maxRetriesPerRequest: null
});

export type Chain = 'monadtestnet';

// Initialize Firebase Admin SDK with custom service account in dotenv
initializeApp({
  credential: applicationDefault(),
  storageBucket: 'castora-xyz.firebasestorage.app'
});

export const firestore = getFirestore();
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
  name: 'castora-pool-completer-worker',
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
      ? [new LoggingBunyan({ logName: 'castora-pool-completer-worker' }).stream('info')]
      : [])
  ]
});
