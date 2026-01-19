import { useConnection } from 'wagmi';
import type { Chain } from 'wagmi/chains';
const getChainLogo = (chain?: Chain): string => {

  
  if (chain?.id === 143) {
    return '/assets/mon.png';
  }
  if (chain?.id === 6342) {
    return '/assets/eth.png';
  }
  
  // Default fallback
  return '/assets/eth.png';
};

export const Web3Avatar = ({ address, className }: { address: string; className?: string }) => {
  const { chain } = useConnection();
  const chainLogo = getChainLogo(chain);

  return (
    <img
      src={chainLogo}
      alt={chain?.name || 'Chain'}
      className={`${className ?? 'w-8 h-8'} rounded-full object-cover`}
    />
  );
};
