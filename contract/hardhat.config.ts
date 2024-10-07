import '@nomicfoundation/hardhat-toolbox-viem';
import '@nomicfoundation/hardhat-verify';
import 'dotenv/config';
import type { HardhatUserConfig } from 'hardhat/config';

if (!process.env.OWNER_KEY) throw 'Set OWNER_KEY in .env';
if (!process.env.CUSD_OWNER_KEY) throw 'Set CUSD_OWNER_KEY in .env';

const config: HardhatUserConfig = {
  solidity: '0.8.25',
  networks: {
    sepolia: {
      url: 'https://sepolia.drpc.org',
      accounts: [process.env.OWNER_KEY, process.env.CUSD_OWNER_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true
  }
};

export default config;
