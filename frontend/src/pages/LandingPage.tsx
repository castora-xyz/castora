import ConfettiBall from '@/assets/confetti-ball.svg?react';
import {
  LandingActivitySnippets,
  LandingClaimCard,
  LandingEmbeddedPage,
  LandingHeroPoolCard,
  LandingPredictionsSection,
  LandingWinCard,
  PoolCard,
  PoolCardShimmer
} from '@/components';
import { usePools } from '@/contexts';
import { Pool } from '@/schemas';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  const { liveCryptoPools } = usePools();

  const [activePool, setActivePool] = useState<Pool | null>(null);
  const [upcomingPool, setUpcomingPool] = useState<Pool | null>(null);

  useEffect(() => {
    if (liveCryptoPools.length > 0) {
      const activePools = liveCryptoPools.filter(
        ({ seeds }) => seeds.status() === 'Open'
      );
      const upcomingPools = liveCryptoPools.filter(
        ({ seeds }) => seeds.status() === 'Upcoming'
      );
      const sorter = (a: Pool, b: Pool) => {
        const bST = b.seeds.snapshotTime;
        const bWCT = b.seeds.windowCloseTime;
        const aST = a.seeds.snapshotTime;
        const aWCT = a.seeds.windowCloseTime;
        if (bWCT !== aWCT) return bWCT - aWCT;
        return bST - bWCT - (aST - aWCT);
      };
      if (activePools.length > 0) {
        setActivePool(activePools.sort(sorter)[0]);
      } else setActivePool(null);
      if (upcomingPools.length > 0) {
        setUpcomingPool(upcomingPools.sort(sorter)[0]);
      } else setUpcomingPool(null);
    } else {
      setActivePool(null);
      setUpcomingPool(null);
    }
  }, [liveCryptoPools]);

  useEffect(() => {
    document.title = 'Castora';
  }, []);

  return (
    <div className="flex flex-col justify-center grow bg-surface-subtle pt-20 md:py-32">
      {/* HERO SECTION */}
      <p className="px-8 text-center text-3xl xs:text-4xl md:text-5xl lg:text-6xl font-bold text-text-title mb-8 md:mb-12">
        Predict{' '}
        <span className="text-primary-darker dark:text-primary-default">
          Prices,{' '}
        </span>
        <span className="sm:hidden">
          <br />
        </span>
        Win
        <span className="text-primary-darker dark:text-primary-default">
          {' '}
          Prizes,{' '}
        </span>
        <br />
        Fun stuff like that...
      </p>

      <Link
        to="/pools"
        className="max-md:hidden mx-auto py-2 px-8 mb-20 rounded-full bg-primary-default border-2 border-primary-lighter font-medium md:text-xl lg:text-2xl text-white p-ripple"
      >
        Predict Now
        <Ripple />
      </Link>

      <div className="w-full px-4 flex flex-col gap-4 xs:px-6 xs:gap-6 max-md:max-w-lg md:max-w-4xl mx-auto md:flex-row mb-20">
        <div className="md:grow">
          <LandingHeroPoolCard pool={activePool} />
        </div>
        <div className="md:w-80 md:flex">
          <LandingWinCard />
        </div>
      </div>

      {/* DISCOVER POOLS SECTION */}
      <div className="bg-app-bg rounded-[48px] px-4 xs:px-6 py-16 mb-20 md:py-24 md:mb-32">
        <h2 className="font-bold text-3xl md:text-4xl lg:text-5xl mb-4 text-center">
          Discover Pools
        </h2>
        <p className="mb-12 max-md:max-w-lg md:max-w-[800px] mx-auto text-xl md:text-2xl text-center">
          Explore variety of pools in which to make predictions. Various pools
          have their Pool Pairs, Entry Fees, Pool Closing Times as well as
          Snapshot Times.
        </p>
        <div className="flex flex-col gap-8 lg:flex-row mx-auto max-w-screen-lg">
          <div className="max-[414px]:p-4 p-8 rounded-[32px] bg-surface-subtle border border-border-default dark:border-surface-disabled max-lg:max-w-lg max-lg:mx-auto lg:basis-1/2 w-full flex flex-col grow">
            <div className="border border-border-default dark:border-surface-subtle rounded-[24px] w-full bg-app-bg flex flex-col grow">
              {activePool ? (
                <PoolCard
                  pool={activePool ?? upcomingPool}
                  isInLandingPage={true}
                />
              ) : (
                <PoolCardShimmer />
              )}
            </div>
          </div>

          <div className="max-[414px]:p-4 p-8 rounded-[32px] bg-surface-subtle border border-border-default dark:border-surface-disabled max-lg:max-w-lg max-lg:mx-auto lg:basis-1/2 w-full">
            <LandingEmbeddedPage pool={activePool} />
          </div>
        </div>
      </div>

      {/* ENTER PREDICTIONS SECTION */}
      <LandingPredictionsSection pool={activePool} />

      {/* WIN AND CLAIM REWARDS SECTION */}
      <div className="bg-app-bg rounded-[48px] px-4 xs:px-6 py-16 mb-20 md:py-24 md:mb-32 text-center">
        <h2 className="font-bold text-3xl md:text-4xl lg:text-5xl mb-4">
          Win and Claim Rewards
        </h2>
        <p className="mb-12 max-md:max-w-lg md:max-w-[800px] mx-auto text-xl md:text-2xl">
          You are a winner if your prediction is closest to the price at the
          snapshot time. You share entire pools' stake with other winners.
        </p>
        <div className="py-12 md:pt-20 lg:pt-32 px-4 sm:px-12 rounded-[32px] bg-surface-subtle max-md:max-w-lg md:max-w-screen-lg mx-auto border border-border-default dark:border-surface-disabled relative">
          <div className="md:flex md:max-w-screen-md md:mx-auto gap-4">
            <ConfettiBall className="w-100px h-100px mx-auto mb-4 md:absolute md:left-[50%] md:-translate-x-12 md:top-8 lg:top-20" />
            <LandingWinCard />
            <div className="md:hidden mb-6 sm:mb-8"> </div>
            <LandingClaimCard />
          </div>
        </div>
      </div>

      {/* MANAGE PREDICTIONS SECTION */}
      <div className="bg-app-bg rounded-[48px] px-4 xs:px-6 py-16 mb-20 md:py-24 md:mb-32">
        <h2 className="font-bold text-3xl md:text-4xl lg:text-5xl mb-4 text-center">
          Manage your Predictions
        </h2>
        <p className="mb-12 max-md:max-w-lg md:max-w-[800px] mx-auto text-xl md:text-2xl text-center">
          Easily track the status of your all your predictions from your
          activity panel.
        </p>
        <div className="pt-8 md:pt-20 px-4 sm:px-12 rounded-[32px] bg-surface-subtle max-md:max-w-lg md:max-w-screen-lg mx-auto border border-border-default dark:border-surface-disabled lg:flex">
          <h3 className="font-bold text-surface-default text-4xl max-md:mb-12 max-sm:pl-4 md:text-6xl md:mb-20">
            Castora
          </h3>
          <LandingActivitySnippets />
        </div>
      </div>

      {/* PURPLE CLOSING SECTION */}
      <div className="bg-primary-default text-white pt-20 pb-32 lg:pb-40 px-4 xs:px-8 md:rounded-[36px] lg:rounded-[72px] md:mx-8 lg:mx-20 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl mb-6">
          Start <span className="font-bold">Predicting, </span>
          <span className="sm:hidden">
            <br />
          </span>
          Start <span className="font-bold">Winning.</span>
        </h2>

        <p className="text-2xl lg:text-3xl max-lg:max-w-lg lg:max-w-3xl mx-auto mb-12 lg:mb-20">
          Explore pools, enter your predictions, and get your share of rewards
          up for grabs.
        </p>

        <Link
          to="/pools"
          className="border-2 border-primary-lighter bg-white py-2 lg:py-3 px-6 lg:px-8 text-xl lg:text-2xl font-medium text-primary-darker rounded-full p-ripple"
        >
          Live Pools
          <Ripple />
        </Link>
      </div>
    </div>
  );
};
