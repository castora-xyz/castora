import 'dotenv/config';
import { createPublicClient, createWalletClient, defineChain, formatEther, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { castoraAbi, gettersAbi, poolsManagerAbi } from './abi.js';
import { Chain } from './index.js';
import { logger } from './logger.js';

export const CASTORA_MONAD: `0x${string}` = '0x9E1e6f277dF3f2cD150Ae1E08b05f45B3297bE6D';
export const CASTORA_SEPOLIA: `0x${string}` = '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd';
export const POOLS_MANAGER_MONAD: `0x${string}` = '0xF8f179Ab96165b61833F2930309bCE9c6aB281bE';
export const CASTORA_GETTERS_MONAD: `0x${string}` = '0xf08959E66614027AE76303F4C5359eBfFd00Bc30';
// TODO: Add actual addresses for megaethtestnet
export const CASTORA_MEGAETH_TESTNET: `0x${string}` = '0x0000000000000000000000000000000000000000';
export const POOLS_MANAGER_MEGAETH_TESTNET: `0x${string}` = '0x0000000000000000000000000000000000000000';
export const CASTORA_GETTERS_MEGAETH_TESTNET: `0x${string}` = '0x0000000000000000000000000000000000000000';

export const normalizeChain = (chain: string): Chain => {
  if (chain === 'monadmainnet') {
    return 'monad';
  }
  return chain as Chain;
};

const monadMainnet = () => {
  if (!process.env.MONAD_MAINNET_RPC_URL) throw 'Set MONAD_MAINNET_RPC_URL in env';

  return defineChain({
    id: 143,
    name: 'Monad Mainnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Monad',
      symbol: 'MON'
    },
    rpcUrls: {
      default: { http: [process.env.MONAD_MAINNET_RPC_URL!] }
    }
  });
};

const megaEthTestnet = () => {
  if (!process.env.MEGAETH_TESTNET_RPC_URL) throw 'Set MEGAETH_TESTNET_RPC_URL in env';

  return defineChain({
    id: 6343,
    name: 'MegaETH Testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH'
    },
    rpcUrls: {
      default: { http: [process.env.MEGAETH_TESTNET_RPC_URL!] }
    }
  });
};

export const getConfig = (chain: Chain | string) => {
  const normalizedChain = normalizeChain(chain);
  if (normalizedChain === 'monad') {
    return { chain: monadMainnet(), transport: http() };
  }
  if (normalizedChain === 'megaethtestnet') {
    return { chain: megaEthTestnet(), transport: http() };
  }
  throw new Error(`Unsupported chain: ${normalizedChain}`);
};

export const getCastoraAddress = (chain: Chain | string): `0x${string}` => {
  const normalizedChain = normalizeChain(chain);
  const addresses: Record<Chain, `0x${string}`> = {
    monad: CASTORA_MONAD,
    megaethtestnet: CASTORA_MEGAETH_TESTNET
  };
  return addresses[normalizedChain];
};

const getPoolsManagerAddress = (chain: Chain | string): `0x${string}` => {
  const normalizedChain = normalizeChain(chain);
  const addresses: Record<Chain, `0x${string}`> = {
    monad: POOLS_MANAGER_MONAD,
    megaethtestnet: POOLS_MANAGER_MEGAETH_TESTNET
  };
  return addresses[normalizedChain];
};

const getAccount = (chain: Chain | string) => {
  const normalizedChain = normalizeChain(chain);
  const adminKeys: Record<Chain, `0x${string}`> = {
    monad: (process.env.ADMIN_KEY_MONAD_MAINNET as `0x${string}`) || (() => { throw 'Set ADMIN_KEY_MONAD_MAINNET in env'; })(),
    megaethtestnet: (process.env.ADMIN_KEY_MEGAETH_TESTNET as `0x${string}`) || (() => { throw 'Set ADMIN_KEY_MEGAETH_TESTNET in env'; })()
  };
  const adminKey = adminKeys[normalizedChain];
  if (!adminKey) throw `Set ADMIN_KEY_${normalizedChain.toUpperCase().replace('-', '_')} in env`;
  return privateKeyToAccount(adminKey);
};

export const readCastoraContract = async (chain: Chain | string, functionName: any, args?: any): Promise<any> => {
  const normalizedChain = normalizeChain(chain);
  try {
    const config = getConfig(normalizedChain);
    // @ts-expect-error - viem type inference is too deep
    return await createPublicClient(config).readContract({
      address: getCastoraAddress(normalizedChain),
      abi: castoraAbi,
      functionName,
      args
    });
  } catch (e) {
    logger.error(e, `Error at readCastoraContract call on chain: ${normalizedChain}, ${e}`);
    throw e;
  }
};

export const readGettersContract = async (chain: Chain | string, functionName: any, args?: any): Promise<any> => {
  const normalizedChain = normalizeChain(chain);
  const gettersAddresses: Record<Chain, `0x${string}`> = {
    monad: CASTORA_GETTERS_MONAD,
    megaethtestnet: CASTORA_GETTERS_MEGAETH_TESTNET
  };
  try {
    const config = getConfig(normalizedChain);
    return await createPublicClient(config).readContract({
      address: gettersAddresses[normalizedChain],
      abi: gettersAbi,
      functionName,
      args
    });
  } catch (e) {
    logger.error(e, `Error at readGettersContract call on chain: ${normalizedChain}, ${e}`);
    throw e;
  }
};

export const readPoolsManagerContract = async (chain: Chain | string, functionName: any, args?: any): Promise<any> => {
  const normalizedChain = normalizeChain(chain);
  try {
    const config = getConfig(normalizedChain);
    // @ts-expect-error - viem type inference is too deep
    return await createPublicClient(config).readContract({
      address: getPoolsManagerAddress(normalizedChain),
      abi: poolsManagerAbi,
      functionName,
      args
    });
  } catch (e) {
    logger.error(e, `Error at readPoolsManagerContract call on chain: ${normalizedChain}, ${e}`);
    throw e;
  }
};

const showBalance = async (chain: Chain | string, address: `0x${string}`) => {
  const normalizedChain = normalizeChain(chain);
  const config = getConfig(normalizedChain);
  const balance = await createPublicClient(config).getBalance({
    address
  });
  const symbol = normalizedChain.includes('monad') ? 'MON' : 'ETH';
  logger.info(`Admin Balance (${address}): ${`${formatEther(balance)} ${symbol}`}`);
  if (balance < 10e18) logger.warn(`Admin Balance is low: ${`${formatEther(balance)} ${symbol}`}. Please top up.`);
  return balance;
};

export const writeContract = async (chain: Chain | string, functionName: any, args: any, errorContext: string) => {
  const normalizedChain = normalizeChain(chain);
  let outcome;

  try {
    const account = getAccount(normalizedChain);
    const config = getConfig(normalizedChain);
    const publicClient = createPublicClient(config);

    const prevBalance = await showBalance(normalizedChain, account.address);
    const { result, request } = await publicClient.simulateContract({
      address: getCastoraAddress(normalizedChain),
      abi: castoraAbi,
      functionName,
      args,
      account
    });

    outcome = result;
    const walletClient = createWalletClient({ ...config, account });
    const hash = await walletClient.writeContract(request);

    logger.info(`Transaction Hash: ${hash}`);
    logger.info('Waiting for On-Chain Confirmation ...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    logger.info(receipt, 'Transaction Receipt');

    const newBalance = await showBalance(normalizedChain, account.address);
    const balanceDiffs = formatEther(newBalance - prevBalance);
    const symbol = normalizedChain.includes('monad') ? 'MON' : 'ETH';
    logger.info(`Admin Balance Change: ${balanceDiffs} ${symbol}`);
  } catch (e) {
    if (Object.keys(e as any).includes('abi')) delete (e as any).abi;
    if (Object.keys(e as any).includes('args')) delete (e as any).args;

    logger.error(e, `Error at writeContract call at ${errorContext} possible outcome ${outcome}: ${e}`);

    if (
      normalizedChain === 'monad' &&
      (`${e}`.includes('An existing transaction had higher priority') || `${e}`.includes('txpool not responding'))
    ) {
      // When these errors happen, the transaction actually went through because on the retry, the pool then exists
      // already. However, we wait for mining to be sure before proceeding.
      logger.info('Waiting 5 seconds to allow transaction to be mined ...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      throw e;
    }
  }

  return outcome;
};
