import {
  CompletedPoolDisplay,
  JoinPoolForm,
  MyInCreatedPoolDisplay,
  MyInPoolPredictions,
  MyInPoolPredsRef,
  PoolDetailPageIntro,
  PoolDetailPageShimmer,
  PoolDetailsInCards,
  PredictionsDisplay,
  TradingViewChart
} from '@/components';
import { useCurrentTime, usePools } from '@/contexts';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { Pool } from '@/schemas';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import { Ripple } from 'primereact/ripple';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';

export const PoolDetailPage = () => {
  const { chain: currentChain } = useAccount();
  const { now } = useCurrentTime();
  const { poolId } = useParams();
  const { isValidPoolId, fetchOne } = usePools();

  const myInPoolPredsRef = useRef<MyInPoolPredsRef>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pool, setPool] = useState<Pool | null>(null);
  const [prevCurrentChain, setPrevCurrentChain] = useState(currentChain);

  const load = async (showLoading: boolean) => {
    setIsLoading(showLoading);

    if (!(await isValidPoolId(poolId))) {
      setIsLoading(false);
      setHasError(false);
    } else {
      try {
        const fetched = await fetchOne(+poolId!);
        if (fetched) {
          const { seeds, noOfPredictions, completionTime } = fetched;

          if (now >= seeds.snapshotTime) {
            if (noOfPredictions === 0 || completionTime === 0) {
              if (now - seeds.snapshotTime < 15) {
                // Waiting for the snapshot price to be available
                await new Promise((resolve) => setTimeout(resolve, 15000));
              }

              // Fetching the snapshot price from Pyth Network
              try {
                const { price, expo } = (
                  await new PriceServiceConnection('https://hermes.pyth.network').getPriceFeed(
                    seeds.predictionTokenDetails.pythPriceId,
                    seeds.snapshotTime
                  )
                ).getPriceUnchecked();
                fetched.snapshotPrice = parseFloat((+price * 10 ** expo).toFixed(Math.abs(expo)));
                if (noOfPredictions === 0) {
                  fetched.completionTime = Math.trunc(Date.now() / 1000);
                }
              } catch (e) {
                console.log(e);
              }

              setPool(fetched);
            } else setPool(fetched);
          } else setPool(fetched);
          setHasError(false);
        } else {
          // Only set error if there has no been a fetched pool before
          if (!pool) setHasError(true);
        }
      } catch (error) {
        console.error(error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (prevCurrentChain && currentChain && prevCurrentChain.name != currentChain.name) {
      // Full-reloading the page if the user proactively changed the active chain
      // to something different as the poolId might be something else
      window.location.reload();
    } else {
      setPrevCurrentChain(currentChain);
    }
  }, [currentChain]);

  useEffect(() => {
    if (!!pool) document.title = `Pool ${pool.poolId} - Castora`;
  }, [pool]);

  useEffect(() => {
    load(true);

    // Update the pool page contents anytime the user leaves the page and comes back
    window.addEventListener('focus', () => load(false));
  }, []);

  if (isLoading) return <PoolDetailPageShimmer />;

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center grow text-center">
        <h1 className="text-2xl font-bold mb-4">Error Occured</h1>
        <p className="text-lg mb-8">Something went wrong</p>
        <button
          className="mx-auto py-2 px-16 rounded-full font-medium border border-border-default dark:border-surface-subtle text-text-subtitle p-ripple"
          onClick={() => load(true)}
        >
          Try Again
          <Ripple />
        </button>
      </div>
    );
  }

  if (!pool) return <NotFoundPage />;

  return (
    now && ( // "now &&" is to always re-render the UI every second
      // This will be re-calling the seeds.methods() to get the control-flow.
      <>
        <PoolDetailPageIntro pool={pool} />

        <div className="sm:hidden">
          <MyInCreatedPoolDisplay pool={pool} />
        </div>

        <div className="sm:hidden">
          {now > pool.seeds.windowCloseTime && pool.noOfPredictions > 0 && <MyInPoolPredictions pool={pool} />}
        </div>

        <div className="lg:w-full lg:max-w-(--breakpoint-xl) lg:mx-auto lg:flex">
          <div className={'lg:relative lg:grow ' + (pool.seeds.status() === 'Completed' ? ' lg:basis-1/2' : '')}>
            <div className="mb-8 lg:mb-px lg:mr-8 lg:sticky lg:top-0">
              {pool.seeds.status() !== 'Completed' ? (
                <TradingViewChart pair={pool.seeds.chartPairName()} />
              ) : (
                <CompletedPoolDisplay pool={pool} />
              )}

              <PoolDetailsInCards pool={pool} />
            </div>
          </div>

          <div
            className={
              'max-lg:max-w-2xl max-lg:mx-auto lg:grow lg:basis-1/' + (pool.seeds.status() !== 'Completed' ? '3' : '2')
            }
          >
            <div className="max-sm:hidden">
              <MyInCreatedPoolDisplay pool={pool} />
            </div>

            <div className={now > pool.seeds.windowCloseTime ? 'max-sm:hidden' : ''}>
              {pool.noOfPredictions > 0 && <MyInPoolPredictions pool={pool} ref={myInPoolPredsRef} />}
            </div>

            {pool.seeds.status() === 'Open' && (
              <JoinPoolForm
                pool={pool}
                handlePredictionSuccess={async () => {
                  await myInPoolPredsRef.current?.onPredict();
                  await load(false);
                }}
              />
            )}

            <PredictionsDisplay pool={pool} />
          </div>
        </div>
      </>
    )
  );
};
