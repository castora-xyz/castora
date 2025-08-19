import { useToast } from '@/contexts';
import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId
} from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { getMessaging, onMessage } from 'firebase/messaging';
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
  const { toastInfo } = useToast();
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const firestoreMonadTestnet = getFirestore(app, 'monadtestnet');
  const messaging = getMessaging(app);
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

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/firebase-messaging-sw.js');
      });
    }

    onMessage(messaging, (payload) => {
      if (payload.notification && payload.data) {
        const { poolId } = payload.data;
        const { title, body } = payload.notification;
        if (
          title &&
          body &&
          poolId &&
          // Only show notifications when the user is NOT on the pool page
          !window.location.pathname.includes(`/pool/${poolId}`)
        ) {
          toastInfo(title, body, `/pool/${poolId}`);
        }
      }
    });
  }, []);

  return (
    <FirebaseContext.Provider value={{ firestore, recordEvent, recordNavigation }}>
      {children}
    </FirebaseContext.Provider>
  );
};
