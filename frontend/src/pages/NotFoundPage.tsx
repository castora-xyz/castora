import { getChainName } from '@/utils/config';
import { Ripple } from 'primereact/ripple';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useConnection } from 'wagmi';

export const NotFoundPage = () => {
  const { chain: currentChain } = useConnection();
  const chainName = getChainName(currentChain);

  useEffect(() => {
    document.title = 'Castora';
  }, []);

  return (
    <div className="flex flex-col justify-center items-center grow text-center py-8">
      <h1 className="text-2xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg">Seems you've hit an invalid link.</p>
      <p className="text-lg mb-8">
        No Worries. Get Rewarded for your Predictions.
      </p>
      <Link
        className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
        to={`/${chainName}/pools`}
      >
        Predict Now
        <Ripple />
      </Link>
    </div>
  );
};
