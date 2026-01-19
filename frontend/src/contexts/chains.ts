import { Chain as ViemChain, defineChain } from 'viem';


export type ChainConfig = {
  chain: ViemChain;
  slug: string;
  serverName: string
}
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

export const CHAINS_CONFIG: Record<string, ChainConfig> = {
  monad: {
    chain: defineChain({
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
    }),
    slug: 'monad',
    serverName: 'monadmainnet'
  },
  megaeth: {
    chain: defineChain({
    id: 4326,
    name: 'MegaETH Mainnet',
    nativeCurrency: {
      decimals: 18,
      name: 'MegaETH',
      symbol: 'MEGA'
    },
    rpcUrls: {
      default: {
        http: ['https://mainnet.megaeth.com/rpc']
      }
    },
    blockExplorers: {
      default: {
        name: 'Blockscout',
        url: 'https://megaeth.blockscout.com/'
      }
    }
  }),
    slug: 'megaeth',
    serverName: 'megaethmainnet'
  }
}


/**
 * Get all supported chain slugs
 */
export const getSupportedChainSlugs = (): string[] => {
  return Object.keys(CHAINS_CONFIG);
};

/**
 * Get chain config by slug
 */
export const getChainConfigBySlug = (slug: string): ChainConfig | undefined => {
  return CHAINS_CONFIG[slug.toLowerCase()];
};

/**
 * Get chain config by chain ID
 */
export const getChainConfigById = (chainId: number): ChainConfig | undefined => {
  return Object.values(CHAINS_CONFIG).find((config) => config.chain.id === chainId);
};

/**
 * Get chain config by server name
 */
export const getChainConfigByServerName = (serverName: string): ChainConfig | undefined => {
  return Object.values(CHAINS_CONFIG).find((config) => config.serverName === serverName);
};

/**
 * Get default chain (first in config, typically monad)
 */
export const getDefaultChain = (): ChainConfig => {
  return Object.values(CHAINS_CONFIG)[0];
};

/**
 * Get all chain objects for wagmi
 */
export const getAllChains = (): ViemChain[] => {
  return Object.values(CHAINS_CONFIG).map((config) => config.chain);
};

