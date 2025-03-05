import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ReactNode, createContext, useContext } from 'react';
import { useAccount, useChains } from 'wagmi';

const ServerContext = createContext<ServerContextProps>({
  get: async () => {},
  post: async () => {}
});

interface ServerContextProps {
  get: (path: string, useRecorder?: boolean | undefined) => Promise<any>;
  post: (path: string, body: any) => Promise<any>;
}

export const useServer = () => useContext(ServerContext);

export const ServerProvider = ({ children }: { children: ReactNode }) => {
  const { chain: currentChain } = useAccount();
  const [defaultChain] = useChains();
  const { signature } = useAuth();
  const { toastError } = useToast();

  const call = async (
    path: string,
    body: any = undefined,
    useRecorder: boolean = false
  ) => {
    return new Promise(async (resolve, _) => {
      try {
        const url = useRecorder
          ? import.meta.env.VITE_RECORDER_SERVER_URL
          : import.meta.env.VITE_MAIN_SERVER_URL;

        const result = await (
          await fetch(`${url}${path}`, {
            method: body ? 'POST' : 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              ...(path === '/user/register' && signature
                ? { Authorization: `Bearer ${signature}` }
                : {
                    chain: (currentChain ?? defaultChain).name
                      .toLowerCase()
                      .split(' ')
                      .join('')
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
        toastError(
          error['message'] == 'Failed to fetch'
            ? 'Network Error'
            : `Error: ${error}`
        );
      }
      resolve(null);
    });
  };

  const get = (path: string, useRecorder = false) =>
    call(path, undefined, useRecorder);
  const post = (path: string, body: any) => call(path, body);

  return (
    <ServerContext.Provider value={{ get, post }}>
      {children}
    </ServerContext.Provider>
  );
};
