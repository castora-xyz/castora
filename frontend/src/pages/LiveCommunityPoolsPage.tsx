import { FilterCommunityPools, PoolCard, PoolCardShimmer } from '@/components';
import { useFilterCommunityPools, usePools, usePoolsShimmer } from '@/contexts';
import { Pool } from '@/schemas';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ripple } from 'primereact/ripple';

export const LiveCommunityPoolsPage = () => {
  const { predictionTokens, stakeTokens, statuses, multipliers } = useFilterCommunityPools();
  const { isFetchingLiveCommunity, liveCommunityPools } = usePools();
  const { shimmerCount } = usePoolsShimmer();

  const [filtered, setFiltered] = useState<Pool[]>([]);

  useEffect(() => {
    setFiltered(
      liveCommunityPools.filter((p) =>
        p.seeds.matchesFilterCommunity({
          predictionTokens,
          stakeTokens,
          statuses,
          multipliers
        })
      )
    );
  }, [predictionTokens, stakeTokens, statuses, multipliers, liveCommunityPools]);

  useEffect(() => {
    document.title = 'Community Pools | Castora';
  }, []);

  return (
    <>
      <div className="w-full max-md:max-w-md max-w-screen-xl sticky top-20 z-10 bg-app-bg py-4 -mx-4 px-4">
        <div className="text-sm mb-4 flex w-fit gap-4 text-text-subtitle items-center">
          <p className="py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle">
            <span>Pools</span>
          </p>
          <p className="py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle">
            <span>Community</span>
          </p>

          <FilterCommunityPools />

          {/* Create Pool Button */}
          <Link
            to="/pools/community/create"
            className="hidden md:block ml-auto py-2 px-6 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
          >
            Create Pool
            <Ripple />
          </Link>
        </div>

        {/* Mobile Create Button */}
        <div className="md:hidden flex justify-end mb-4">
          <Link
            to="/pools/community/create"
            className="fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-primary-default border-2 border-primary-lighter flex items-center justify-center shadow-lg p-ripple"
          >
            <span className="text-2xl text-white">+</span>
            <Ripple />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-screen-xl mx-auto">
        {isFetchingLiveCommunity ? (
          Array.from(Array(shimmerCount).keys()).map((i) => <PoolCardShimmer key={i} />)
        ) : filtered.length > 0 ? (
          <>{...filtered.map((pool) => <PoolCard key={pool.seedsHash} pool={pool} />)}</>
        ) : (
          <div className="max-md:flex max-md:flex-col max-md:justify-center max-md:items-center max-md:grow max-md:text-center max-md:py-12  w-full max-w-screen-xl mx-auto">
            <div className="md:border md:border-border-default md:dark:border-surface-subtle md:rounded-2xl md:py-16 md:px-20 md:gap-4 md:max-w-2xl md:text-center">
              <p className="text-lg xs:text-xl mb-8 max-md:max-w-sm">No community pools found. Create one to get started!</p>
              <Link
                to="/pools/community/create"
                className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
              >
                Create Pool
                <Ripple />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
