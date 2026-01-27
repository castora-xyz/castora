import 'dotenv/config';
import { createPublicClient, createWalletClient, formatEther, http } from 'viem';
import { monad, megaethTestnet, type Chain as ViemChain } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { castoraAbi, gettersAbi, poolsManagerAbi } from './abi.js';
import { logger } from './logger.js';

export const CASTORA_MONAD: `0x${string}` = '0x9E1e6f277dF3f2cD150Ae1E08b05f45B3297bE6D';
export const CASTORA_SEPOLIA: `0x${string}` = '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd';
export const POOLS_MANAGER_MONAD: `0x${string}` = '0xF8f179Ab96165b61833F2930309bCE9c6aB281bE';
export const CASTORA_GETTERS_MONAD: `0x${string}` = '0xf08959E66614027AE76303F4C5359eBfFd00Bc30';



/**
 * Chain configuration interface
 * To add a new chain, simply add a new entry to CHAIN_CONFIG below
 */
interface ChainConfig {
  chain: ViemChain;
  addresses: {
    castora: `0x${string}`;
    poolsManager: `0x${string}`;
    getters: `0x${string}`;
  };
  adminKeyEnvVar: string;
  aliases?: string[]; // Alternative names that map to this chain (e.g., 'monadmainnet' -> 'monad')
  
}

/**
 * CHAIN CONFIGURATION
 * 
 * To add a new chain:
 * 1. Import the chain from 'viem/chains'
 * 2. Add a new entry here with all required fields
 * 3. The Chain type will automatically include your new chain
 * 4. Add the ADMIN_KEY_<CHAIN> environment variable
 */
export const CHAIN_CONFIG = {
  monad: {
    chain: monad,
    addresses: {
      castora: '0x9E1e6f277dF3f2cD150Ae1E08b05f45B3297bE6D',
      poolsManager: '0xF8f179Ab96165b61833F2930309bCE9c6aB281bE',
      getters: '0xf08959E66614027AE76303F4C5359eBfFd00Bc30',
    },
    adminKeyEnvVar: 'ADMIN_KEY_MONAD_MAINNET',
    aliases: ['monadmainnet'],
  },
  megaethtestnet: {
    chain: megaethTestnet,
    addresses: {
      castora: '0x0000000000000000000000000000000000000000', // TODO: Add actual address
      poolsManager: '0x0000000000000000000000000000000000000000', // TODO: Add actual address
      getters: '0x0000000000000000000000000000000000000000', // TODO: Add actual address
    },
    adminKeyEnvVar: 'ADMIN_KEY_MEGAETH_TESTNET',
  },
} as const;

// Derive Chain type from config keys
export type Chain = keyof typeof CHAIN_CONFIG;

// Create reverse alias map for fast lookup
const aliasToChain: Record<string, Chain> = {};
for (const [chainId, config] of Object.entries(CHAIN_CONFIG)) {
  aliasToChain[chainId] = chainId as Chain;
  const chainConfig = config as ChainConfig;
  if (chainConfig.aliases) {
    for (const alias of chainConfig.aliases) {
      aliasToChain[alias.toLowerCase()] = chainId as Chain;
    }
  }
}

export const normalizeChain = (chain: string): Chain => {
  const normalized = chain.toLowerCase();
  const mappedChain = aliasToChain[normalized];
  if (!mappedChain) {
    throw new Error(`Unsupported chain: ${chain}. Supported chains: ${Object.keys(CHAIN_CONFIG).join(', ')}`);
  }
  return mappedChain;
};

// Initialize public clients for all chains
const publicClients: Record<Chain, ReturnType<typeof createPublicClient>> = {} as Record<Chain, ReturnType<typeof createPublicClient>>;
for (const [chainId, config] of Object.entries(CHAIN_CONFIG)) {
  publicClients[chainId as Chain] = createPublicClient({
    chain: config.chain,
    transport: http(),
  });
}

// Chain objects for wallet client creation
const chainObjects: Record<Chain, ViemChain> = {} as Record<Chain, ViemChain>;
for (const [chainId, config] of Object.entries(CHAIN_CONFIG)) {
  chainObjects[chainId as Chain] = config.chain;
}

export const getPublicClient = (chain: Chain | string) => {
  const normalizedChain = normalizeChain(chain);
  const client = publicClients[normalizedChain as Chain];
  if (!client) throw new Error(`Unsupported chain: ${normalizedChain}`);
  return client;
};

const getNativeCurrencySymbol = (chain: Chain | string): string => {
  const normalizedChain = normalizeChain(chain);
  const chainObj = chainObjects[normalizedChain as Chain];
  if (!chainObj) throw new Error(`Unsupported chain: ${normalizedChain}`);
  return chainObj.nativeCurrency.symbol;
};


export const getCastoraAddress = (chain: Chain | string): `0x${string}` => {
  const normalizedChain = normalizeChain(chain);
  const address = CHAIN_CONFIG[normalizedChain].addresses.castora;
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`No Castora address configured for chain: ${normalizedChain}`);
  }
  return address;
};

const getPoolsManagerAddress = (chain: Chain | string): `0x${string}` => {
  const normalizedChain = normalizeChain(chain);
  const address = CHAIN_CONFIG[normalizedChain].addresses.poolsManager;
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`No PoolsManager address configured for chain: ${normalizedChain}`);
  }
  return address;
};

const getAccount = (chain: Chain | string) => {
  const normalizedChain = normalizeChain(chain);
  const config = CHAIN_CONFIG[normalizedChain];
  const adminKey = process.env[config.adminKeyEnvVar] as `0x${string}` | undefined;
  if (!adminKey) {
    throw new Error(`Set ${config.adminKeyEnvVar} in env`);
  }
  return privateKeyToAccount(adminKey);
};

export const readCastoraContract = async (chain: Chain | string, functionName: any, args?: any): Promise<any> => {
  const normalizedChain = normalizeChain(chain);
  try {
    const publicClient = getPublicClient(normalizedChain);
    // @ts-expect-error - viem type inference is too deep
    return await publicClient.readContract({
      address: getCastoraAddress(normalizedChain),
      abi: castoraAbi,
      functionName,
      args
    });
  } catch (e) {
    logger.error(e, `Error at readCastoraContract call on chain: ${normalizedChain}`);
    throw e;
  }
};

export const readGettersContract = async (chain: Chain | string, functionName: any, args?: any): Promise<any> => {
  const normalizedChain = normalizeChain(chain);
  const address = CHAIN_CONFIG[normalizedChain].addresses.getters;
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`No Getters address configured for chain: ${normalizedChain}`);
  }
  try {
    const publicClient = getPublicClient(normalizedChain);
    return await publicClient.readContract({
      address,
      abi: gettersAbi,
      functionName,
      args
    });
  } catch (e) {
    logger.error(e, `Error at readGettersContract call on chain: ${normalizedChain}`);
    throw e;
  }
};

export const readPoolsManagerContract = async (chain: Chain | string, functionName: any, args?: any): Promise<any> => {
  const normalizedChain = normalizeChain(chain);
  try {
    const publicClient = getPublicClient(normalizedChain);
    // @ts-expect-error - viem type inference is too deep
    return await publicClient.readContract({
      address: getPoolsManagerAddress(normalizedChain),
      abi: poolsManagerAbi,
      functionName,
      args
    });
  } catch (e) {
    logger.error(e, `Error at readPoolsManagerContract call on chain: ${normalizedChain}`);
    throw e;
  }
};

const showBalance = async (chain: Chain | string, address: `0x${string}`) => {
  const normalizedChain = normalizeChain(chain);
  const publicClient = getPublicClient(normalizedChain);
  const balance = await publicClient.getBalance({
    address
  });
  const symbol = getNativeCurrencySymbol(normalizedChain);
  logger.info(`Admin Balance (${address}): ${`${formatEther(balance)} ${symbol}`}`);
  // 1 ether = 1e18 wei, using BigInt for proper comparison
  const oneEther = 10n ** 18n;
  if (balance < oneEther) logger.warn(`Admin Balance is low: ${`${formatEther(balance)} ${symbol}`}. Please top up.`);
  return balance;
};

export const writeContract = async (chain: Chain | string, functionName: any, args: any, errorContext: string) => {
  const normalizedChain = normalizeChain(chain);
  let outcome;

  try {
    const account = getAccount(normalizedChain);
    const publicClient = getPublicClient(normalizedChain);

    const prevBalance = await showBalance(normalizedChain, account.address);
    const { result, request } = await publicClient.simulateContract({
      address: getCastoraAddress(normalizedChain),
      abi: castoraAbi,
      functionName,
      args,
      account
    });

    outcome = result;
    const walletClient = createWalletClient({
      account,
      chain: chainObjects[normalizedChain],
      transport: http()
    });
    const hash = await walletClient.writeContract(request);

    logger.info(`Transaction Hash: ${hash}`);
    logger.info('Waiting for On-Chain Confirmation ...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    logger.info(receipt, 'Transaction Receipt');

    const newBalance = await showBalance(normalizedChain, account.address);
    const balanceDiff = newBalance - prevBalance;
    const balanceDiffs = formatEther(balanceDiff < 0n ? -balanceDiff : balanceDiff);
    const symbol = getNativeCurrencySymbol(normalizedChain);
    const sign = balanceDiff < 0n ? '-' : '+';
    logger.info(`Admin Balance Change: ${sign}${balanceDiffs} ${symbol}`);
  } catch (e) {
    if (e && typeof e === 'object' && !Object.isFrozen(e)) {
      if ('abi' in e) delete (e as any).abi;
      if ('args' in e) delete (e as any).args;
    }

    logger.error(e, `Error at writeContract call at ${errorContext} possible outcome ${outcome}`);

    // Check for retryable errors
    const errorStr = `${e}`;
    
    if (errorStr.includes('An existing transaction had higher priority')) {
      logger.info(`Waiting 5 seconds to allow transaction to be mined ...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      throw e;
    }
  }

  return outcome;
};
