import Timer from '@/assets/timer.svg?react';
import { FilterCommunityPools, PoolCard, PoolCardShimmer } from '@/components';
import { useFilterCommunityPools, usePools, usePoolsShimmer } from '@/contexts';
import { Pool } from '@/schemas';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const MainnetPoolsPage = () => {
  const filters = useFilterCommunityPools();
  const { isFetchingLiveCrypto, liveCryptoPools, isFetchingLiveCommunity, liveCommunityPools } = usePools();
  const { shimmerCount } = usePoolsShimmer();
  const [filtered, setFiltered] = useState<Pool[]>([]);

  useEffect(() => {
    setFiltered(
      [...liveCryptoPools, ...liveCommunityPools].filter((p) =>
        p.seeds.matchesFilterCommunity({
          multipliers: filters.multipliers,
          predictionTokens: filters.predictionTokens,
          stakeTokens: filters.stakeTokens,
          statuses: filters.statuses
        })
      )
    );
  }, [
    filters.multipliers,
    filters.predictionTokens,
    filters.stakeTokens,
    filters.statuses,
    liveCryptoPools,
    liveCommunityPools
  ]);

  useEffect(() => {
    document.title = 'Pools | Castora';
  }, []);

  return (
    <>
      <div className="w-full top-16 sm:top-[72px] sticky z-10 bg-app-bg p-6 text-sm text-text-subtitle max-[414px]:px-4 px-8">
        <div className="flex flex-wrap gap-4 max-w-screen-xl mx-auto">
          <p className="text-sm py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle">
            Pools
          </p>

          <FilterCommunityPools />

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
        </div>
      </div>

      <div className=" max-[414px]:px-4 px-8 pb-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-screen-xl mx-auto pt-4">
          {isFetchingLiveCrypto || isFetchingLiveCommunity ? (
            Array.from(Array(shimmerCount).keys()).map((i) => <PoolCardShimmer key={i} />)
          ) : (
            <>
              {filtered.length > 0 ? (
                <>{...filtered.map((pool) => <PoolCard key={pool.seedsHash} pool={pool} />)}</>
              ) : (
                <div className="max-md:flex max-md:flex-col max-md:justify-center max-md:items-center max-md:grow max-md:text-center max-md:py-12  w-full md:border md:border-border-default md:dark:border-surface-subtle md:rounded-2xl md:py-28 md:px-20 md:gap-4 md:max-w-2xl md:text-center">
                  <p className="text-lg xs:text-2xl mb-8 max-md:max-w-sm">
                    {liveCryptoPools.length === 0 ? 'Pools will show up in a bit' : 'Adjust Filters to view pools'}
                  </p>
                </div>
              )}

              <div className="border border-border-default dark:border-surface-subtle p-5 rounded-2xl w-full max-w-md mx-auto md:flex md:grow md:flex-col">
                <div className="flex justify-between">
                  <div className="flex p-2 pl-4 mb-4 rounded-full items-center  bg-surface-subtle w-fit">
                    <div className="text-sm md:text-md">Pool ID: ---</div>
                    <div className={'ml-6 text-xs md:text-sm p-2 px-4 rounded-full  bg-success-default text-white'}>
                      Open
                    </div>
                  </div>

                  <div>
                    <Tooltip target="#preview-pool-life" />
                    <Timer
                      id="preview-pool-life"
                      className="w-5 h-5 mt-1 -mr-1 fill-primary-default"
                      data-pr-tooltip="Pool Life"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 items-start mb-4">
                  <div className="w-8 h-8 rounded-full bg-surface-subtle"></div>
                  <div className="font-medium text-2xl text-text-title">---/USD</div>
                </div>

                <div className="text-xs md:text-sm text-text-subtitle mb-2">
                  Pool <span className="font-black">Closes</span> In
                </div>

                <div className="py-1.5 px-4 mb-4 font-medium rounded-full w-fit text-sm sm:text-md border  border-primary-lighter bg-primary-subtle text-primary-darker">
                  <>00h : 00m : 00s</>
                </div>

                <div>
                  <p className="text-center text-2xl mt-3 mb-6">Get Started Now</p>
                  <div className="flex justify-center mb-8">
                    <Link
                      to="/pools/create"
                      className="py-2 px-6 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
                    >
                      Create Pool
                      <Ripple />
                    </Link>
                  </div>
                </div>

                <div className="hidden md:block mt-auto"></div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
