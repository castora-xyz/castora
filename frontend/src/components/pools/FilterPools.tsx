import FilterList from '@/assets/filter-list.svg?react';
import {
  ALL_COMMUNITY_MULTIPLIERS,
  ALL_COMMUNITY_PREDICTION_TOKENS,
  ALL_CRYPTO_POOL_LIFES,
  ALL_CRYPTO_PREDICTION_TOKENS,
  ALL_CRYPTO_STAKE_TOKENS,
  ALL_STATUSES,
  ALL_STOCK_PREDICTION_TOKENS,
  useFilterCommunityPools,
  useFilterCryptoPools,
  useFilterStockPools,
  useFirebase
} from '@/contexts';
import { Dialog } from 'primereact/dialog';
import { Ripple } from 'primereact/ripple';
import { useState } from 'react';

interface FilterPoolsSectionProps {
  title: string;
  current: string[];
  all: string[];
  onClick: (item: string) => void;
}

const FilterPoolsSection = ({ title, current, all, onClick }: FilterPoolsSectionProps) => (
  <div className="mb-6 flex items-start gap-x-3 gap-y-2">
    <p className="py-0.5 px-6 mb-2 text-sm rounded-full w-fit border border-border-default dark:border-surface-subtle">
      <span className="-mt-0.5 block">{title}</span>
    </p>
    <div className="flex flex-wrap gap-3">
      {all.map((item) => (
        <button
          key={item}
          className={
            'p-ripple text-xs md:text-sm py-1 px-3 rounded-full ' +
            `${
              current.includes(item)
                ? 'bg-primary-default text-white'
                : 'text-primary-default border border-primary-default'
            }`
          }
          onClick={() => onClick(item)}
        >
          {item}
          <Ripple />
        </button>
      ))}
    </div>
  </div>
);

export const FilterStockPools = () => {
  const { recordEvent } = useFirebase();
  const [visible, setVisible] = useState(false);
  const { predictionTokens, statuses, togglePredictionToken, toggleStatus } = useFilterStockPools();

  return (
    <>
      <button
        className="outline-none p-ripple py-2 px-6 rounded-full border border-border-default dark:border-surface-subtle flex w-fit items-center"
        onClick={() => setVisible(true)}
      >
        <Ripple />
        <span className="text-text-subtitle">Filters</span>
        <div className="relative">
          <FilterList className="ml-2 w-4 h-4 fill-text-subtitle" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-primary-default top-0.5 right-0"></div>
        </div>
      </button>

      <Dialog
        header="Filter Stocks Pools"
        visible={visible}
        onHide={() => {
          recordEvent('filtered_stock_pools', {
            predictionTokens: JSON.stringify(predictionTokens),
            statuses: JSON.stringify(statuses)
          });
          if (!visible) return;
          setVisible(false);
        }}
        pt={{
          root: { className: 'mx-8' },
          header: { className: 'dark:bg-app-bg' },
          content: { className: 'dark:bg-app-bg' }
        }}
      >
        <FilterPoolsSection
          title="Pair"
          current={predictionTokens}
          all={ALL_STOCK_PREDICTION_TOKENS}
          onClick={togglePredictionToken}
        />

        <FilterPoolsSection title="Status" current={statuses} all={ALL_STATUSES} onClick={toggleStatus} />
      </Dialog>
    </>
  );
};

export const FilterCryptoPools = () => {
  const { recordEvent } = useFirebase();
  const [visible, setVisible] = useState(false);
  const {
    poolLifes,
    predictionTokens,
    stakeTokens,
    statuses,
    togglePoolLife,
    togglePredictionToken,
    toggleStakeToken,
    toggleStatus
  } = useFilterCryptoPools();

  return (
    <>
      <button
        className="outline-none p-ripple py-2 px-6 rounded-full border border-border-default dark:border-surface-subtle flex w-fit items-center"
        onClick={() => setVisible(true)}
      >
        <Ripple />
        <span className="text-text-subtitle">Filters</span>
        <div className="relative">
          <FilterList className="ml-2 w-4 h-4 fill-text-subtitle" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-primary-default top-0.5 right-0"></div>
        </div>
      </button>

      <Dialog
        header="Filter Crypto Pools"
        visible={visible}
        onHide={() => {
          recordEvent('filtered_crypto_pools', {
            predictionTokens: JSON.stringify(predictionTokens),
            poolLifes: JSON.stringify(poolLifes),
            stakeTokens: JSON.stringify(stakeTokens),
            statuses: JSON.stringify(statuses)
          });
          if (!visible) return;
          setVisible(false);
        }}
        pt={{
          root: { className: 'mx-8' },
          header: { className: 'dark:bg-app-bg' },
          content: { className: 'dark:bg-app-bg' }
        }}
      >
        <FilterPoolsSection
          title="Pair"
          current={predictionTokens}
          all={ALL_CRYPTO_PREDICTION_TOKENS}
          onClick={togglePredictionToken}
        />

        <FilterPoolsSection title="Life" current={poolLifes} all={ALL_CRYPTO_POOL_LIFES} onClick={togglePoolLife} />

        <FilterPoolsSection title="Status" current={statuses} all={ALL_STATUSES} onClick={toggleStatus} />

        <FilterPoolsSection
          title="Stake"
          current={stakeTokens}
          all={ALL_CRYPTO_STAKE_TOKENS}
          onClick={toggleStakeToken}
        />
      </Dialog>
    </>
  );
};

export const FilterCommunityPools = () => {
  const { recordEvent } = useFirebase();
  const [visible, setVisible] = useState(false);
  const {
    predictionTokens,
    stakeTokens,
    statuses,
    multipliers,
    togglePredictionToken,
    toggleStatus,
    toggleMultiplier
  } = useFilterCommunityPools();

  return (
    <>
      <button
        className="outline-none p-ripple py-2 px-6 rounded-full border border-border-default dark:border-surface-subtle flex w-fit items-center"
        onClick={() => setVisible(true)}
      >
        <Ripple />
        <span className="text-text-subtitle">Filters</span>
        <div className="relative">
          <FilterList className="ml-2 w-4 h-4 fill-text-subtitle" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-primary-default top-0.5 right-0"></div>
        </div>
      </button>

      <Dialog
        header="Filter Community Pools"
        visible={visible}
        onHide={() => {
          recordEvent('filtered_community_pools', {
            predictionTokens: JSON.stringify(predictionTokens),
            stakeTokens: JSON.stringify(stakeTokens),
            statuses: JSON.stringify(statuses),
            multipliers: JSON.stringify(multipliers)
          });
          if (!visible) return;
          setVisible(false);
        }}
        pt={{
          root: { className: 'mx-8' },
          header: { className: 'dark:bg-app-bg' },
          content: { className: 'dark:bg-app-bg' }
        }}
      >
        <FilterPoolsSection
          title="Pair"
          current={predictionTokens}
          all={ALL_COMMUNITY_PREDICTION_TOKENS}
          onClick={togglePredictionToken}
        />

        {/* <FilterPoolsSection
          title="Stake"
          current={stakeTokens}
          all={ALL_COMMUNITY_STAKE_TOKENS}
          onClick={toggleStakeToken}
        /> */}

        <FilterPoolsSection
          title="Multiplier"
          current={multipliers}
          all={ALL_COMMUNITY_MULTIPLIERS}
          onClick={toggleMultiplier}
        />

        <FilterPoolsSection title="Status" current={statuses} all={ALL_STATUSES} onClick={toggleStatus} />
      </Dialog>
    </>
  );
};
