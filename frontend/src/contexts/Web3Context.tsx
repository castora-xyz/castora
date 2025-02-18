import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { ReactNode, useEffect } from 'react';
import { defineChain } from 'viem';
import { WagmiProvider } from 'wagmi';
// import { sepolia } from 'wagmi/chains';

export const queryClient = new QueryClient();
const projectId = import.meta.env.VITE_WC_PROJECT_ID;

export const monadDevnet = defineChain({
  id: 20143,
  name: 'Monad Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'DMonad',
    symbol: 'DMON'
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_MONAD_DEVNET_RPC_URL]
    }
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: import.meta.env.VITE_MONAD_DEVNET_EXPLORER_URL
    }
  },
  testnet: true
});

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON'
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_MONAD_TESTNET_RPC_URL]
    }
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: import.meta.env.VITE_MONAD_TESTNET_EXPLORER_URL
    }
  },
  testnet: true
});

const wagmiConfig = defaultWagmiConfig({
  chains: [/* monadDevnet */ monadTestnet /*sepolia */],
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
