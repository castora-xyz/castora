import { createConfig, http } from 'wagmi'
import { monad,  megaethTestnet, type Chain as ViemChain} from 'wagmi/chains'


interface ChainConfig {
  chain: ViemChain;
  addresses: {
    castora: `0x${string}`;
    poolsManager: `0x${string}`;
    getters: `0x${string}`;
  };
  aliases?: string[];
}

export const config = createConfig({
  chains: [monad,  megaethTestnet],
  transports: {
    [monad.id]: http(),
    [megaethTestnet.id]: http(),
  },
})


/**
 * CHAIN CONFIGURATION
 * 
 * To add a new chain:
 * 1. Import the chain from 'wagmi/chains'
 * 2. Add a new entry here with all required fields
 * 3. The Chain type will automatically include your new chain
 */
export const CHAIN_CONFIG: Record<string, ChainConfig> = {
  monad: {
    chain: monad,
    addresses: {
      castora: '0x9E1e6f277dF3f2cD150Ae1E08b05f45B3297bE6D',
      poolsManager: '0xF8f179Ab96165b61833F2930309bCE9c6aB281bE',
      getters: '0xf08959E66614027AE76303F4C5359eBfFd00Bc30',
    },
    aliases: ['monadmainnet'],
  },
  megaethtestnet: {
    chain: megaethTestnet,
    addresses: {
      castora: '0x0000000000000000000000000000000000000000', // TODO: Add actual address
      poolsManager: '0x0000000000000000000000000000000000000000', // TODO: Add actual address
      getters: '0x0000000000000000000000000000000000000000', // TODO: Add actual address
    },
  },
};



// Derive Chain type from config keys
export type Chain = keyof typeof CHAIN_CONFIG;

const chainNameToKey: Record<string, Chain> = {};
for (const [key, config] of Object.entries(CHAIN_CONFIG)) {
  const normalizedKey = key.toLowerCase().replace(/\s/g, '');
  const normalizedName = config.chain.name.toLowerCase().replace(/\s/g, '');
  chainNameToKey[normalizedKey] = key as Chain;
  chainNameToKey[normalizedName] = key as Chain;
  if (config.aliases) {
    for (const alias of config.aliases) {
      const normalizedAlias = alias.toLowerCase().replace(/\s/g, '');
      chainNameToKey[normalizedAlias] = key as Chain;
    }
  }
}

/**
 * Normalizes a chain name to a supported Chain type (config key)
 * Handles case-insensitive matching by config key or chain name
 */
export const normalizeChain = (chain: string | undefined | null): Chain => {
  if (!chain) return 'monad';
  const normalized = chain.toLowerCase().replace(/\s/g, '');
  return chainNameToKey[normalized] ?? 'monad';
}

/**
 * Gets the chain name (config key) from a wagmi chain object or string
 */
export const getChainName = (chain: { name: string } | string | undefined | null): Chain => {
  if (!chain) return 'monad';
  if (typeof chain === 'string') {
    return normalizeChain(chain);
  }
  return normalizeChain(chain.name);
};

/**
 * Gets contract addresses for a given chain
 */
export const getChainAddresses = (chain: Chain | string) => {
  const normalizedChain = normalizeChain(chain);
  const config = CHAIN_CONFIG[normalizedChain];
  if (!config) {
    console.warn(`Chain ${normalizedChain} not found in config, defaulting to monad`);
    return CHAIN_CONFIG.monad.addresses;
  }
  return config.addresses;
};

// Legacy exports for backward compatibility
export const CASTORA_ADDRESS_MONAD: `0x${string}` = CHAIN_CONFIG.monad.addresses.castora;
export const CASTORA_ADDRESS_SEPOLIA: `0x${string}` = '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd'; // Legacy
export const POOLS_MANAGER_ADDRESS_MONAD: `0x${string}` = CHAIN_CONFIG.monad.addresses.poolsManager;
export const GETTERS_ADDRESS_MONAD: `0x${string}` = CHAIN_CONFIG.monad.addresses.getters;





