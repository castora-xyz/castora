import 'dotenv/config';
import { createPublicClient, createWalletClient, defineChain, formatEther, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  castoraGettersAbi,
  castoraMainnetAbi,
  castoraMainnetPoolsManagerAbi,
  castoraTestnetAbi,
  castoraTestnetPoolsManagerAbi
} from './abi.js';
import { Chain } from './index.js';
import { logger } from './logger.js';

export const CONTRACT_ADDRESS_SEPOLIA: `0x${string}` = '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd';
export const CONTRACT_ADDRESS_MONAD: `0x${string}` = '0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53';
export const POOLS_MANAGER_ADDRESS_MONAD: `0x${string}` = '0xb4a03C32C7cAa4069f89184f93dfAe065C141061';
export const CASTORA_GETTERS_ADDRESS_MONAD: `0x${string}` = '0x';

const monadTestnet = () => {
  if (!process.env.MONAD_TESTNET_RPC_URL) throw 'Set MONAD_TESTNET_RPC_URL in env';

  return defineChain({
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Monad',
      symbol: 'MON'
    },
    rpcUrls: {
      default: { http: [process.env.MONAD_TESTNET_RPC_URL!] }
    }
  });
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

const getCastoraAbi = (chain: Chain) => {
  if (chain === 'monadtestnet') return castoraTestnetAbi;
  return castoraMainnetAbi;
};

export const getConfig = (chain: Chain) =>
  ({
    monadtestnet: { chain: monadTestnet(), transport: http() },
    monadmainnet: { chain: monadMainnet(), transport: http() }
  }[chain]);

export const getContractAddress = (chain: Chain) =>
  ({
    monadtestnet: CONTRACT_ADDRESS_MONAD,
    monadmainnet: CONTRACT_ADDRESS_MONAD
  }[chain]);

const getPoolsManagerAddress = (chain: Chain) =>
  ({
    monadtestnet: POOLS_MANAGER_ADDRESS_MONAD,
    monadmainnet: POOLS_MANAGER_ADDRESS_MONAD
  }[chain]);

const getPoolsManagerAbi = (chain: Chain) => {
  if (chain === 'monadtestnet') return castoraTestnetPoolsManagerAbi;
  return castoraMainnetPoolsManagerAbi;
};

const getAccount = (chain: Chain) => {
  const adminTestnetKey = process.env.ADMIN_KEY_MONAD_TESTNET as `0x${string}`;
  if (!adminTestnetKey) throw 'Set ADMIN_KEY_MONAD_TESTNET in env';

  const adminMainnetKey = process.env.ADMIN_KEY_MONAD_MAINNET as `0x${string}`;
  if (!adminMainnetKey) throw 'Set ADMIN_KEY_MONAD_MAINNET in env';

  return privateKeyToAccount({ monadtestnet: adminTestnetKey, monadmainnet: adminMainnetKey }[chain]);
};

export const readCastoraContract = async (chain: Chain, functionName: any, args?: any): Promise<any> => {
  try {
    // @ts-ignore
    return await createPublicClient({ ...getConfig(chain) }).readContract({
      address: getContractAddress(chain),
      abi: getCastoraAbi(chain),
      functionName,
      args
    });
  } catch (e) {
    logger.error(e, `Error at readCastoraContract call on chain: ${chain}, ${e}`);
    throw e;
  }
};

export const readGettersContract = async (chain: Chain, functionName: any, args?: any): Promise<any> => {
  try {
    // @ts-ignore
    return await createPublicClient({ ...getConfig(chain) }).readContract({
      address: CASTORA_GETTERS_ADDRESS_MONAD,
      abi: castoraGettersAbi,
      functionName,
      args
    });
  } catch (e) {
    logger.error(e, `Error at readGettersContract call on chain: ${chain}, ${e}`);
    throw e;
  }
};

export const readPoolsManagerContract = async (chain: Chain, functionName: any, args?: any): Promise<any> => {
  try {
    // @ts-ignore
    return await createPublicClient({ ...getConfig(chain) }).readContract({
      address: getPoolsManagerAddress(chain),
      abi: getPoolsManagerAbi(chain),
      functionName,
      args
    });
  } catch (e) {
    logger.error(e, `Error at readPoolsManagerContract call on chain: ${chain}, ${e}`);
    throw e;
  }
};

const showBalance = async (chain: Chain, address: `0x${string}`) => {
  const balance = await createPublicClient({ ...getConfig(chain) }).getBalance({
    address
  });
  const symbol = chain.includes('monad') ? 'MON' : 'ETH';
  logger.info(`Admin Balance (${address}): ${`${formatEther(balance)} ${symbol}`}`);
  if (balance < 10e18) logger.warn(`Admin Balance is low: ${`${formatEther(balance)} ${symbol}`}. Please top up.`);
  return balance;
};

export const writeContract = async (
  chain: Chain,
  functionName: any,
  args: any,
  errorContext: string,
  useExtraGas = false
) => {
  let outcome;

  try {
    const account = getAccount(chain);
    const config = getConfig(chain);
    const publicClient = createPublicClient({ ...config });

    const prevBalance = await showBalance(chain, account.address);
    const { result, request } = await publicClient.simulateContract({
      address: getContractAddress(chain),
      abi: getCastoraAbi(chain),
      functionName,
      args,
      account
    });

    let estimatedGas;
    if (useExtraGas) {
      estimatedGas = await publicClient.estimateContractGas(request);
      logger.info(`Will use extra estimated gas: ${estimatedGas} * 2.5`);
    }

    outcome = result;
    const walletClient = createWalletClient({ account, ...config });
    const hash = await walletClient.writeContract({
      ...request,
      ...(useExtraGas && estimatedGas ? { gas: (estimatedGas * 5n) / 2n } : {})
    });

    logger.info(`Transaction Hash: ${hash}`);
    logger.info('Waiting for On-Chain Confirmation ...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    logger.info(receipt, 'Transaction Receipt');

    const newBalance = await showBalance(chain, account.address);
    const balanceDiffs = formatEther(newBalance - prevBalance);
    const symbol = chain.includes('monad') ? 'MON' : 'ETH';
    logger.info(`Admin Balance Change: ${balanceDiffs} ${symbol}`);
  } catch (e) {
    if (Object.keys(e as any).includes('abi')) delete (e as any).abi;
    if (Object.keys(e as any).includes('args')) delete (e as any).args;

    logger.error(e, `Error at writeContract call at ${errorContext} possible outcome ${outcome}: ${e}`);

    if (chain === 'monadtestnet' && `${e}`.includes('TransactionReceiptNotFoundError')) {
      // Surprisingly, this receipt not found error happens when
      // the transaction succeeded, so we don't rethrow to not stop execution
      // but we wait 10 seconds to allow the transaction to be mined
      logger.info('Waiting 10 seconds to allow transaction to be mined ...');
      await new Promise((resolve) => setTimeout(resolve, 10000));
    } else {
      throw e;
    }
  }

  return outcome;
};
