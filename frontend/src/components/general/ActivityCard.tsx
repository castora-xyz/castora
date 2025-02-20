import ExternalLink from '@/assets/external-link.svg?react';
import MoodSadFilled from '@/assets/mood-sad-filled.svg?react';
import Timer from '@/assets/timer.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import { ClaimButton, CountdownNumbers } from '@/components';
import { Pool, Prediction } from '@/schemas';
import ms from 'ms';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const ActivityCard = ({
  pool,
  pool: { poolId, seeds, snapshotPrice, completionTime },
  prediction,
  prediction: {
    explorerUrl,
    id: predictionId,
    isAWinner,
    price: predictionPrice,
    time
  },
  isInLandingPage = false,
  refresh
}: {
  pool: Pool;
  prediction: Prediction;
  isInLandingPage?: boolean;
  refresh?: () => void;
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
    <div
      key={`${poolId} ${predictionId}`}
      className={
        'border-2 border-surface-subtle rounded-2xl pt-3 sm:pt-4 pb-5 px-4 sm:px-6 mb-5 gap-4' +
        (isInLandingPage ? ' bg-app-bg pointer-events-none shadow-subtle' : '')
      }
    >
      <div className="flex flex-wrap justify-between gap-4 mb-4">
        <div className="flex flex-wrap justify-start items-center gap-3">
          <p className="text-xs bg-surface-subtle py-1 px-2 rounded-full w-fit inline-block">
            {seeds.pairName()}
          </p>

          <p className="text-xs bg-surface-subtle py-1 px-2 rounded-full w-fit inline-block">
            Stake: {seeds.displayStake()}
          </p>

          <p className="text-xs bg-surface-subtle py-1 px-2 rounded-full w-fit inline-flex items-center gap-1">
            <Timer className="fill-text-caption w-4 h-4" />
            <span className="mr-1">{ms(seeds.poolLife() * 1000)}</span>
          </p>

          {!!completionTime && isAWinner && !!pool.winAmount && (
            <p className="text-white font-medium flex items-center bg-success-default py-1 px-3 rounded-full w-fit">
              <Trophy className="fill-white w-4 h-4 mr-1" />
              Won {pool.winAmount} {seeds.stakeTokenDetails.name}
            </p>
          )}
        </div>

        <Tooltip target=".activity-time" />
        <p
          className="activity-time text-text-caption inline-block cursor-context-menu"
          data-pr-tooltip={`${new Date(time * 1000)}`.split(' GMT')[0]}
        >
          {ms((now - time) * 1000)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {isInLandingPage ? (
          <p className="border border-primary-darker dark:border-primary-default text-primary-darker dark:text-primary-default py-1 px-3 rounded-full text-xs hover:underline">
            Pool ID: {poolId}
          </p>
        ) : (
          <Link to={`/pool/${poolId}`} className="p-ripple rounded-full">
            <p className="border border-primary-darker dark:border-primary-default text-primary-darker dark:text-primary-default py-1 px-3 rounded-full text-xs hover:underline">
              Pool ID: {poolId}
            </p>
            <Ripple />
          </Link>
        )}

        <p className="text-text-caption border border-border-default dark:border-surface-subtle py-1 px-3 rounded-full text-xs">
          Prediction ID: {predictionId}
        </p>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex flex-wrap justify-start items-center gap-3">
          {!completionTime ? (
            <>
              <p className="text-primary-darker bg-primary-subtle py-1 px-4 rounded-full text-sm w-fit">
                Awaiting Snapshot
              </p>

              {now <= seeds.snapshotTime && (
                <p className="text-primary-darker bg-primary-subtle py-1 px-4 rounded-full text-sm w-fit">
                  <CountdownNumbers timestamp={seeds.snapshotTime} />
                </p>
              )}

              <p className="text-primary-darker bg-primary-subtle py-1 px-4 rounded-full text-sm w-fit">
                ${predictionPrice}
              </p>
            </>
          ) : (
            <>
              <p className="text-primary-darker bg-primary-subtle py-1 px-4 rounded-full text-sm w-fit">
                Snapshot Price: ${snapshotPrice}
              </p>

              <p
                className={
                  'py-1 px-4 rounded-full text-sm w-fit ' +
                  `${
                    isAWinner
                      ? 'text-success-darker bg-success-subtle'
                      : 'text-errors-darker bg-errors-subtle'
                  }`
                }
              >
                Mine: ${predictionPrice}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end grow gap-3">
          {!!completionTime && !isAWinner ? (
            <p className="text-text-disabled font-medium items-center flex bg-surface-subtle py-1 px-3 rounded-full w-fit">
              <MoodSadFilled className="fill-text-disabled w-4 h-4 mr-1" />
              Unlucky
            </p>
          ) : !!completionTime && isAWinner ? (
            <ClaimButton
              pool={pool}
              prediction={prediction}
              onSuccess={refresh ?? (() => {})}
            />
          ) : (
            <></>
          )}
        </div>

        {!!explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center text-xs text-text-caption hover:underline"
          >
            View in Explorer
            <ExternalLink className="w-4 h-4 ml-1 fill-text-caption" />
          </a>
        )}
      </div>
    </div>
  );
};
