import { useToast } from '@/contexts/ToastContext';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';

export const useAuth = () => useContext(AuthContext);

const AuthContext = createContext<AuthContextProps>({
  signature: null
});

interface AuthContextProps {
  signature: string | null;
}

export const AUTH_MESSAGE = 'authentication';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessage } = useSignMessage();
  const { toastError } = useToast();

  const getSig = (addr: any) =>
    localStorage.getItem(`castora.signature:${addr}`);

  const [signature, setSignature] = useState(getSig(address));

  useEffect(() => {
    if (!address) return setSignature(null);
    if (address && getSig(address)) return setSignature(getSig(address));
    signMessage(
      { message: AUTH_MESSAGE },
      {
        onSuccess: (signed) => {
          localStorage.setItem(`castora.signature:${address}`, signed);
          setSignature(signed);
        },
        onError: (e) => {
          const message = e.message.toLocaleLowerCase().includes('rejected')
            ? 'Please Sign with Wallet to Continue'
            : `Couldn't sign: ${e.message}`;
          toastError(message);
          console.error(e);
          disconnect();
        }
      }
    );
  }, [address]);

  return (
    <AuthContext.Provider value={{ signature }}>
      {children}
    </AuthContext.Provider>
  );
};
