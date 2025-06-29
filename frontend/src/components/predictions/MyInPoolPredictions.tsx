import ExternalLink from '@/assets/external-link.svg?react';
import MoodSadFilled from '@/assets/mood-sad-filled.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import { ClaimAllButton, ClaimButton } from '@/components';
import { useMyActivity, useMyPredictions } from '@/contexts';
import { Pool, Prediction } from '@/schemas';
import ms from 'ms';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useState } from 'react';
import { Breathing } from 'react-shimmer';
import { useAccount } from 'wagmi';

export const MyInPoolPredictions = ({
  pool,
  pool: { seeds, completionTime, noOfPredictions }
}: {
  pool: Pool;
}) => {
  const { isConnected } = useAccount();
  const { fetchMyActivity } = useMyActivity();
  const { isFetching, hasEverFetched, myPredictions, fetchMyPredictions } =
    useMyPredictions(pool);
  const [unclaimedWins, setUnclaimedWins] = useState<Prediction[]>([]);

  useEffect(() => {
    myPredictions &&
      setUnclaimedWins(
        myPredictions.filter(
          ({ claimWinningsTime, isAWinner }) =>
            claimWinningsTime === 0 && isAWinner
        )
      );
  }, [myPredictions]);

  useEffect(() => {
    if (noOfPredictions > 0) {
      fetchMyPredictions();
      fetchMyActivity();
    }
  }, [noOfPredictions]);

  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(
      () => setNow(Math.trunc(Date.now() / 1000)),
      1000
    );
    return () => clearInterval(interval);
  }, [now]);

  if (
    !isConnected ||
    !hasEverFetched ||
    (!isFetching && myPredictions && myPredictions.length === 0)
  ) {
    return <></>;
  }

  return (
    <div className="border border-border-default dark:border-surface-subtle p-6 rounded-[24px] w-full mb-8">
      <div className="flex gap-4 justify-between flex-wrap items-center mb-6">
        <h3 className="font-medium text-xl text-text-subtitle">
          My Predictions
        </h3>

        {pool.completionTime > 0 && unclaimedWins.length > 1 && (
          <ClaimAllButton
            pools={Array.from(Array(unclaimedWins.length)).map((_) => pool)}
            predictions={unclaimedWins}
            onSuccess={() => {
              fetchMyPredictions();
              fetchMyActivity();
            }}
          />
        )}
      </div>

      {isFetching ? (
        [1, 2, 3].map((i) => (
          <Breathing key={i} height={64} className="mb-3 rounded-2xl w-full" />
        ))
      ) : !myPredictions ? (
        <div className="text-center pb-4">
          <p className="mb-4">Something Went Wrong</p>
          <button
            onClick={fetchMyPredictions}
            className="py-2 px-4 rounded-full font-medium p-ripple border border-border-default dark:border-surface-subtle text-text-subtitle"
          >
            Retry
            <Ripple />
          </button>
        </div>
      ) : (
        myPredictions.map((prediction) => {
          const { explorerUrl, id, price, time, isAWinner } = prediction;
          return (
            <div
              key={id}
              className="rounded-2xl bg-surface-subtle p-4 flex justify-between items-center flex-wrap gap-4 mb-4"
            >
              <p className="text-primary-darker bg-primary-subtle border border-primary-lighter py-0.5 px-3 rounded-full text-sm">
                ID: {id}
              </p>

              <Tooltip target=".prediction-time" />
              <p
                className="prediction-time text-text-caption cursor-context-menu"
                data-pr-tooltip={`Prediction Time: ${
                  `${new Date(time * 1000)}`.split(' GMT')[0]
                }`}
              >
                {ms((now - time) * 1000)}
              </p>

              {!completionTime ? (
                <p>
                  {seeds.predictionTokenDetails.name} @ {price}
                </p>
              ) : (
                <>
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
                    ${price}
                  </p>

                  {isAWinner ? (
                    <div className="flex items-center justify-end gap-3">
                      <p className="text-white font-medium flex items-center bg-success-default py-1 px-3 rounded-full w-fit">
                        <Trophy className="fill-white w-4 h-4 mr-1" />
                        Won
                      </p>
                      <ClaimButton
                        pool={pool}
                        prediction={prediction}
                        onSuccess={() => {
                          fetchMyPredictions();
                          fetchMyActivity();
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-text-disabled font-medium items-center flex bg-surface-subtle py-1 px-3 rounded-full w-fit">
                      <MoodSadFilled className="fill-text-disabled w-4 h-4 mr-1" />
                      Unlucky
                    </p>
                  )}
                </>
              )}

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
          );
        })
      )}
    </div>
  );
};
