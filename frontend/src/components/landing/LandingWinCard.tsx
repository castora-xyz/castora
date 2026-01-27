import Trophy from '@/assets/trophy.svg?react';
import { SuccessIcon } from '@/components';
import { useMyPredictActivity } from '@/contexts';
import { getChainName } from '@/utils/config';
import { Pool } from '@/schemas';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConnection } from 'wagmi';

export const LandingWinCard = () => {
  const { isFetching, myActivities } = useMyPredictActivity();
  const { chain: currentChain } = useConnection();
  const chainName = getChainName(currentChain);

  const [pool, setPool] = useState<Pool | null>(null);

  useEffect(() => {
    if (isFetching) {
      setPool(null);
      return;
    }

    const filtered = myActivities.filter(
      ({ prediction: { isAWinner, claimWinningsTime } }) => isAWinner && !claimWinningsTime
    );
    setPool(filtered.length > 0 ? filtered[0].pool : null);
  }, [isFetching, myActivities]);

  return (
    <div className="bg-app-bg w-full p-8 border border-border-default dark:border-surface-disabled rounded-[24px] md:flex md:flex-col md:self-stretch">
      <SuccessIcon child={<Trophy className="w-8 h-8 fill-app-bg" />} />

      <p className="text-center text-lg max-md:text-xl mb-6">
        {pool ? (
          <span>
            You won{' '}
            <span className="font-bold text-xl">
              {pool.winAmount} {pool.seeds.stakeTokenDetails.name}
            </span>{' '}
            in Pool {pool.poolId}
          </span>
        ) : (
          <span>
            You can win <span className="font-bold">twice your stake</span> when you make predictions
          </span>
        )}
      </p>

      {pool ? (
        <>
          <p className="flex flex-wrap gap-4 text-sm p-1 pl-4 mb-2 rounded-full items-center w-fit mx-auto border border-border-default dark:border-surface-subtle">
            <span>Pool Fee</span>
            <span className="font-medium ml-4 p-1 px-5 rounded-full text-primary-darker dark:text-primary-default border border-border-default dark:border-surface-subtle">
              5%
            </span>
          </p>

          <p className="flex flex-wrap gap-4 text-sm p-1 pl-4 mb-4 rounded-full items-center w-fit mx-auto border border-border-default dark:border-surface-subtle">
            <span>Claimable</span>
            <span className="font-medium p-1 px-3 rounded-full text-primary-darker dark:text-primary-default border border-border-default dark:border-surface-subtle">
              {pool.winAmount * 0.95} {pool.seeds.stakeTokenDetails.name}
            </span>
          </p>
        </>
      ) : (
        <p className="text-sm text-text-caption text-center mb-8">Your predictions are always live on the explorer</p>
      )}

      <Link
        to={pool ? `/${chainName}/pool/${pool.poolId}` : `/${chainName}/pools`}
        className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white inline-block text-center mt-auto"
      >
        {pool ? 'Go To Claim' : 'Predict Now'}
        <Ripple />
      </Link>
    </div>
  );
};
