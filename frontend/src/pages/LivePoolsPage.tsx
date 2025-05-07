import { FilterPools, PoolCard, PoolCardShimmer } from '@/components';
import { useFilterPools, usePools } from '@/contexts';
import { useEffect, useState } from 'react';

export const LivePoolsPage = () => {
  const { isFetchingLive: isFetchingPools, livePools } = usePools();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { poolLifes, predictionTokens, stakeTokens, statuses } =
    useFilterPools();

  const getShimmerCount = () => {
    if (windowWidth < 768) return 3;
    else if (windowWidth < 1024) return 5;
    else if (windowWidth < 1280) return 8;
    else return 10;
  };
  const [shimmerCount, setShimmerCount] = useState(getShimmerCount());

  useEffect(() => {
    setShimmerCount(getShimmerCount());
  }, [windowWidth]);

  useEffect(() => {
    document.title = 'Live Pools | Castora';
    window.addEventListener('resize', () => setWindowWidth(window.innerWidth));
  }, []);

  return (
    <>
      <div className="w-full max-md:max-w-md max-w-screen-xl mx-auto">
        <div className="text-sm mb-4 flex w-fit gap-4 text-text-subtitle">
          <p className="py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle">
            <span>Pools</span>
          </p>

          <FilterPools />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-screen-xl mx-auto">
        {isFetchingPools ? (
          Array.from(Array(shimmerCount).keys()).map((i) => (
            <PoolCardShimmer key={i} />
          ))
        ) : livePools.filter((p) =>
            p.seeds.matchesFilter({
              poolLifes,
              predictionTokens,
              stakeTokens,
              statuses
            })
          ).length > 0 ? (
          livePools
            .filter((p) =>
              p.seeds.matchesFilter({
                poolLifes,
                predictionTokens,
                stakeTokens,
                statuses
              })
            )
            .map((pool) => <PoolCard key={pool.seedsHash} pool={pool} />)
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
