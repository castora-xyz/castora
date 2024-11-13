import 'dotenv/config';
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { abi } from './abi';

const adminKey = process.env.ADMIN_KEY as `0x${string}`;
if (!adminKey) throw 'Set ADMIN_KEY';
const account = privateKeyToAccount(adminKey);
const config = { chain: sepolia, transport: http('https://sepolia.drpc.org') };

export const address = '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd';

export const publicClient = createPublicClient({ ...config });

export const readContract = async (functionName: any, args?: any) => {
  return await publicClient.readContract({
    address,
    abi,
    functionName,
    args,
    account
  });
};

const showBalance = async () => {
  const address = account.address;
  const balance = formatEther(await publicClient.getBalance({ address }));
  console.log(`Admin Balance (${address}): ${`${balance} ETH`}`);
  return balance;
};

export const writeContract = async (functionName: any, args: any) => {
  try {
    const prevBalance = await showBalance();
    const { result, request } = await publicClient.simulateContract({
      address,
      abi,
      functionName,
      args,
      account
    });
    const walletClient = createWalletClient({ account, ...config });
    const hash = await walletClient.writeContract(request);
    console.log('Transaction Hash: ', hash);
    console.log('Waiting for On-Chain Confirmation ...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Transaction Receipt');
    console.log(receipt);
    const newBalance = await showBalance();
    const balanceDiffs = +newBalance - +prevBalance;
    console.log(`Admin Balance Change: ${`${balanceDiffs} ETH`}`);
    return result;
  } catch (e) {
    if (`${e}`.toLowerCase().includes('request timed out')) {
      // occasionally the wait for transaction receipt times out.
      // in such case, do nothing so that the call simply returns
      // after all the writeContract logic is done and submitted to on-chain.
    } else throw e;
  }
};
