import 'dotenv/config';
import { createPublicClient, createWalletClient, defineChain, formatEther, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { castoraAbi, castoraPoolsManagerAbi } from './abi.js';
import { Chain } from './index.js';
import { logger } from './logger.js';

export const CONTRACT_ADDRESS_SEPOLIA: `0x${string}` = '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd';
export const CONTRACT_ADDRESS_MONAD: `0x${string}` = '0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53';
export const POOLS_MANAGER_ADDRESS_MONAD: `0x${string}` = '0xb4a03C32C7cAa4069f89184f93dfAe065C141061';

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

const getAccount = (chain: Chain) => {
  const adminKeyMonad = process.env.ADMIN_KEY_MONAD as `0x${string}`;
  if (!adminKeyMonad) throw 'Set ADMIN_KEY_MONAD in env';
  return privateKeyToAccount({ monadtestnet: adminKeyMonad }[chain]);
};

export const getConfig = (chain: Chain) =>
  ({
    monadtestnet: { chain: monadTestnet(), transport: http() }
  }[chain]);
export const getContractAddress = (chain: Chain) =>
  ({
    monadtestnet: CONTRACT_ADDRESS_MONAD
  }[chain]);

export const readCastoraContract = async (chain: Chain, functionName: any, args?: any): Promise<any> => {
  try {
    return await createPublicClient({ ...getConfig(chain) }).readContract({
      address: getContractAddress(chain),
      abi: castoraAbi,
      functionName,
      args
    });
  } catch (e) {
    logger.error(e, `Error at readCastoraContract call ${e}`);
    throw e;
  }
};

export const readPoolsManagerContract = async (chain: Chain, functionName: any, args?: any) => {
  try {
    // @ts-ignore
    return await createPublicClient({ ...getConfig(chain) }).readContract({
      address: POOLS_MANAGER_ADDRESS_MONAD,
      abi: castoraPoolsManagerAbi,
      functionName,
      args
    });
  } catch (e) {
    logger.error(e, `Error at readPoolsManagerContract call ${e}`);
    throw e;
  }
};

const showBalance = async (chain: Chain, address: `0x${string}`) => {
  const balance = await createPublicClient({ ...getConfig(chain) }).getBalance({
    address
  });
  logger.info(`Admin Balance (${address}): ${`${formatEther(balance)} ETH`}`);

  if (balance < 10e18) {
    logger.warn(`Admin Balance is low: ${`${formatEther(balance)} ETH`}. Please top up.`);
  }

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
      abi: castoraAbi,
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
    logger.info(`Admin Balance Change: ${balanceDiffs} ETH`);
  } catch (e) {
    if (Object.keys(e as any).includes('abi')) delete (e as any).abi;

    logger.error(e, `Error at writeContract call at ${errorContext} possible outcome ${outcome}: ${e}`);

    if (`${e}`.includes('TransactionReceiptNotFoundError')) {
      // Surprisingly, this receipt not found error happens when
      // the transaction succeeded, so we don't rethrow to not stop execution
    } else {
      throw e;
    }
  }

  return outcome;
};
