import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ReactNode, createContext, useContext } from 'react';
import { useAccount, useChains } from 'wagmi';

const ServerContext = createContext<ServerContextProps>({
  delete: async () => {},
  get: async () => {},
  post: async () => {}
});

interface ServerContextProps {
  delete: (path: string, noToast?: boolean) => Promise<any>;
  get: (path: string, noToast?: boolean) => Promise<any>;
  post: (path: string, body: any, noToast?: boolean) => Promise<any>;
}

export const useServer = () => useContext(ServerContext);

export const ServerProvider = ({ children }: { children: ReactNode }) => {
  const { address, chain: currentChain } = useAccount();
  const [defaultChain] = useChains();
  const { signature } = useAuth();
  const { toastError } = useToast();

  const call = async (path: string, method: string, body: any = undefined, noToast = false) => {
    return new Promise(async (resolve, _) => {
      try {
        const result = await (
          await fetch(`${import.meta.env.VITE_SERVER_URL}${path}`, {
            method,
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              ...(path.startsWith('/user') && signature && address
                ? { Authorization: `Bearer ${signature}`, 'user-wallet-address': address }
                : {
                    chain: (currentChain ?? defaultChain).name.toLowerCase().split(' ').join('')
                  })
            },
            ...(body ? { body: JSON.stringify(body) } : {})
          })
        ).json();

        if ('success' in result) {
          if (result['success']) {
            return resolve(result['data'] ?? true);
          } else {
            if (!noToast) toastError(`${result['message']}`);
          }
        } else {
          if (!noToast) toastError("Couldn't understand server response.");
        }
        console.log(result);
      } catch (error: any) {
        console.error(error);
        if (!noToast) toastError(error['message'] == 'Failed to fetch' ? 'Network Error' : `Error: ${error}`);
      }
      resolve(null);
    });
  };

  const delete_ = (path: string, noToast = false) => call(path, 'DELETE', undefined, noToast);
  const get = (path: string, noToast = false) => call(path, 'GET', undefined, noToast);
  const post = (path: string, body: any, noToast = false) => call(path, 'POST', body, noToast);

  return (
    <ServerContext.Provider value={{ delete: delete_, get, post }}>
      {children}
    </ServerContext.Provider>
  );
};
