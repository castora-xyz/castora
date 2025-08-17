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
  delete: (path: string) => Promise<any>;
  get: (path: string) => Promise<any>;
  post: (path: string, body: any) => Promise<any>;
}

export const useServer = () => useContext(ServerContext);

export const ServerProvider = ({ children }: { children: ReactNode }) => {
  const { address, chain: currentChain } = useAccount();
  const [defaultChain] = useChains();
  const { signature } = useAuth();
  const { toastError } = useToast();

  const call = async (path: string, method: string, body: any = undefined) => {
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
            toastError(`${result['message']}`);
          }
        } else {
          toastError("Couldn't understand server response.");
        }
        console.log(result);
      } catch (error: any) {
        console.error(error);
        toastError(error['message'] == 'Failed to fetch' ? 'Network Error' : `Error: ${error}`);
      }
      resolve(null);
    });
  };

  const delete_ = (path: string) => call(path, 'DELETE');
  const get = (path: string) => call(path, 'GET');
  const post = (path: string, body: any) => call(path, 'POST', body);

  return (
    <ServerContext.Provider value={{ delete: delete_, get, post }}>
      {children}
    </ServerContext.Provider>
  );
};
