import { CASTORA_ADDRESS_MONAD, CASTORA_ADDRESS_SEPOLIA } from '@/contexts';

export const AAPL = '0x292e9e6837c624b07c204f381375c5a2fc1e6411';
export const MOODENG = '0x28561b8a2360f463011c16b6cc0b0cbef8dbbcad';
export const PENGU = '0x1d8ccf87ac0147bae756eb963a2ef6244c969156';
export const SOL = '0xD31a59c85aE9D8edEFeC411D448f90841571b89c';
export const SUI = '0x8ab03cff1844ab975dcdd1683020c0599fc5392b';
export const TRUMP = '0x565b78baec5bd6ff06633318ea20e7f6398d2f32';
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

// The same process was done for SUI token (the native token in Sui chain).
// The Pyth price feed for SUI is available at the following address:
// ALP8SdU9oARYVLgLR7LrqMNCYBnhtnQz1cj6bwgwQmgj on Solana Mainnet. So that
// was converted using the method above to obtain hex.

// Coming over to PENGU (Pudgy Penguins NFT), its token address on Solana
// Mainnet: 2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv was what was converted.

// For  TRUMP, its token address on Solana Mainnet:
// 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN was converted.

// MOODENG is a token that is live on both Ethereum and Solana Mainnet.
// However, since it is not live in Sepolia testnet, we are using its
// Ethereum Mainnet address for representation.

// SOL is the token address of Wormhole wrapped SOL on Ethereum Mainnet.

export const tokens = [
  {
    address: CASTORA_ADDRESS_MONAD,
    name: 'MON',
    fullName: 'Monad',
    decimals: 18,
    pythPriceId: ''
  },
  {
    address: CASTORA_ADDRESS_SEPOLIA,
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
    address: PENGU,
    name: 'PENGU',
    fullName: 'Pudgy Penguins',
    decimals: 6,
    pythPriceId:
      '0xbed3097008b9b5e3c93bec20be79cb43986b85a996475589351a21e67bae9b61'
  },
  {
    address: SOL,
    name: 'SOL',
    fullName: 'Solana',
    decimals: 9,
    pythPriceId:
      '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
  },
  {
    address: SUI,
    name: 'SUI',
    fullName: 'Sui',
    decimals: 9,
    pythPriceId:
      '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744'
  },
  {
    address: TRUMP,
    name: 'TRUMP',
    fullName: 'Official Trump',
    decimals: 6,
    pythPriceId:
      '0x879551021853eec7a7dc827578e8e69da7e4fa8148339aa0d3d5296405be4b1a'
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
