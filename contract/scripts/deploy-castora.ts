import 'dotenv/config';
import { viem } from 'hardhat';
import { formatEther } from 'viem';

if (!process.env.FEE_COLLECTOR_ADDRESS) throw 'Set FEE_COLLECTOR in .env';
const feeCollector = process.env.FEE_COLLECTOR_ADDRESS as `0x${string}`;

const { getPublicClient, getWalletClients, getContractAt } = viem;
const green = (input: any) => '\x1b[32m' + input + '\x1b[0m';
const showBalance = async () => {
  const publicClient = await getPublicClient();
  const [owner] = await getWalletClients();
  const address = owner.account.address;
  const balance = formatEther(await publicClient.getBalance({ address }));
  console.log(`Owner Balance (${address}): ${green(`${balance} ETH`)}`);
  return balance;
};

const main = async () => {
  const prevBalance = await showBalance();
  console.log('Deploying Castora ...');
  const castora = await viem.deployContract('Castora', [feeCollector]);
  const newBalance = await showBalance();
  console.log(
    `\nOwner Balance Change: ${green(+newBalance - +prevBalance)} ETH`
  );
  console.log(`\nCastora Deployed To: ${green(castora.address)}`);
};

main().then().catch(console.error);
