import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { ReactNode, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { monadMainnet } from './chains';

export const queryClient = new QueryClient();
const projectId = import.meta.env.VITE_WC_PROJECT_ID;

const wagmiConfig = defaultWagmiConfig({
  chains: [monadMainnet],
  projectId,
  metadata: {
    name: 'Castora',
    description: '',
    url: 'https://castora.xyz',
    icons: ['']
  },
  auth: {
    socials: ['discord', 'x']
  }
});

createWeb3Modal({
  wagmiConfig,
  projectId,
  enableAnalytics: import.meta.env.PROD,
  enableOnramp: true
});

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const wagmiStore = localStorage.getItem('wagmi.store');
    const wagmiData = wagmiStore ? JSON.parse(wagmiStore || '') : '';
    if (
      wagmiData &&
      wagmiConfig.chains.every((c) => c.id !== wagmiData?.chainId)
    ) {
      localStorage.removeItem('wagmi.store');
    }
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};
