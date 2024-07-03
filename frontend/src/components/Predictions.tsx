import Cog from '@/assets/cog.svg?react';
import ExternalLink from '@/assets/external-link.svg?react';
import MoodSadFilled from '@/assets/mood-sad-filled.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import { CASTORA_ADDRESS, abi, usePredictions } from '@/contexts';
import { Pool, Prediction } from '@/models';
import ms from 'ms';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { Breathing } from 'react-shimmer';
import { useAccount, useChains, useWatchContractEvent } from 'wagmi';

export default function Predictions({
  pool: { poolId, noOfPredictions, seeds, completionTime }
}: {
  pool: Pool;
}) {
  const { address } = useAccount();
  const [currentChain] = useChains();
  const retrieve = usePredictions();

  const [hasError, setHasError] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const load = async (showLoading = false) => {
    if (!showLoading) setIsFetching(true);

    const predictionIds = Array.from(Array(noOfPredictions).keys())
      .reverse()
      .map((i) => BigInt(i + 1));
    const predictions = await retrieve(poolId, predictionIds);
    if (!predictions) {
      setIsFetching(false);
      setHasError(true);
      return;
    }

    setPredictions(predictions);
    setIsFetching(false);
    setHasError(false);
  };

  const shorten = (str: string) => {
    if (str.length < 10) return str;
    return (
      str.substring(0, 5) +
      '...' +
      str.split('').reverse().slice(0, 5).reverse().join('')
    );
  };

  useWatchContractEvent({
    address: CASTORA_ADDRESS,
    abi,
    eventName: 'Predicted',
    args: { poolId: BigInt(poolId), predicter: address },
    onLogs: async (logs) => {
      console.log('Predictions.tsx Predicted');
      console.log(logs);
      await load(false);
    }
  });

  useWatchContractEvent({
    address: CASTORA_ADDRESS,
    abi,
    eventName: 'ClaimedWinnings',
    args: { poolId: BigInt(poolId), winner: address },
    onLogs: async (logs) => {
      console.log('Predictions.tsx ClaimedWinnings')
      console.log(logs);
      await load(false);
    }
  });

  useEffect(() => {
    const interval = setInterval(
      () => setNow(Math.trunc(Date.now() / 1000)),
      1000
    );
    return () => clearInterval(interval);
  }, [now]);

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="border border-border-default dark:border-surface-subtle p-6 rounded-[24px] w-full mb-8">
      <h3 className="font-medium text-xl text-text-subtitle mb-6">
        Pool Activities
      </h3>

      {isFetching ? (
        [1, 2, 3, 4, 5].map((i) => (
          <Breathing key={i} height={64} className="mb-3 rounded-2xl w-full" />
        ))
      ) : hasError ? (
        <div className="text-center py-12">
          <p className="mb-4">Something Went Wrong</p>
          <button
            onClick={() => load()}
            className="py-2 px-4 rounded-full font-medium p-ripple border border-border-default dark:border-surface-subtle text-text-subtitle"
          >
            Retry
            <Ripple />
          </button>
        </div>
      ) : predictions.filter(({ predicter }) => predicter != address).length ==
        0 ? (
        <div className="flex flex-col justify-center items-center grow text-center py-20">
          <Cog className="w-12 h-12 mb-4 fill-text-body" />

          <p className="text-lg sm:text-2xl">
            No {noOfPredictions > 0 ? 'Other' : ''} Pool Activity{' '}
            {now >= seeds.windowCloseTime ? '' : 'Yet'}
          </p>
        </div>
      ) : (
        predictions
          .filter(({ predicter }) => predicter != address)
          .map((prediction) => {
            const { id, isAWinner, predicter, price, time, claimWinningsTime } =
              prediction;
            return (
              <div
                key={id}
                className="rounded-2xl bg-surface-subtle p-4 flex justify-between items-center flex-wrap gap-4 mb-4"
              >
                <a
                  href={`${currentChain.blockExplorers?.default.url}/address/${predicter}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center text-sm text-text-caption hover:underline"
                >
                  {shorten(predicter)}
                  <ExternalLink className="w-4 h-4 ml-1 fill-text-caption" />
                </a>

                <p className="text-primary-darker bg-primary-subtle border border-primary-lighter py-0.5 px-3 rounded-full text-sm">
                  ID: {id}
                </p>

                <p className="text-text-caption">
                  {ms((now - time) * 1000)}{' '}
                  {now < seeds.snapshotTime ? 'ago' : ''}
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
                      <div className="flex items-center grow justify-end gap-3">
                        <p className="text-white font-medium flex items-center bg-success-default py-1 px-3 rounded-full w-fit">
                          <Trophy className="fill-white w-4 h-4 mr-1" />
                          Won
                        </p>

                        {!!claimWinningsTime && (
                          <p className="py-1 px-3 rounded-full bg-surface-disabled border-2 border-surface-subtle font-medium text-text-disabled w-fit">
                            <span>Claimed</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-text-disabled font-medium items-center flex bg-surface-subtle py-1 px-3 rounded-full w-fit">
                        <MoodSadFilled className="fill-text-disabled w-4 h-4 mr-1" />
                        Unlucky
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })
      )}
    </div>
  );
}
