export * from './accessories';
export * from './contract';
export * from './tokens';

import { LoggingBunyan } from '@google-cloud/logging-bunyan';
import { createLogger } from 'bunyan';
import 'dotenv/config';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { Transform } from 'stream';

export type Chain = 'monadtestnet';

// Initialize Firebase Admin SDK with custom service account in dotenv
initializeApp({
  credential: applicationDefault(),
  storageBucket: 'castora-xyz.firebasestorage.app'
});

export const firestore = getFirestore();
export const storage = getStorage();

export const logger = createLogger({
  name: 'castora-pool-archiver-worker',
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
      ? [new LoggingBunyan({ logName: 'castora-pool-archiver-worker' }).stream('info')]
      : [])
  ]
});
