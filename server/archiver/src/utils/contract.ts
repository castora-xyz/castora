import 'dotenv/config';
import { createPublicClient, defineChain, http } from 'viem';
import { Chain } from '.';
import { abi } from './abi';

if (!process.env.MONAD_TESTNET_RPC_URL) throw 'Set MONAD_TESTNET_RPC_URL';

export const CONTRACT_ADDRESS_SEPOLIA: `0x${string}` = '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd';
export const CONTRACT_ADDRESS_MONAD: `0x${string}` = '0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53';

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON'
  },
  rpcUrls: {
    default: { http: [process.env.MONAD_TESTNET_RPC_URL] }
  }
});

export const getConfig = (chain: Chain) =>
  ({
    monadtestnet: { chain: monadTestnet, transport: http() }
  }[chain]);
export const getContractAddress = (chain: Chain) =>
  ({
    monadtestnet: CONTRACT_ADDRESS_MONAD
  }[chain]);

export const readContract = async (chain: Chain, functionName: any, args?: any) => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return await createPublicClient({ ...getConfig(chain) }).readContract({
    address: getContractAddress(chain),
    abi,
    functionName,
    args
  });
};
