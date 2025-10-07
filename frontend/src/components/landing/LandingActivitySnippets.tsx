import { ActivityPredictCard } from '@/components';
import { ActivityPredict, CASTORA_ADDRESS_SEPOLIA, useMyPredictActivity } from '@/contexts';
import { Pool, PoolSeeds, Prediction, USDC } from '@/schemas';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Breathing } from 'react-shimmer';

export const LandingActivitySnippets = () => {
  const { isFetching, myActivities, currentPage, rowsPerPage } = useMyPredictActivity();

  const [snippets, setSnippets] = useState<ActivityPredict[]>([]);

  const next2HoursTimestamp = () => {
    const now = new Date();
    const yrs = now.getFullYear();
    const months = now.getMonth();
    const date = now.getDate();
    const hrs = new Date().getHours();
    return Math.trunc(new Date(yrs, months, date, hrs + 2, 0, 0).getTime() / 1000);
  };

  const defaultActivity = () => ({
    pool: new Pool([
      0,
      new PoolSeeds({
        predictionToken: CASTORA_ADDRESS_SEPOLIA,
        stakeToken: USDC,
        stakeAmount: 10000000,
        windowCloseTime: next2HoursTimestamp() - 15 * 60,
        snapshotTime: next2HoursTimestamp()
      }),
      '0x',
      Math.trunc(new Date().getTime() / 1000),
      0,
      0,
      0,
      0,
      0
    ]),
    prediction: new Prediction({
      poolId: 0,
      predicter: '0x',
      predictionId: 0,
      predictionTime: Math.trunc(new Date().getTime() / 1000),
      predictionPrice: 0,
      isAWinner: false,
      claimWinningsTime: 0
    })
  });

  useEffect(() => {
    setSnippets([
      myActivities.length > 0 ? myActivities[0] : defaultActivity(),
      myActivities.length > 1 ? myActivities[1] : defaultActivity()
    ]);
  }, [myActivities]);

  return (
    <div className="relative max-screen-md ml-auto w-full">
      <div className="bg-black dark:bg-white p-2 rounded-t-2xl max-md:left-[20%] max-md:right-0 max-sm:rounded-br-lg md:max-w-md md:ml-auto max-md:absolute max-md:h-full">
        <div className="bg-app-bg rounded-t-xl md:-mb-2 md:h-[600px] max-md:bottom-0 max-md:absolute max-md:right-2 max-md:top-2 max-md:left-2">
          <div className="py-3 px-6 border-b border-border-default dark:border-surface-subtle">
            <h4 className="text-text-titles text-lg font-medium">Castora</h4>
          </div>
        </div>
      </div>

      <div className="invisible opacity-0 py-48 md:hidden">
        {snippets.map(({ pool, prediction }, i) => (
          <ActivityPredictCard
            count={pool.poolId ? currentPage! * rowsPerPage + myActivities.length - i : 0}
            key={i}
            pool={pool}
            prediction={prediction}
            isInLandingPage={true}
          />
        ))}
      </div>

      <div className="absolute left-0 right-8 top-[50%] -translate-y-[50%]">
        {isFetching ? (
          <>
            <Breathing height={128} className="mb-4 rounded-2xl w-full" />
            <Breathing height={128} className="mb-4 rounded-2xl w-full" />
          </>
        ) : (
          snippets.map(({ pool, prediction }, i) => (
            <Link key={i} to="/activity/predictions">
              <ActivityPredictCard
                count={pool.poolId ? currentPage! * rowsPerPage + myActivities.length - i : 0}
                key={i}
                pool={pool}
                prediction={prediction}
                isInLandingPage={true}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
