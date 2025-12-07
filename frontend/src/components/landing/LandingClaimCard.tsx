import Coin3Fill from '@/assets/coin-3-fill.svg?react';
import { SuccessIcon } from '@/components';
import { useMyPredictActivity } from '@/contexts';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const LandingClaimCard = () => {
  const { isFetching, myActivities } = useMyPredictActivity();
  const [hasClaimed, setHasClaimed] = useState(false);

  useEffect(() => {
    if (isFetching) return;

    setHasClaimed(
      myActivities.filter(({ prediction: { isAWinner, claimWinningsTime } }) => isAWinner && claimWinningsTime).length >
        0
    );
  }, [isFetching, myActivities]);

  return (
    <div className="bg-app-bg w-full p-8 border border-border-default dark:border-surface-disabled rounded-[24px] md:flex md:flex-col md:self-stretch">
      <SuccessIcon child={<Coin3Fill className="w-8 h-8 fill-app-bg" />} />

      <p className="text-center text-xl mb-6">
        {hasClaimed ? (
          <span>You've claimed your rewards!</span>
        ) : (
          <>
            <span className="font-bold">Claim your winnings </span>
            once the pool has been completed
          </>
        )}
      </p>

      <p className="text-sm text-text-caption text-center mb-6 flex items-center justify-center">
        <>Transactions are always live on the explorer</>
      </p>

      {hasClaimed && <p className="mb-8">Predict More for More Winnings</p>}

      <Link
        to="/pools"
        className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white inline-block text-center mt-auto"
      >
        Predict Now
        <Ripple />
      </Link>
    </div>
  );
};
