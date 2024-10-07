import 'dotenv/config';
import { viem } from 'hardhat';
import { formatEther } from 'viem';

const { getPublicClient, getWalletClients } = viem;
const green = (input: any) => '\x1b[32m' + input + '\x1b[0m';
const showBalance = async () => {
  const publicClient = await getPublicClient();
  const [, cusdOwner] = await getWalletClients();
  const address = cusdOwner.account.address;
  const balance = formatEther(await publicClient.getBalance({ address }));
  console.log(`cUSD Owner Balance (${address}): ${green(`${balance} ETH`)}`);
  return balance;
};

const main = async () => {
  const prevBalance = await showBalance();
  console.log('\nDeploying cUSD ...\n');
  const [, cusdOwner] = await getWalletClients();
  const cUSD = await viem.deployContract('cUSD', [], {
    client: { wallet: cusdOwner }
  });
  const newBalance = await showBalance();
  console.log(
    `cUSD Owner Balance Change: ${green(+newBalance - +prevBalance)} ETH`
  );
  console.log(`cUSD Deployed as: ${green(cUSD.address)}`);
};

main().then().catch(console.error);
