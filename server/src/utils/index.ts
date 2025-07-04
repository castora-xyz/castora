export * from './abi';
export * from './complete-pool';
export * from './contract';
export * from './create-pool';
export * from './fetch-pool';
export * from './get-pool-seeds';
export * from './get-pool-id';
export * from './tokens';
export * from './validate-chain';

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getStorage } from 'firebase-admin/storage';
import { Chain } from './validate-chain';

initializeApp();
// To use default firestore, don't pass a chain. Otherwise
// send in the chain of choice to use its own firestore database
export const firestore = (chain?: Chain) =>
  chain ? getFirestore(chain) : getFirestore();
export const messaging = getMessaging();

export const storage = getStorage();