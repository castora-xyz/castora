export { FieldValue, Timestamp } from 'firebase-admin/firestore';
export { getAddress, verifyMessage } from 'viem';
export * from './abi.js';
export * from './contract.js';
export * from './fetch-pool.js';
export * from './jobs.js';
export * from './leaderboard.js';
export * from './logger.js';
export * from './tokens.js';

import 'dotenv/config';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

export type Chain = 'monadmainnet' | 'monadtestnet';
export const AUTH_MESSAGE = 'authentication';

// Initialize Firebase Admin SDK with custom service account in dotenv
initializeApp({
  credential: applicationDefault(),
  storageBucket: 'castora-xyz.firebasestorage.app'
});

export const firestore = getFirestore();
export const firebaseAuth = getAuth();
export const storage = getStorage();
