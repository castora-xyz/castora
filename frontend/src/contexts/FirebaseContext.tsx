import { getAnalytics, logEvent, setAnalyticsCollectionEnabled, setUserId } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { Auth, getAuth, onAuthStateChanged, signInWithCustomToken, signOut, Unsubscribe } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { firebaseConfig } from './firebase';
import { useServer } from './ServerContext';

interface FirebaseContextProps {
  auth: Auth;
  firestore: Firestore;
  recordEvent: (event: string, params?: any, chain?: string) => void;
  recordNavigation: (path: string, name: string) => void;
}

const FirebaseContext = createContext<FirebaseContextProps>({
  auth: {} as Auth,
  firestore: {} as Firestore,
  recordEvent: () => {},
  recordNavigation: () => {}
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const authUnsub = useRef<Unsubscribe | null>(null);
  const analytics = getAnalytics(app);
  const firestore = getFirestore(app);
  const { address, signature } = useAuth();
  const [isFirebaseAuthReady, setIsFirebaseAuthReady] = useState(false);
  const server = useServer();

  const handleAuth = async () => {
    if (!isFirebaseAuthReady) return;

    if (address && signature) {
      if (!auth.currentUser || auth.currentUser.uid != address) {
        const token = (await server.get('/auth/firebase', { noToast: true })) as string | null;
        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          await signOut(auth);

          // Keep retrying the sign in every 15 seconds till success
          await new Promise((resolve) => setTimeout(resolve, 15000));
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

  const recordEvent = (event: string, params?: any, chain?: string) => {
    const eventParams = chain ? { ...params, chain } : params;
    logEvent(analytics, event, eventParams);
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
    <FirebaseContext.Provider value={{ auth, firestore, recordEvent, recordNavigation }}>
      {children}
    </FirebaseContext.Provider>
  );
};
