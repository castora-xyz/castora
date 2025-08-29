import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useAuth, useFirebase, useServer, useToast } from '.';

const TelegramContext = createContext<TelegramContextProps>({
  isLoading: false,
  hasLinked: false,
  removeLink: async () => {},
  startAuth: async () => {}
});

interface TelegramContextProps {
  isLoading: boolean;
  hasLinked: boolean;
  removeLink: () => Promise<any>;
  startAuth: () => Promise<any>;
}

export const useTelegram = () => useContext(TelegramContext);

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const { signature } = useAuth();
  const { auth, getFirestore } = useFirebase();

  const server = useServer();
  const { toastInfo } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [hasLinked, setHasLinked] = useState(false);
  const firestoreUnsubRef = useRef<Unsubscribe | null>(null);

  const removeLink = async () => {
    setIsLoading(true);
    const result = await server.delete('/auth/telegram');
    if (result) {
      toastInfo('Unlink Successful', "You've successfully unlinked your Telegram and won't receive notifications");
    }
    setIsLoading(false);
  };

  const startAuth = async () => {
    if (!signature) return;

    setIsLoading(true);
    const telegramAuthUrl = (await server.get('/auth/telegram')) as string | null;
    if (!telegramAuthUrl) return;
    setIsLoading(false);

    window.open(telegramAuthUrl, '_blank');
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      firestoreUnsubRef.current?.();
      if (user) {
        firestoreUnsubRef.current = onSnapshot(doc(getFirestore(), `/users/${user.uid}`), (doc) => {
          setHasLinked(doc.exists() ? !!doc.data()['telegramId'] : false);
          setIsLoading(false);
        });
      } else {
        setHasLinked(false);
        firestoreUnsubRef.current = null;
        // showing the loader so that while the user reconnects their wallet, we wait
        // for firebase auth sign in to take place. If the user was signed out or disconnected
        // their wallet, the Telegram Auth Button will naturally not be visible
        setIsLoading(true);
      }
    });
  }, [auth]);

  return (
    <TelegramContext.Provider value={{ isLoading, hasLinked, removeLink, startAuth }}>
      {children}
    </TelegramContext.Provider>
  );
};
