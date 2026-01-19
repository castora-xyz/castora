import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { ReactNode, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { config } from '@/utils/config';


export const queryClient = new QueryClient();


const projectId = import.meta.env.VITE_WC_PROJECT_ID;



const metadata = {
  name: 'Castora',
  description: 'Castora Prediction Platform',
  url: 'https://castora.xyz',
  icons: ['https://castora.xyz/icon.png'] 
};


const networks = [...config.chains] as any;

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks: networks,
  projectId,
  ssr: true
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: networks,
  projectId,
  metadata,
  features: {
    analytics: import.meta.env.PROD,
    email: false,
    socials: ['discord', 'x']
  }
});

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const wagmiStore = localStorage.getItem('wagmi.store');
    const wagmiData = wagmiStore ? JSON.parse(wagmiStore || '') : '';
    if (
      wagmiData &&
      config.chains.every((c) => c.id !== wagmiData?.chainId)
    ) {
      localStorage.removeItem('wagmi.store');
    }
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};
