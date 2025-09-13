import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Ripple } from 'primereact/ripple';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

export const MyCreatedPoolsPage = () => {
  const { isConnected } = useAccount();
  const { open: connectWallet } = useWeb3Modal();

  useEffect(() => {
    document.title = 'My Created Pools | Castora';
  }, []);

  return (
    <div className="w-full max-md:max-w-[600px] max-w-screen-xl mx-auto flex flex-col grow">
      <p className="text-sm py-2 px-5 mb-4 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle">
        <span>My Created Pools</span>
      </p>

      {!isConnected ? (
        <div className="max-sm:flex max-sm:flex-col max-sm:justify-center max-sm:items-center max-sm:grow max-sm:text-center max-sm:py-12 sm:border sm:border-border-default sm:dark:border-surface-subtle sm:rounded-2xl sm:py-16 sm:px-16 md:px-4 lg:px-8 sm:gap-4 sm:text-center md:max-w-[600px]">
          <p className="text-lg mb-8">
            Here, you will find all the pools you have created. Kindly sign in to continue.
          </p>
          <button
            className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple flex justify-center items-center"
            onClick={() => connectWallet()}
          >
            <span>Connect Wallet</span>
            <Ripple />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center grow text-center py-16">
          <h2 className="text-2xl font-bold mb-4">My Created Pools</h2>
          <p className="text-lg mb-8 max-w-md">
            Pools that you have created will appear here. Create your first community pool to get started!
          </p>
          <Link
            to="/pools/community/create"
            className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
          >
            Create Community Pool
            <Ripple />
          </Link>
        </div>
      )}
    </div>
  );
};
