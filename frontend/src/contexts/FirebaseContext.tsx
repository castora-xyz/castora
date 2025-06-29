import {
  monadDevnet,
  monadTestnet,
  useAuth,
  useServer,
  useToast
} from '@/contexts';
import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId
} from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { Dialog } from 'primereact/dialog';
import { Ripple } from 'primereact/ripple';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import { sepolia } from 'viem/chains';
import { useAccount, useChains } from 'wagmi';
import { firebaseConfig } from './firebase';

interface FirebaseContextProps {
  ensureNotifications: () => Promise<boolean>;
  firestore: Firestore;
  recordEvent: (event: string, params?: any) => void;
  recordNavigation: (path: string, name: string) => void;
}

const FirebaseContext = createContext<FirebaseContextProps>({
  ensureNotifications: async () => false,
  firestore: {} as Firestore,
  recordEvent: () => {},
  recordNavigation: () => {}
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [requestCount, setRequestCount] = useState(0);
  const [acceptedAtModal, setAcceptedAtModal] = useState(false);
  const { address, chain: currentChain, isConnected } = useAccount();
  const { signature } = useAuth();
  const [defaultChain] = useChains();
  const server = useServer();
  const [isShowingModal, setIsShowingModal] = useState(false);
  const { toastInfo } = useToast();
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const firestoreSepolia = getFirestore(app, 'sepolia');
  const firestoreMonadDevnet = getFirestore(app, 'monaddevnet');
  const firestoreMonadTestnet = getFirestore(app, 'monadtestnet');
  const messaging = getMessaging(app);
  const getChainFirestore = () =>
    ({
      [monadDevnet.name]: firestoreMonadDevnet,
      [monadTestnet.name]: firestoreMonadTestnet,
      [sepolia.name]: firestoreSepolia
    }[(currentChain ?? defaultChain).name]!);
  const [firestore, setFirestore] = useState(getChainFirestore());

  const closeModal = () => {
    document.body.classList.remove('overflow-hidden');
    setIsShowingModal(false);
  };

  const hasSet = (addr: string) =>
    !!localStorage.getItem(`castora.fcmToken:${addr}`);

  const ensureNotifications = async (): Promise<boolean> => {
    if (
      !isConnected ||
      !('Notification' in window) ||
      (Notification.permission == 'granted' && address && hasSet(address))
    ) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      if (requestCount >= 2 && !acceptedAtModal) return false;

      if (!acceptedAtModal) {
        document.body.classList.add('overflow-hidden');
        setRequestCount(requestCount + 1);
        setIsShowingModal(true);
        return true;
      }

      const status = await Notification.requestPermission();
      if (status != 'granted') return false;
    }

    const fcmToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FCM_VAPID_KEY
    });

    if (address && fcmToken && signature) {
      const success = await server.post('/user/register', {
        address,
        fcmToken
      });
      if (success) localStorage.setItem(`castora.fcmToken:${address}`, 'true');
      return success;
    }

    return false;
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
    if (acceptedAtModal) recordEvent('allowed_notifications');
    if (acceptedAtModal && signature) {
      ensureNotifications().finally(() => setAcceptedAtModal(false));
    }
  }, [acceptedAtModal]);

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
    <FirebaseContext.Provider
      value={{ ensureNotifications, firestore, recordEvent, recordNavigation }}
    >
      {children}

      <Dialog
        visible={isShowingModal}
        onHide={() => {
          setAcceptedAtModal(false);
          closeModal();
        }}
        unstyled={true}
        header={
          <h4 className="font-medium text-xl text-text-title mr-2">
            Enable Notifications
          </h4>
        }
        pt={{
          root: {
            className: 'bg-app-bg mx-8 xs:mx-auto max-w-sm p-6 rounded-2xl'
          },
          header: {
            className: 'flex justify-between mb-4'
          },
          mask: { className: 'bg-black/50 dark:bg-white/20' }
        }}
      >
        <p className="text-center text-lg pt-4 mb-6">
          Allow Permissions to receive browser notifications when you win in a
          pool.
        </p>
        <p className="flex gap-4">
          <button
            className="grow py-2 px-4 rounded-full font-medium border border-border-default dark:border-surface-subtle text-text-subtitle p-ripple"
            onClick={() => {
              setAcceptedAtModal(false);
              closeModal();
            }}
          >
            Not Now
            <Ripple />
          </button>

          <button
            className="grow py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white"
            onClick={() => {
              setAcceptedAtModal(true);
              closeModal();
            }}
          >
            Enable
            <Ripple />
          </button>
        </p>
      </Dialog>
    </FirebaseContext.Provider>
  );
};
