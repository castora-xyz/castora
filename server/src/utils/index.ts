export * from './abi';
export * from './complete-pool';
export * from './contract';
export * from './create-pool';
export * from './fetch-pool';
export * from './generate-seeds';
export * from './get-pool-id';
export * from './tokens';

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();
export const firestore = getFirestore();
export const messaging = getMessaging();
