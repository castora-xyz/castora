import { communityPoolsType, FilterCommunityPools, PoolCard, PoolCardShimmer, PoolsPageIntro } from '@/components';
import { useFilterCommunityPools, usePools, usePoolsShimmer } from '@/contexts';
import { Pool } from '@/schemas';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
      <PoolsPageIntro
        poolsPageType={communityPoolsType}
        filter={
          <>
            <FilterCommunityPools />
            {/* Wide Screen Create Pool Button */}
            <Link
              to="/pools/create"
              className="hidden md:block ml-auto py-2 px-6 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
            >
              Create Pool
              <Ripple />
            </Link>
            {/* Mobile Create Button */}
            <div className="md:hidden flex justify-end mb-4">
              <Tooltip target=".create-pool" pt={{ root: { className: 'w-36' } }} />
              <Link
                to="/pools/create"
                className="fixed bottom-24 right-4 z-20 w-14 h-14 rounded-full bg-primary-default border-2 border-primary-lighter flex items-center justify-center shadow-lg p-ripple"
              >
                <span className="create-pool text-5xl text-white -mt-2.5" data-pr-tooltip="Create Pool">
                  +
                </span>
                <Ripple />
              </Link>
            </div>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-screen-xl mx-auto">
        {isFetchingLiveCommunity ? (
          Array.from(Array(shimmerCount).keys()).map((i) => <PoolCardShimmer key={i} />)
        ) : filtered.length > 0 ? (
          <>{...filtered.map((pool) => <PoolCard key={pool.seedsHash} pool={pool} />)}</>
        ) : (
          <div className="max-md:flex max-md:flex-col max-md:justify-center max-md:items-center max-md:grow max-md:text-center max-md:py-12  w-full max-w-screen-xl mx-auto">
            <div className="md:border md:border-border-default md:dark:border-surface-subtle md:rounded-2xl md:py-16 md:px-12 md:gap-4 md:max-w-2xl md:text-center">
              {liveCommunityPools.length === 0 ? (
                <>
                  <p className="text-lg xs:text-xl mb-8 max-md:max-w-sm">
                    No community pools at the moment. Create a public one to get started!
                  </p>
                  <Link
                    to="/pools/create"
                    className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
                  >
                    Create Pool
                    <Ripple />
                  </Link>
                </>
              ) : (
                <p className="text-lg xs:text-xl mb-8 max-md:max-w-sm">Adjust Filters to view pools</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
