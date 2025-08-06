import 'dotenv/config';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  formatEther,
  http
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { convertNestedBigInts, logger } from '.';
import { abi } from './abi';
import { Chain } from './validate-chain';

const adminKeySepolia = process.env.ADMIN_KEY_SEPOLIA as `0x${string}`;
if (!adminKeySepolia) throw 'Set ADMIN_KEY_SEPOLIA';
const adminKeyMonad = process.env.ADMIN_KEY_MONAD as `0x${string}`;
if (!adminKeyMonad) throw 'Set ADMIN_KEY_MONAD';
const monadDevnetRpcUrl = process.env.MONAD_DEVNET_RPC_URL;
if (!monadDevnetRpcUrl) throw 'Set MONAD_DEVNET_RPC_URL';
const monadTestnetRpcUrl = process.env.MONAD_TESTNET_RPC_URL;
if (!monadTestnetRpcUrl) throw 'Set MONAD_TESTNET_RPC_URL';

export const CONTRACT_ADDRESS_SEPOLIA: `0x${string}` =
  '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd';
export const CONTRACT_ADDRESS_MONAD: `0x${string}` =
  '0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53';

const monadDevnet = defineChain({
  id: 20143,
  name: 'Monad Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'DMonad',
    symbol: 'DMON'
  },
  rpcUrls: {
    default: { http: [monadDevnetRpcUrl] }
  }
});

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON'
  },
  rpcUrls: {
    default: { http: [monadTestnetRpcUrl] }
  }
});

const getAccount = (chain: Chain) =>
  privateKeyToAccount(
    {
      monaddevnet: adminKeyMonad,
      monadtestnet: adminKeyMonad,
      sepolia: adminKeySepolia
    }[chain]
  );
export const getConfig = (chain: Chain) =>
  ({
    monaddevnet: { chain: monadDevnet, transport: http() },
    monadtestnet: { chain: monadTestnet, transport: http() },
    sepolia: { chain: sepolia, transport: http('https://sepolia.drpc.org') }
  }[chain]);
export const getContractAddress = (chain: Chain) =>
  ({
    monaddevnet: CONTRACT_ADDRESS_MONAD,
    monadtestnet: CONTRACT_ADDRESS_MONAD,
    sepolia: CONTRACT_ADDRESS_SEPOLIA
  }[chain]);

export const readContract = async (
  chain: Chain,
  functionName: any,
  args?: any
) => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return await createPublicClient({ ...getConfig(chain) }).readContract({
    address: getContractAddress(chain),
    abi,
    functionName,
    args,
    account: getAccount(chain)
  });
};

const showBalance = async (chain: Chain, address: `0x${string}`) => {
  const balance = await createPublicClient({ ...getConfig(chain) }).getBalance({
    address
  });
  logger.info(`Admin Balance (${address}): ${`${formatEther(balance)} ETH`}`);

  if (balance < 10e18) {
    logger.warn(
      `Admin Balance is low: ${`${formatEther(balance)} ETH`}. Please top up.`
    );
  }

  return balance;
};

export const writeContract = async (
  chain: Chain,
  functionName: any,
  args: any
) => {
  try {
    const account = getAccount(chain);
    const config = getConfig(chain);
    const publicClient = createPublicClient({ ...config });

    const prevBalance = await showBalance(chain, account.address);
    const { result, request } = await publicClient.simulateContract({
      address: getContractAddress(chain),
      abi,
      functionName,
      args,
      account
    });
    const walletClient = createWalletClient({ account, ...config });
    const hash = await walletClient.writeContract(request);

    logger.info('Transaction Hash: ', hash);
    logger.info('Waiting for On-Chain Confirmation ...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    logger.info('Transaction Receipt');
    logger.info(convertNestedBigInts(receipt));
    // Also logging the raw receipt to the console as the custom logger might not show it.
    console.log(receipt);

    const newBalance = await showBalance(chain, account.address);
    const balanceDiffs = Number(newBalance) - Number(prevBalance);
    logger.info(`Admin Balance Change: ${`${balanceDiffs} ETH`}`);
    return result;
  } catch (e) {
    if (`${e}`.toLowerCase().includes('request timed out')) {
      // occasionally the wait for transaction receipt times out.
      // in such case, do nothing so that the call simply returns
      // after all the writeContract logic is done and submitted to on-chain.
    } else {
      logger.error(`Error at writeContract call: ${e}`);
      throw e;
    }
  }
};
