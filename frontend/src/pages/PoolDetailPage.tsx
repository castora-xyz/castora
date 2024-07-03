import CompletedPoolDisplay from '@/components/CompletedPoolDisplay';
import JoinPoolForm from '@/components/JoinPoolForm';
import MyInPoolPredictions from '@/components/MyInPoolPredictions';
import PoolDetailIntroBadge from '@/components/PoolDetailIntroBadge';
import PoolDetailPageShimmer from '@/components/PoolDetailPageShimmer';
import PoolDetailsInCards from '@/components/PoolDetailsInCards';
import Predictions from '@/components/Predictions';
import {
  CASTORA_ADDRESS,
  abi,
  usePools,
  useServer,
  useTheme
} from '@/contexts';
import { Pool } from '@/models';
import NotFoundPage from '@/pages/NotFoundPage';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { useWatchContractEvent } from 'wagmi';

export function Component() {
  const { poolId } = useParams();
  const { isValidPoolId, fetchOne } = usePools();
  const server = useServer();
  const { isDarkDisplay } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pool, setPool] = useState<Pool | null>(null);

  useWatchContractEvent({
    address: CASTORA_ADDRESS,
    abi,
    eventName: 'Predicted',
    args: {
      poolId: BigInt(+poolId!)
    },
    onLogs: async (logs) => {
      console.log('PoolDetailPage.tsx Predicted');
      console.log(logs);
      if (pool) {
        const newPool = await fetchOne(pool.poolId);
        console.log(pool);
        console.log(newPool);
        if (newPool) setPool(newPool);
      }
    }
  });

  useWatchContractEvent({
    address: CASTORA_ADDRESS,
    abi,
    eventName: 'CompletedPool',
    args: {
      poolId: BigInt(+poolId!)
    },
    onLogs: async () => {
      if (pool) {
        const newPool = await fetchOne(pool.poolId);
        if (newPool) setPool(newPool);
      }
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
              } catch (e) {
                console.log(e);
              }
              setPool(pool);
            } else if (pool.completionTime === 0) {
              if (!!(await server.get(`/pools/${poolId}/complete`))) {
                setPool(pool);
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
    if (!!pool) document.title = `Pool ${pool.poolId} - Castora`;
  }, [pool]);

  useEffect(() => {
    load();
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
    <>
      <PoolDetailIntroBadge pool={pool} />

      <div className="sm:hidden">
        {Math.trunc(Date.now() / 1000) > pool.seeds.windowCloseTime &&
          pool.noOfPredictions > 0 && <MyInPoolPredictions pool={pool} />}
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
            'max-lg:max-w-lg max-lg:mx-auto lg:grow lg:basis-1/' +
            (pool.seeds.status() !== 'Completed' ? '3' : '2')
          }
        >
          <div
            className={
              Math.trunc(Date.now() / 1000) > pool.seeds.windowCloseTime
                ? 'max-sm:hidden'
                : ''
            }
          >
            {pool.noOfPredictions > 0 && <MyInPoolPredictions pool={pool} />}
          </div>

          {pool.seeds.status() === 'Open' && <JoinPoolForm pool={pool} />}

          <Predictions pool={pool} />
        </div>
      </div>
    </>
  );
}
