import { address } from './contract';

export const ETH = address; // using contract address for native token
export const USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

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
    address: USDC,
    name: 'USDC',
    fullName: 'US Dollar',
    decimals: 6,
    pythPriceId: ''
  }
];
