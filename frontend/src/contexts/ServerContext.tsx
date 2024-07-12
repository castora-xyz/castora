import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ReactNode, createContext, useContext } from 'react';

const ServerContext = createContext<ServerContextProps>({
  get: async () => {},
  post: async () => {}
});

interface ServerContextProps {
  get: (path: string) => Promise<any>;
  post: (path: string, body: any) => Promise<any>;
}

export const useServer = () => useContext(ServerContext);

export const ServerProvider = ({ children }: { children: ReactNode }) => {
  const { signature } = useAuth();
  const { toastError } = useToast();

  const call = async (path: string, body: any = undefined) => {
    return new Promise(async (resolve, _) => {
      try {
        const result = await (
          await fetch(`${import.meta.env.VITE_SERVER_URL}${path}`, {
            method: body ? 'POST' : 'GET',
            headers: {
              ...(path === '/user/register' && signature
                ? { Authorization: `Bearer ${signature}` }
                : {})
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

  const get = (path: string) => call(path);
  const post = (path: string, body: any) => call(path, body);

  return (
    <ServerContext.Provider value={{ get, post }}>
      {children}
    </ServerContext.Provider>
  );
};
