import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId
} from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { monadTestnet } from 'viem/chains';
import { useAccount, useChains } from 'wagmi';
import { firebaseConfig } from './firebase';

interface FirebaseContextProps {
  firestore: Firestore;
  recordEvent: (event: string, params?: any) => void;
  recordNavigation: (path: string, name: string) => void;
}

const FirebaseContext = createContext<FirebaseContextProps>({
  firestore: {} as Firestore,
  recordEvent: () => {},
  recordNavigation: () => {}
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const { address, chain: currentChain } = useAccount();
  const [defaultChain] = useChains();
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const firestoreMonadTestnet = getFirestore(app, 'monadtestnet');
  const getChainFirestore = () =>
    ({
      [monadTestnet.name]: firestoreMonadTestnet
    }[(currentChain ?? defaultChain).name]!);
  const [firestore, setFirestore] = useState(getChainFirestore());

  const recordEvent = (event: string, params?: any) => {
    logEvent(analytics, event, params);
  };

  const recordNavigation = (path: string, name: string) => {
    logEvent(analytics, 'screen_view', {
      firebase_screen: path,
      firebase_screen_class: name
    });
  };

  useEffect(() => {
    setUserId(analytics, address ?? null);
  }, [address]);

  useEffect(() => {
    setFirestore(getChainFirestore);
  }, [currentChain]);

  useEffect(() => {
    if (import.meta.env.DEV) setAnalyticsCollectionEnabled(analytics, false);

    // Remove saved fcmTokens status from browser
    const lsKeys = Object.keys(localStorage);
    for (let key of lsKeys) {
      if (key.startsWith('castora.fcmToken')) localStorage.removeItem(key);
    }

    // Remove firebase-messaging-sw.js Service Worker if there
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(async (regs) => {
        for (const reg of regs) {
          if (reg.active && reg.active.scriptURL.endsWith('firebase-messaging-sw.js')) {
            await reg.unregister();
          }
        }
      });
    }
  }, []);

  return (
    <FirebaseContext.Provider value={{ firestore, recordEvent, recordNavigation }}>
      {children}
    </FirebaseContext.Provider>
  );
};
