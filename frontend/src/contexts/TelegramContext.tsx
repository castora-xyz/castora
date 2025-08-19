import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth, useServer, useToast } from '.';

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
  const auth = useAuth();
  const server = useServer();
  const { toastInfo } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [hasLinked, setHasLinked] = useState(true);

  const checkHasLinked = async () => {
    if (!auth.signature) return;
    setIsLoading(true);
    const result = await server.get('/user/telegram', true);
    if (result && 'hasTelegram' in result) setHasLinked(result['hasTelegram']);
    else setHasLinked(false);
    setIsLoading(false);
  };

  const removeLink = async () => {
    setIsLoading(true);
    const result = await server.delete('/user/telegram');
    if (result) {
      await checkHasLinked();
      toastInfo(
        'Unlink Successful',
        "You've successfully unlinked your Telegram and won't receive notifications"
      );
    }
    setIsLoading(false);
  };

  const startAuth = async () => {
    if (!auth.signature) return;

    setIsLoading(true);
    const telegramAuthUrl = (await server.get('/user/telegram/auth')) as string | null;
    if (!telegramAuthUrl) return;
    setIsLoading(false);

    window.open(telegramAuthUrl, '_blank');
  };

  useEffect(() => {
    if (auth.signature) {
      (async () => await checkHasLinked())();
    } else {
      setIsLoading(false);
      setHasLinked(false);
    }
  }, [auth.signature]);

  useEffect(() => {
    window.addEventListener('focus', async () => await checkHasLinked());
  }, []);

  return (
    <TelegramContext.Provider value={{ isLoading, hasLinked, removeLink, startAuth }}>
      {children}
    </TelegramContext.Provider>
  );
};
