import ChevronDown from '@/assets/chevron-down.svg?react';
import Wallet from '@/assets/wallet.svg?react';
import { PoolCard, PoolCardShimmer } from '@/components';
import { useFirebase, useMyActivity, usePools } from '@/contexts';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export const LivePoolsPage = () => {
  const { isConnected } = useAccount();
  const { recordEvent } = useFirebase();
  const { isFetching: isFetchingPools, livePools } = usePools();
  const { open: connectWallet } = useWeb3Modal();

  const [categories, setCategories] = useState(['All', 'Staked']);
  const { isFetching: isFetchingMyActivity, myActivities } = useMyActivity();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const getShimmerCount = () => {
    if (windowWidth < 768) return 3;
    else if (windowWidth < 1024) return 5;
    else if (windowWidth < 1280) return 8;
    else return 10;
  };
  const [shimmerCount, setShimmerCount] = useState(getShimmerCount());

  const checkCategories = () => {
    const refreshed = new Set(['All', 'Staked']);
    for (const pool of livePools) refreshed.add(pool.seeds.status());
    // the following is to ensure that the categories are displayed in the
    // desired order
    const ordered = [
      'All',
      'Open',
      'Staked',
      'Closed',
      'Completed',
      'Upcoming'
    ];
    setCategories(ordered.filter((member) => refreshed.has(member)));
  };

  useEffect(() => {
    checkCategories();
  }, [livePools, isConnected, myActivities]);

  useEffect(() => {
    setShimmerCount(getShimmerCount());
  }, [windowWidth]);

  useEffect(() => {
    document.title = 'Castora';
    window.addEventListener('resize', () => setWindowWidth(window.innerWidth));
  }, []);

  return (
    <>
      <div className="w-full max-md:max-w-md max-w-screen-xl mx-auto">
        <div className="text-sm mb-4 flex w-fit gap-4 text-text-subtitle">
          <p className="py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle">
            <span>Pools</span>
          </p>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="md:hidden outline-none p-ripple py-2 px-6 rounded-full border border-border-default dark:border-surface-subtle flex w-fit items-center">
                <Ripple />
                <span className="text-text-subtitle">{selectedCategory}</span>
                <ChevronDown className="ml-2 w-4 h-4 fill-text-subtitle" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="p-3 border border-border-default dark:border-surface-subtle outline-none mr-4 rounded-md z-20 bg-app-bg cursor-pointer"
                sideOffset={16}
              >
                {categories.map((category) => (
                  <DropdownMenu.Item
                    key={category}
                    onSelect={() => {
                      setSelectedCategory(category);
                      recordEvent('selected_pools_category', category);
                    }}
                    title={category}
                    className="outline-none p-ripple text-text-subtitle font-lg"
                  >
                    <Ripple />
                    <div className="m-2 rounded-md">{category}</div>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        <div className="max-md:hidden py-2 px-3 bg-surface-subtle rounded-full w-fit mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                recordEvent('selected_pools_category', category);
              }}
              className={
                'py-2 px-6 rounded-full p-ripple' +
                (selectedCategory === category
                  ? ' bg-app-bg text-text-title'
                  : ' text-text-subtitle')
              }
            >
              {category}
              <Ripple />
            </button>
          ))}
        </div>
      </div>

      {selectedCategory === 'Staked' &&
      !isFetchingMyActivity &&
      !myActivities.some(({ pool: { poolId: myPoolId } }) =>
        livePools.some(({ poolId }) => poolId === myPoolId)
      ) ? (
        <div className="max-md:flex max-md:flex-col max-md:justify-center max-md:items-center max-md:grow max-md:text-center max-md:py-12  w-full max-w-screen-xl mx-auto">
          <div className="md:border md:border-border-default md:dark:border-surface-subtle md:rounded-2xl md:py-16 md:px-20 md:gap-4 md:max-w-2xl md:text-center">
            <p className="text-lg xs:text-xl mb-8 max-md:max-w-sm">
              {isConnected
                ? 'You have no predictions in currently Open Pools. Join a pool by making a prediction.'
                : 'Here, you will find the open pools you have made predictions in. Kindly sign in to continue.'}
            </p>
            {isConnected ? (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  recordEvent('selected_pools_category', 'All');
                }}
                className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
              >
                Predict Now
                <Ripple />
              </button>
            ) : (
              <button
                className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple flex justify-center items-center"
                onClick={() => connectWallet()}
              >
                <Wallet className="mr-2 w-5 h-5 stroke-white" />
                <span>Connect Wallet</span>
                <Ripple />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-screen-xl mx-auto">
          {isFetchingPools ||
          (selectedCategory === 'Staked' && isFetchingMyActivity)
            ? Array.from(Array(shimmerCount).keys()).map((i) => (
                <PoolCardShimmer key={i} />
              ))
            : livePools
                .filter(({ poolId, seeds }) => {
                  if (selectedCategory === 'All') return true;
                  if (selectedCategory === 'Staked') {
                    return (
                      isConnected &&
                      myActivities.some(
                        ({ pool: { poolId: myPoolId } }) => myPoolId === poolId
                      )
                    );
                  }
                  return seeds.status() === selectedCategory;
                })
                .map((pool) => <PoolCard key={pool.seedsHash} pool={pool} />)}
        </div>
      )}
    </>
  );
}
