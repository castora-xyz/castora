import ArrowRight from '@/assets/arrow-right.svg?react';
import { CountdownBadge } from '@/components';
import { Pool } from '@/schemas';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const PoolCard = ({
  pool,
  pool: { poolId, seeds, noOfPredictions, winAmount },
  isInLandingPage = false
}: {
  pool: Pool;
  isInLandingPage?: boolean;
}) => {
  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.trunc(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, [now]);

  return (
    <div
      className={
        'border border-border-default dark:border-surface-subtle p-5 rounded-2xl w-full max-w-md mx-auto md:flex md:grow md:flex-col ' +
        `${
          !pool.userCreated
            ? 'shadow-[0px_0px_12px_0.5px_rgba(131,110,249,0.6)] dark:shadow-[0px_0px_12px_0.5px_rgba(255,255,255,0.6)]'
            : ''
        }`
      }
    >
      {/* Pool ID and Status */}
      <div className="flex justify-between">
        <div className="flex p-2 pl-4 mb-4 rounded-full items-center  bg-surface-subtle w-fit">
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

        <Tooltip target="#pool-life" />
        <span className="text-sm text-primary-default mt-1 inline-block" id="pool-life" data-pr-tooltip="Pool Life">
          {seeds.displayPoolLife()}
        </span>
      </div>

      <div className="flex gap-2.5 items-start mb-4">
        {seeds.predictionTokenDetails.img && (
          <img src={`/assets/${seeds.predictionTokenDetails.img}.png`} className="w-8 h-8 rounded-full" />
        )}
        <div className="font-medium text-2xl text-text-title">{seeds.pairName()}</div>
      </div>

      {isInLandingPage && (
        <>
          <div className="py-1.5 px-4 font-medium rounded-full w-fit text-sm sm:text-md mb-6 bg-primary-default text-white">
            {!!winAmount
              ? `Win Amount: ${winAmount} ${seeds.stakeTokenDetails.name}`
              : `Snapshot: ${seeds.formattedSnapshotTime().reverse().join(' ')}`}
          </div>
        </>
      )}

      <div className="text-xs md:text-sm text-text-subtitle mb-2">
        {seeds.status() === 'Upcoming' && (
          <span>
            Pool <span className="font-black">Opens</span> In
          </span>
        )}
        {seeds.status() === 'Open' && (
          <span>
            Pool <span className="font-black">Closes</span> In
          </span>
        )}
        {seeds.status() === 'Closed' && (
          <span>
            Awaiting <span className="font-black">Settlement</span>
          </span>
        )}
        {seeds.status() === 'Completed' && (
          <span>
            Was <span className="font-black">Settled</span>
            <span>{!!winAmount ? ' With' : ' At'}</span>
          </span>
        )}
      </div>

      {now > seeds.windowCloseTime && !isInLandingPage && (
        <div className="py-1.5 px-4 font-medium rounded-full w-fit text-sm sm:text-md mb-4 border-primary-lighter bg-primary-subtle text-primary-darker">
          {!!winAmount
            ? `Win Amount: ${winAmount} ${seeds.stakeTokenDetails.name}`
            : `Snapshot: ${seeds.formattedSnapshotTime().reverse().join(' ')}`}
        </div>
      )}

      <CountdownBadge seeds={seeds} />

      <div className="flex justify-between font-medium text-sm md:text-md text-text-subtitle mb-3">
        <span className="mr-4">Entry Fee</span>
        <div className={`flex w-fit items-center ${seeds.stakeTokenDetails.img ? '-mt-1' : ''}`}>
          {seeds.stakeTokenDetails.img && (
            <img src={`/assets/${seeds.stakeTokenDetails.img}.png`} className="w-6 h-6 rounded-full mr-2" />
          )}
          <span>{seeds.displayStake()}</span>
        </div>
      </div>

      <div className="flex justify-between font-medium text-sm md:text-md text-text-subtitle mb-3">
        <span className="mr-4">Multiplier</span>
        <span className="font-bold text-base -mt-1">x{pool.seeds.multiplier}</span>
      </div>

      {noOfPredictions > 0 && (
        <div className="flex justify-between font-medium text-sm md:text-md text-text-subtitle mb-3">
          <span className="mr-4">Predictions</span>
          <span>{noOfPredictions}</span>
        </div>
      )}

      <div className="hidden md:block mt-auto"></div>

      <Link
        className="w-full mt-5 py-2 px-4 rounded-full font-medium border border-border-default dark:border-surface-subtle text-text-subtitle flex items-center justify-center p-ripple"
        to={'/pool/' + poolId}
        state={{ from: location }}
      >
        {seeds.status() === 'Open' ? 'Join ' : 'Open '}
        Pool
        <ArrowRight className="w-4 h-4 ml-2 fill-text-body" />
        <Ripple />
      </Link>
    </div>
  );
};
