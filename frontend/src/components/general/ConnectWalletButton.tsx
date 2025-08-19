import ChevronDown from '@/assets/chevron-down.svg?react';
import Wallet from '@/assets/wallet.svg?react';
import { useFirebase } from '@/contexts';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Ripple } from 'primereact/ripple';
import { useAccount } from 'wagmi';
import { Web3Avatar } from './Web3Avatar';

export const ConnectWalletButton = () => {
  const { isConnected, address } = useAccount();
  const { recordEvent } = useFirebase();
  const { open: connectWallet } = useWeb3Modal();

  const shorten = (str: string) => {
    if (str.length < 10) return str;
    return str.substring(0, 4) + '...' + str.split('').reverse().slice(0, 4).reverse().join('');
  };

  return (
    <button
      className="flex mr-3 px-3 py-2 rounded-full items-center border border-border-default dark:border-surface-subtle text-sm xl:text-base p-ripple"
      onClick={() => {
        recordEvent('clicked_connect_wallet');
        connectWallet();
      }}
    >
      <Ripple />
      {isConnected ? (
        <>
          <Web3Avatar
            address={address!}
            className="w-5 h-5 sm:w-6 sm:h-6 sm:mr-2 md:mr-0 lg:mr-2 lg:w-6 lg:h-6"
          />
          <span className="hidden sm:inline md:hidden lg:inline">
            {address && shorten(address)}
          </span>
        </>
      ) : (
        <>
          <Wallet className="w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 stroke-text-body sm:mr-2 md:mr-0 lg:mr-2 lg:w-6 lg:h-6" />
          <span className="hidden sm:inline md:hidden lg:inline">Connect</span>
        </>
      )}
      <ChevronDown className="ml-1 w-4 h-4 sm:w-5 sm:h-5 fill-text-body" />
    </button>
  );
};
