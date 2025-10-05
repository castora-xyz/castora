import { FilterStockPools, PoolCard, PoolCardShimmer, PoolsPageIntro, stockPoolsType } from '@/components';
import { useFilterStockPools, usePools, usePoolsShimmer } from '@/contexts';
import { useEffect } from 'react';

export const LiveStocksPoolsPage = () => {
  const { predictionTokens, statuses } = useFilterStockPools();
  const { isFetchingLiveStocks, liveStocksPools } = usePools();
  const { shimmerCount } = usePoolsShimmer();

  useEffect(() => {
    document.title = 'Stock Pools | Castora';
  }, []);

  return (
    <>
      <PoolsPageIntro poolsPageType={stockPoolsType} filter={<FilterStockPools />} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-screen-xl mx-auto">
        {isFetchingLiveStocks ? (
          Array.from(Array(shimmerCount).keys()).map((i) => <PoolCardShimmer key={i} />)
        ) : liveStocksPools.filter((p) =>
            p.seeds.matchesFilterStock({
              predictionTokens,
              statuses
            })
          ).length > 0 ? (
          <>
            {...liveStocksPools
              .filter((p) =>
                p.seeds.matchesFilterStock({
                  predictionTokens,
                  statuses
                })
              )
              .map((pool) => <PoolCard key={pool.seedsHash} pool={pool} />)}
          </>
        ) : (
          <div className="max-md:flex max-md:flex-col max-md:justify-center max-md:items-center max-md:grow max-md:text-center max-md:py-12  w-full max-w-screen-xl mx-auto">
            <div className="md:border md:border-border-default md:dark:border-surface-subtle md:rounded-2xl md:py-16 md:px-20 md:gap-4 md:max-w-2xl md:text-center">
              <div className="text-lg xs:text-xl mb-8 max-md:max-w-sm">
                <p className="text-lg xs:text-xl mb-8 max-md:max-w-sm">
                  {liveStocksPools.length === 0 ? 'Pools will show up in a bit' : 'Adjust Filters to view pools'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
