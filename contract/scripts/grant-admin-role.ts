import 'dotenv/config';
import { viem } from 'hardhat';
import { formatEther } from 'viem';

const CASTORA_ADDRESS = '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd';
if (!process.env.ADMIN_ADDRESS) throw 'Set ADMIN_ADDRESS in .env';
const admin = process.env.ADMIN_ADDRESS as `0x${string}`;

const { getPublicClient, getWalletClients, getContractAt } = viem;
const green = (input: any) => '\x1b[32m' + input + '\x1b[0m';
const showBalance = async () => {
  const publicClient = await getPublicClient();
  const [owner] = await getWalletClients();
  const address = owner.account.address;
  const balance = formatEther(await publicClient.getBalance({ address }));
  console.log(`\nOwner Balance (${address}): ${green(`${balance} ETH`)}`);
  return balance;
};

const main = async () => {
  const prevBalance = await showBalance();

  const castora = await getContractAt('Castora', CASTORA_ADDRESS);
  console.log('\nGranting Admin Role ...');
  const hash = await castora.write.grantAdminRole([admin]);
  console.log('Waiting On-Chain Confirmation ... ');
  const publicClient = await getPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Transaction Receipt');
  console.log(receipt);
  console.log('\nAdmin Role Successfully Granted to ', green(admin));
  console.log(`Transaction Hash: ${green(hash)}`);

  const newBalance = await showBalance();
  console.log(
    `\nOwner Balance Change: ${green(+newBalance - +prevBalance)} ETH`
  );
};

main().then().catch(console.error);
