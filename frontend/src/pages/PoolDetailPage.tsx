import {
  CompletedPoolDisplay,
  JoinPoolForm,
  MyInPoolPredictions,
  PoolDetailIntroBadge,
  PoolDetailPageShimmer,
  PoolDetailsInCards,
  PredictionsDisplay
} from '@/components';
import {
  CASTORA_ADDRESS,
  abi,
  usePools,
  useServer,
  useTheme
} from '@/contexts';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { Pool } from '@/schemas';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { useWatchContractEvent } from 'wagmi';

export const PoolDetailPage = () => {
  const { poolId } = useParams();
  const { isValidPoolId, fetchOne } = usePools();
  const server = useServer();
  const { isDarkDisplay } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));
  const [pool, setPool] = useState<Pool | null>(null);

  useWatchContractEvent({
    address: CASTORA_ADDRESS,
    abi,
    eventName: 'Predicted',
    args: {
      poolId: BigInt(isNaN(+poolId!) ? 0 : poolId!)
    },
    onLogs: async (logs) => {
      if (!pool) return await load();
      const maxLatestPredictionId = Math.max(
        ...logs.map(({ args }) => Number(args.predictionId))
      );
      if (pool.noOfPredictions < maxLatestPredictionId) {
        const newPool = await fetchOne(pool.poolId);
        if (newPool) setPool(newPool);
      }
    }
  });

  useWatchContractEvent({
    address: CASTORA_ADDRESS,
    abi,
    eventName: 'CompletedPool',
    args: {
      poolId: BigInt(isNaN(+poolId!) ? 0 : poolId!)
    },
    onLogs: async () => {
      if (!pool || !pool.completionTime) load();
    }
  });

  const load = async () => {
    setIsLoading(true);
    if (!(await isValidPoolId(poolId))) {
      setIsLoading(false);
      setHasError(false);
    } else {
      try {
        const pool = await fetchOne(+poolId!);
        if (pool) {
          if (Math.round(Date.now() / 1000) >= pool.seeds.snapshotTime) {
            if (pool.noOfPredictions === 0) {
              try {
                const { price, expo } = (
                  await new PriceServiceConnection(
                    'https://hermes.pyth.network'
                  ).getPriceFeed(
                    pool.seeds.predictionTokenDetails.pythPriceId,
                    pool.seeds.snapshotTime
                  )
                ).getPriceUnchecked();
                pool.snapshotPrice = parseFloat(
                  (+price * 10 ** expo).toFixed(Math.abs(expo))
                );
                pool.completionTime = Math.trunc(Date.now() / 1000);
              } catch (e) {
                console.log(e);
              }
              setPool(pool);
            } else if (pool.completionTime === 0) {
              if (!!(await server.get(`/pool/${poolId}/complete`))) {
                setPool(await fetchOne(+poolId!)); // refetching for update
              } else setHasError(true);
            } else setPool(pool);
          } else setPool(pool);
        } else setHasError(true);
      } catch (error) {
        console.error(error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (pool && now >= pool.seeds.snapshotTime && !pool.completionTime) {
      load();
    }
  }, [now]);

  useEffect(() => {
    if (!!pool) document.title = `Pool ${pool.poolId} - Castora`;
  }, [pool]);

  useEffect(() => {
    load();

    const interval = setInterval(
      () => setNow(Math.trunc(Date.now() / 1000)),
      1000
    );
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <PoolDetailPageShimmer />;

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center grow text-center">
        <h1 className="text-2xl font-bold mb-4">Error Occured</h1>
        <p className="text-lg mb-8">Something went wrong</p>
        <button
          className="mx-auto py-2 px-16 rounded-full font-medium border border-border-default dark:border-surface-subtle text-text-subtitle p-ripple"
          onClick={load}
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
        <PoolDetailIntroBadge pool={pool} />

        <div className="sm:hidden">
          {now > pool.seeds.windowCloseTime && pool.noOfPredictions > 0 && (
            <MyInPoolPredictions pool={pool} />
          )}
        </div>

        <div className="lg:w-full lg:max-w-screen-xl lg:mx-auto lg:flex">
          <div
            className={
              'lg:relative lg:grow ' +
              (pool.seeds.status() === 'Completed' ? ' lg:basis-1/2' : '')
            }
          >
            <div className="mb-8 lg:mb-px lg:mr-8 lg:sticky lg:top-0">
              {pool.seeds.status() !== 'Completed' ? (
                <AdvancedRealTimeChart
                  allow_symbol_change={false}
                  autosize
                  enable_publishing={false}
                  interval="180"
                  style="1"
                  symbol={pool.seeds.chartPairName()}
                  withdateranges={true}
                  theme={isDarkDisplay ? 'dark' : 'light'}
                />
              ) : (
                <CompletedPoolDisplay pool={pool} />
              )}

              <PoolDetailsInCards pool={pool} />
            </div>
          </div>

          <div
            className={
              'max-lg:max-w-2xl max-lg:mx-auto lg:grow lg:basis-1/' +
              (pool.seeds.status() !== 'Completed' ? '3' : '2')
            }
          >
            <div
              className={
                now > pool.seeds.windowCloseTime ? 'max-sm:hidden' : ''
              }
            >
              {pool.noOfPredictions > 0 && <MyInPoolPredictions pool={pool} />}
            </div>

            {pool.seeds.status() === 'Open' && <JoinPoolForm pool={pool} />}

            <PredictionsDisplay pool={pool} />
          </div>
        </div>
      </>
    )
  );
}
