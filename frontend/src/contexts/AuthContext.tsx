import { useToast } from '@/contexts/ToastContext';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useConnection, useDisconnect, useSignMessage } from 'wagmi';

export const useAuth = () => useContext(AuthContext);

const AuthContext = createContext<AuthContextProps>({
  address: undefined,
  signature: null
});

interface AuthContextProps {
  address: `0x${string}` | undefined;
  signature: string | null;
}

export const AUTH_MESSAGE = 'authentication';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { address: wagmiAddr, connector } = useConnection();
  const { disconnect } = useDisconnect();
  const { signMessage } = useSignMessage();
  const { toastError } = useToast();

  const getSig = (addr: any) => localStorage.getItem(`castora::auth::signature::${addr}`);
  const [address, setAddress] = useState(wagmiAddr);
  const [signature, setSignature] = useState(getSig(wagmiAddr));

  useEffect(() => {
    if (wagmiAddr) {
      const saved = getSig(wagmiAddr);
      if (saved) {
        setSignature(saved);
        setAddress(wagmiAddr);
      } else {
        setSignature(null);
        setAddress(wagmiAddr);
        signMessage(
          { account: wagmiAddr, connector, message: AUTH_MESSAGE },
          {
            onSuccess: (signed) => {
              localStorage.setItem(`castora::auth::signature::${wagmiAddr}`, signed);
              setSignature(signed);
            },
            onError: async (e) => {
              toastError('Please Sign "authentication" with Wallet to Continue');
              console.error(e);
              disconnect({ connector });
            }
          }
        );
      }
    } else {
      setSignature(null);
      setAddress(wagmiAddr);
    }
  }, [wagmiAddr]);

  useEffect(() => {
    // Remove saved signature status from browser
    const lsKeys = Object.keys(localStorage);
    for (let key of lsKeys) {
      if (key.startsWith('castora.signature')) localStorage.removeItem(key);
      if (key.startsWith('auth::signature')) localStorage.removeItem(key);
    }
  }, []);

  return <AuthContext.Provider value={{ address, signature }}>{children}</AuthContext.Provider>;
};
