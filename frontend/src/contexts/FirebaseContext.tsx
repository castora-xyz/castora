import { getAnalytics, logEvent, setAnalyticsCollectionEnabled, setUserId } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { Auth, getAuth, onAuthStateChanged, signInWithCustomToken, signOut, Unsubscribe } from 'firebase/auth';
import { Firestore, getFirestore as rawGetFirestore } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Chain, monadTestnet } from 'viem/chains';
import { useAccount } from 'wagmi';
import { useAuth } from './AuthContext';
import { firebaseConfig } from './firebase';
import { useServer } from './ServerContext';

interface FirebaseContextProps {
  auth: Auth;
  getFirestore: (name?: string) => Firestore;
  recordEvent: (event: string, params?: any) => void;
  recordNavigation: (path: string, name: string) => void;
}

const FirebaseContext = createContext<FirebaseContextProps>({
  auth: {} as Auth,
  getFirestore: () => ({} as Firestore),
  recordEvent: () => {},
  recordNavigation: () => {}
});

export const getFirestoreName = (chain: Chain) => ({ [monadTestnet.name]: 'monadtestnet' }[chain.name]);

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const { address } = useAccount();
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const authUnsub = useRef<Unsubscribe | null>(null);
  const analytics = getAnalytics(app);
  const { signature } = useAuth();
  const [isFirebaseAuthReady, setIsFirebaseAuthReady] = useState(false);
  const server = useServer();

  // To use default firestore, don't pass a name. Otherwise
  // send in the chain of choice to use its own firestore database
  const getFirestore = (name?: string) => (name ? rawGetFirestore(name) : rawGetFirestore());

  const handleAuth = async () => {
    if (!isFirebaseAuthReady) return;

    if (address && signature) {
      if (!auth.currentUser || auth.currentUser.uid != address) {
        const token = (await server.get('/auth/firebase', { noToast: true })) as string | null;
        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          await signOut(auth);

          // Keep retrying the sign in every 10 seconds till success
          await new Promise((resolve) => setTimeout(resolve, 10000));
          await handleAuth();
        }
      } else {
        // Don't do anything, allow the signed-in Firebase Auth user
        // to be the same as the Connected Wallet Address
      }
    } else {
      await signOut(auth);
    }
  };

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
    handleAuth();
  }, [address, signature, isFirebaseAuthReady]);

  useEffect(() => {
    if (isFirebaseAuthReady) authUnsub.current?.();
  }, [isFirebaseAuthReady]);

  useEffect(() => {
    if (import.meta.env.DEV) setAnalyticsCollectionEnabled(analytics, false);

    authUnsub.current = onAuthStateChanged(auth, () => setIsFirebaseAuthReady(true));

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
    <FirebaseContext.Provider value={{ auth, getFirestore, recordEvent, recordNavigation }}>
      {children}
    </FirebaseContext.Provider>
  );
};
