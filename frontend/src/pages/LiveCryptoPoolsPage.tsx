import { FilterCryptoPools, PoolCard, PoolCardShimmer } from '@/components';
import { useFilterCryptoPools, usePools, usePoolsShimmer } from '@/contexts';
import { useEffect } from 'react';

export const LiveCryptoPoolsPage = () => {
  const { poolLifes, predictionTokens, stakeTokens, statuses } =
    useFilterCryptoPools();
  const { isFetchingLiveCrypto, liveCryptoPools } = usePools();
  const { shimmerCount } = usePoolsShimmer();

  useEffect(() => {
    document.title = 'Live Crypto Pools | Castora';
  }, []);

  return (
    <>
      <div className="w-full max-md:max-w-md max-w-screen-xl mx-auto">
        <div className="text-sm mb-4 flex w-fit gap-4 text-text-subtitle">
          <p className="py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle">
            <span>Pools</span>
          </p>

          <FilterCryptoPools />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-screen-xl mx-auto">
        {isFetchingLiveCrypto ? (
          Array.from(Array(shimmerCount).keys()).map((i) => (
            <PoolCardShimmer key={i} />
          ))
        ) : liveCryptoPools.filter((p) =>
            p.seeds.matchesFilterCrypto({
              poolLifes,
              predictionTokens,
              stakeTokens,
              statuses
            })
          ).length > 0 ? (
          <>
            {...liveCryptoPools
              .filter((p) =>
                p.seeds.matchesFilterCrypto({
                  poolLifes,
                  predictionTokens,
                  stakeTokens,
                  statuses
                })
              )
              .map((pool) => <PoolCard key={pool.seedsHash} pool={pool} />)}
          </>
        ) : (
          <div className="max-md:flex max-md:flex-col max-md:justify-center max-md:items-center max-md:grow max-md:text-center max-md:py-12  w-full max-w-screen-xl mx-auto">
            <div className="md:border md:border-border-default md:dark:border-surface-subtle md:rounded-2xl md:py-16 md:px-20 md:gap-4 md:max-w-2xl md:text-center">
              <p className="text-lg xs:text-xl mb-8 max-md:max-w-sm">
                Adjust Filters to view pools
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
