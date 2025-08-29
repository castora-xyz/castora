import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ReactNode, createContext, useContext } from 'react';
import { useAccount, useChains } from 'wagmi';

export interface ServerCallOptions {
  noToast: boolean;
}

const ServerContext = createContext<ServerContextProps>({
  delete: async () => {},
  get: async () => {}
});

interface ServerContextProps {
  delete: (path: string, opts?: ServerCallOptions) => Promise<any>;
  get: (path: string, opts?: ServerCallOptions) => Promise<any>;
}

export const useServer = () => useContext(ServerContext);

export const ServerProvider = ({ children }: { children: ReactNode }) => {
  const { address, chain: currentChain } = useAccount();
  const [defaultChain] = useChains();
  const { signature } = useAuth();
  const { toastError } = useToast();

  const call = async (path: string, method: string, body: any = undefined, opts?: ServerCallOptions) => {
    return new Promise(async (resolve, _) => {
      try {
        const result = await (
          await fetch(`${import.meta.env.VITE_SERVER_URL}${path}`, {
            method,
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              ...(path.startsWith('/auth') && signature && address
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
            if (!opts?.noToast) toastError(`${result['message']}`);
          }
        } else {
          if (!opts?.noToast) toastError("Couldn't understand server response.");
        }
        console.log(result);
      } catch (error: any) {
        console.error(error);
        if (!opts?.noToast) {
          toastError(error['message'] == 'Failed to fetch' ? 'Network Error' : `Error: ${error}`);
        }
      }
      resolve(null);
    });
  };

  const delete_ = (path: string, opts?: ServerCallOptions) => call(path, 'DELETE', undefined, opts);
  const get = (path: string, opts?: ServerCallOptions) => call(path, 'GET', undefined, opts);

  return <ServerContext.Provider value={{ delete: delete_, get }}>{children}</ServerContext.Provider>;
};
