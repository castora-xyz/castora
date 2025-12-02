import { defineChain } from 'viem';

export const monadMainnet = defineChain({
  id: 143,
  name: 'Monad Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON'
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.monad.xyz']
    }
  },
  blockExplorers: {
    default: {
      name: 'MonadVision',
      url: 'https://monadvision.com'
    }
  }
});

