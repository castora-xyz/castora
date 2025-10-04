import { cryptoPoolsType, FilterCryptoPools, PoolCard, PoolCardShimmer, PoolsPageIntro } from '@/components';
import { useFilterCryptoPools, usePools, usePoolsShimmer } from '@/contexts';
import { Pool } from '@/schemas';
import { useEffect, useState } from 'react';

export const LiveCryptoPoolsPageV2 = () => {
  const { poolLifes, predictionTokens, stakeTokens, statuses } = useFilterCryptoPools();
  const { isFetchingLiveCrypto, liveCryptoPools } = usePools();
  const { shimmerCount } = usePoolsShimmer();

  const [filtered, setFiltered] = useState<Pool[]>([]);

  useEffect(() => {
    setFiltered(
      liveCryptoPools.filter(
        (p) =>
          p.isFlash() ||
          p.seeds.matchesFilterCrypto({
            poolLifes,
            predictionTokens,
            stakeTokens,
            statuses
          })
      )
    );
  }, [poolLifes, predictionTokens, stakeTokens, statuses, liveCryptoPools]);

  useEffect(() => {
    document.title = 'Crypto Pools | Castora';
  }, []);

  return (
    <>
      <PoolsPageIntro poolsPageType={cryptoPoolsType} filter={<FilterCryptoPools />} />
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-screen-xl mx-auto">
        {isFetchingLiveCrypto ? (
          Array.from(Array(shimmerCount).keys()).map((i) => <PoolCardShimmer key={i} />)
        ) : filtered.length > 0 ? (
          <>{...filtered.map((pool) => <PoolCard key={pool.seedsHash} pool={pool} />)}</>
        ) : (
          <div className="max-md:flex max-md:flex-col max-md:justify-center max-md:items-center max-md:grow max-md:text-center max-md:py-12  w-full max-w-screen-xl mx-auto">
            <div className="md:border md:border-border-default md:dark:border-surface-subtle md:rounded-2xl md:py-16 md:px-20 md:gap-4 md:max-w-2xl md:text-center">
              <p className="text-lg xs:text-xl mb-8 max-md:max-w-sm">Adjust Filters to view pools</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
