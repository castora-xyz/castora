import Briefcase from '@/assets/briefcase.svg?react';
import Globe from '@/assets/globe.svg?react';
import LinkIcon from '@/assets/link.svg?react';
import Timer from '@/assets/timer.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import Wallet from '@/assets/wallet.svg?react';
import { ClaimCreateButton, CountdownNumbers } from '@/components';
import { Pool, UserCreatedPool } from '@/schemas';
import ms from 'ms';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const ActivityCreateCard = ({
  count,
  pool,
  pool: {
    poolId,
    seeds,
    seeds: { snapshotTime, multiplier, isUnlisted },
    noOfPredictions
  },
  userCreated,
  userCreated: { creationTime, completionTime, completionFeesAmount }
}: {
  count: number;
  pool: Pool;
  userCreated: UserCreatedPool;
}) => {
  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.trunc(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, [now]);

  return (
    <div className="border-2 border-surface-subtle rounded-2xl pt-3 sm:pt-4 pb-5 px-4 sm:px-6 mb-6 gap-4">
      <div className="flex flex-wrap justify-between gap-4 mb-4">
        <div className="flex flex-wrap justify-start items-center gap-3">
          <p className="text-text-caption text-sm -mt-1">#{count}</p>

          <p className="text-xs bg-surface-subtle py-1 px-2 rounded-full w-fit inline-flex items-center gap-1">
            {seeds.predictionTokenDetails.img && (
              <img src={`/assets/${seeds.predictionTokenDetails.img}.png`} className="w-3 h-3 rounded-full" />
            )}
            {seeds.pairName()}
          </p>

          <p className="text-xs bg-surface-subtle py-1 px-2 rounded-full w-fit inline-block">
            Stake: {seeds.displayStake()}
          </p>

          <p className="text-xs bg-surface-subtle py-1 px-2 rounded-full w-fit inline-flex items-center gap-1">
            <Timer className="fill-text-caption w-4 h-4" />
            <span className="mr-1">{seeds.displayPoolLife()}</span>
          </p>

          {!!completionTime && (
            <p className="text-white font-medium flex items-center bg-success-default py-1 px-3 rounded-full w-fit">
              <Trophy className="fill-white w-4 h-4 mr-1" />
              Gained {userCreated.getGainedDisplay()}
            </p>
          )}
        </div>

        <Tooltip target=".activity-time" />
        <p
          className="activity-time text-text-caption inline-block cursor-context-menu"
          data-pr-tooltip={`${new Date(creationTime * 1000)}`.split(' GMT')[0]}
        >
          {ms((now - creationTime) * 1000)}
        </p>
      </div>

      <div className="flex flex-wrap mb-4 gap-2">
        <Link to={`/pool/${poolId}`} className="p-ripple rounded-full" state={{ from: location }}>
          <p className="border border-primary-darker dark:border-primary-default text-primary-darker dark:text-primary-default py-1 px-3 rounded-full text-xs hover:underline">
            Pool ID: {poolId}
          </p>
          <Ripple />
        </Link>

        <Tooltip target=".activity-no-of-predictions" />
        <p
          className="activity-no-of-predictions text-text-caption border border-border-darker dark:border-border-default py-1 px-2 rounded-full text-xs flex"
          data-pr-tooltip="No Of Predictions"
        >
          <Briefcase className="stroke-text-caption w-4 h-4 mr-1" />
          {noOfPredictions == 0 ? 'None' : noOfPredictions}
        </p>

        <Tooltip target=".activity-multiplier" />
        <p
          className="activity-multiplier text-text-caption border border-border-darker dark:border-border-default py-1 px-2 rounded-full text-xs flex"
          data-pr-tooltip="Multiplier"
        >
          <Wallet className="stroke-text-caption w-4 h-4 mr-1" />
          <span className="font-bold">x{multiplier}</span>
        </p>

        <Tooltip target=".activity-visibility" />
        <p
          className="activity-visibility text-text-caption border border-border-darker dark:border-border-default py-1 px-2 rounded-full text-xs flex"
          data-pr-tooltip="Visibility"
        >
          {isUnlisted ? (
            <LinkIcon className="w-4 h-4 text-text-caption mr-1" />
          ) : (
            <Globe className="w-4 h-4 text-text-caption mr-1" />
          )}
          {isUnlisted ? 'Unlisted' : 'Public'}
        </p>
      </div>

      {now <= snapshotTime && (
        <div className="flex flex-wrap justify-start items-center gap-3">
          <p className="text-primary-darker bg-primary-subtle py-1 px-4 rounded-full text-sm w-fit">
            Awaiting Snapshot
          </p>

          <p className="text-primary-darker bg-primary-subtle py-1 px-4 rounded-full text-sm w-fit">
            <CountdownNumbers timestamp={snapshotTime} />
          </p>
        </div>
      )}
      {now > snapshotTime && noOfPredictions > 0 && !completionTime && (
        <p className="text-primary-darker bg-primary-subtle py-1 px-4 rounded-full text-sm w-fit">
          Awaiting Processing
        </p>
      )}
      {now > snapshotTime && noOfPredictions === 0 && <p className="text-lg">Nobody Joined This Pool</p>}

      {!!completionFeesAmount && (
        <div className="flex flex-wrap justify-end">
          <ClaimCreateButton pool={pool} userCreated={userCreated} />
        </div>
      )}
    </div>
  );
};
