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

export const getConfig = (chain: Chain | string) => {
  const normalizedChain = normalizeChain(chain);
  return {
    monad: { chain: monadMainnet(), transport: http() }
  }[normalizedChain];
};

export const getCastoraAddress = (chain: Chain | string) => {
  const normalizedChain = normalizeChain(chain);
  return {
    monad: CASTORA_MONAD
  }[normalizedChain];
};

const getPoolsManagerAddress = (chain: Chain | string) => {
  const normalizedChain = normalizeChain(chain);
  return {
    monad: POOLS_MANAGER_MONAD
  }[normalizedChain];
};

const getAccount = (chain: Chain | string) => {
  const normalizedChain = normalizeChain(chain);
  const adminMainnetKey = process.env.ADMIN_KEY_MONAD_MAINNET as `0x${string}`;
  if (!adminMainnetKey) throw 'Set ADMIN_KEY_MONAD_MAINNET in env';

  return privateKeyToAccount({ monad: adminMainnetKey }[normalizedChain]);
};

export const readCastoraContract = async (chain: Chain | string, functionName: any, args?: any): Promise<any> => {
  const normalizedChain = normalizeChain(chain);
  try {
    // @ts-ignore
    return await createPublicClient({ ...getConfig(normalizedChain) }).readContract({
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
  try {
    // @ts-ignore
    return await createPublicClient({ ...getConfig(normalizedChain) }).readContract({
      address: CASTORA_GETTERS_MONAD,
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
    // @ts-ignore
    return await createPublicClient({ ...getConfig(normalizedChain) }).readContract({
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
  const balance = await createPublicClient({ ...getConfig(normalizedChain) }).getBalance({
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
    const publicClient = createPublicClient({ ...config });

    const prevBalance = await showBalance(normalizedChain, account.address);
    const { result, request } = await publicClient.simulateContract({
      address: getCastoraAddress(normalizedChain),
      abi: castoraAbi,
      functionName,
      args,
      account
    });

    outcome = result;
    const walletClient = createWalletClient({ account, ...config });
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
