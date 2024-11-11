import { address } from './contract';

export const ETH = address; // using contract address for native token
export const AAPL = '0x292e9e6837c624b07c204f381375c5a2fc1e6411';
export const MOODENG = '0x28561b8a2360f463011c16b6cc0b0cbef8dbbcad';
export const cUSD = '0x5610bb814e1e384a4a16065f6d7f7d9cbf9a0d9c';
export const USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

// AAPL stands for Apple Inc. stock. It is not an ERC20 token.  
// The Pyth Network provides price feeds for various assets including stocks.
// The AAPL price feed is available at the following address:
// 3mkwqdkawySvAm1VjD4f2THN5mmXzb76fvft2hWpAANo on Solana Mainnet. 
// This Solana address was converted to bytes first (base58 to bytes) and then 
// to the bytes was converted into hexadecimal. The hex was 64 characters long.
// But as EVM addresses are 40 characters, we simply truncated the extras.
// So the above AAPL address, 0x292e9e6837c624b07c204f381375c5a2fc1e6411, is 
// what the contract uses to represent the AAPL price feed.

// MOODENG is a token that is live on both Ethereum and Solana Mainnet. 
// However, since it is not live in Sepolia testnet, we are using its 
// Ethereum Mainnet address for representation. 

export const tokens = [
  {
    address: ETH,
    name: 'ETH',
    fullName: 'Ethereum',
    decimals: 18,
    pythPriceId:
      '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'
  },
  {
    address: AAPL,
    name: 'AAPL',
    fullName: 'Apple Inc.',
    decimals: 8,
    pythPriceId:
      '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688'
  },
  {
    address: MOODENG,
    name: 'MOODENG',
    fullName: 'MOO DENG',
    decimals: 9,
    pythPriceId:
      '0xffff73128917a90950cd0473fd2551d7cd274fd5a6cc45641881bbcc6ee73417'
  },
  {
    address: cUSD,
    name: 'cUSD',
    fullName: 'Castora USD',
    decimals: 6,
    pythPriceId: ''
  },
  {
    address: USDC,
    name: 'USDC',
    fullName: 'US Dollar',
    decimals: 6,
    pythPriceId: ''
  }
];
