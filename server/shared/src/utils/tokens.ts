import { CASTORA_MONAD, CASTORA_SEPOLIA } from './contract.js';

export const AAPL = '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357';
export const BTC = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac6';
export const CRCL = '0x92b8527aabe59ea2b12230f7b532769b133ffb11';
export const SOL = '0xD31a59c85aE9D8edEFeC411D448f90841571b89c';
export const TSLA = '0x16dad506d7db8da01c87581c87ca897a012a1535';

// AAPL, BTC, CRCL, TSLA tokens are the truncated Pyth Price Feed ID for BTC
// ETH is the address of the original Castora Sepolia contract
// SOL is the token address of Wormhole wrapped SOL on Ethereum Mainnet.

export interface Token {
  address: string;
  name: string;
  fullName: string;
  decimals: number;
  pythPriceId: string;
}

export const tokens: Token[] = [
  {
    address: CASTORA_MONAD,
    name: 'MON',
    fullName: 'Monad',
    decimals: 18,
    pythPriceId: '0x31491744e2dbf6df7fcf4ac0820d18a609b49076d45066d3568424e62f686cd1'
  },
  {
    address: CASTORA_SEPOLIA,
    name: 'ETH',
    fullName: 'Ethereum',
    decimals: 18,
    pythPriceId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'
  },
  {
    address: AAPL,
    name: 'AAPL',
    fullName: 'Apple Inc.',
    decimals: 8,
    pythPriceId: '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688'
  },
  {
    address: BTC,
    name: 'BTC',
    fullName: 'Bitcoin',
    decimals: 8,
    pythPriceId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'
  },
  {
    address: CRCL,
    name: 'CRCL',
    fullName: 'Circle Internet Group Inc.',
    decimals: 8,
    pythPriceId: '0x92b8527aabe59ea2b12230f7b532769b133ffb118dfbd48ff676f14b273f1365'
  },
  {
    address: SOL,
    name: 'SOL',
    fullName: 'Solana',
    decimals: 9,
    pythPriceId: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
  },
  {
    address: TSLA,
    name: 'TSLA',
    fullName: 'Tesla Inc.',
    decimals: 8,
    pythPriceId: '0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1'
  }
];
