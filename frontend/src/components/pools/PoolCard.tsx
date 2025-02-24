import ArrowRight from '@/assets/arrow-right.svg?react';
import { CountdownBadge } from '@/components';
import { Pool } from '@/schemas';
import ms from 'ms';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const PoolCard = ({
  pool: { poolId, seeds, noOfPredictions, winAmount },
  isInLandingPage = false
}: {
  pool: Pool;
  isInLandingPage?: boolean;
}) => {
  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(
      () => setNow(Math.trunc(Date.now() / 1000)),
      1000
    );
    return () => clearInterval(interval);
  }, [now]);

  return (
    <div className="border border-border-default dark:border-surface-subtle p-6 rounded-2xl w-full max-w-md mx-auto md:flex md:grow md:flex-col">
      <div className="flex justify-between">
        <div className="flex p-2 pl-4 mb-3 rounded-full items-center  bg-surface-subtle w-fit">
          <div className="text-sm md:text-md">Pool ID: {poolId}</div>
          <div
            className={
              'ml-6 text-xs md:text-sm p-2 px-4 rounded-full ' +
              `${
                ['Open', 'Upcoming'].includes(seeds.status())
                  ? 'bg-success-default text-white'
                  : 'bg-surface-disabled dark:bg-app-bg dark:text-border-default'
              }`
            }
          >
            {seeds.status()}
          </div>
        </div>

        <span className="text-sm text-primary-default mt-1 inline-block">
          {seeds.poolLife() == 12 * 60 * 60
            ? '24h'
            : ms(seeds.poolLife() * 1000)}
        </span>
      </div>

      <div className="font-medium text-2xl text-text-title mb-3">
        {seeds.pairName()}
      </div>

      {(now > seeds.windowCloseTime || isInLandingPage) && (
        <div
          className={
            'py-1.5 px-4 font-medium rounded-full w-fit text-sm sm:text-md bg-primary-default text-white ' +
            (isInLandingPage ? 'mb-6' : 'mb-3')
          }
        >
          {!!winAmount
            ? `Win Amount: ${winAmount} ${seeds.stakeTokenDetails.name}`
            : `Snapshot: ${seeds.formattedSnapshotTime().reverse().join(' ')}`}
        </div>
      )}

      <div className="font-medium text-xs md:text-sm text-text-subtitle mb-2">
        {seeds.status() === 'Upcoming' ? 'Pool Opens In' : ''}
        {seeds.status() === 'Open' ? 'Pool Closes In' : ''}
      </div>

      <CountdownBadge seeds={seeds} />

      <div className="hidden md:block mt-auto"></div>

      {noOfPredictions > 0 && (
        <div className="flex justify-between font-medium text-sm md:text-md text-text-subtitle mb-3">
          <span className="mr-4">Predictions</span>
          <span>{noOfPredictions}</span>
        </div>
      )}

      <div className="flex justify-between font-medium text-sm md:text-md text-text-subtitle mb-8">
        <span className="mr-4">Entry Fee</span>
        <span>{seeds.displayStake()}</span>
      </div>

      <Link
        className="w-full py-2 px-4 rounded-full font-medium border border-border-default dark:border-surface-subtle text-text-subtitle flex items-center justify-center p-ripple"
        to={'/pool/' + poolId}
      >
        {seeds.status() === 'Open' ? 'Join ' : 'Open '}
        Pool
        <ArrowRight className="w-4 h-4 ml-2 fill-text-body" />
        <Ripple />
      </Link>
    </div>
  );
};
