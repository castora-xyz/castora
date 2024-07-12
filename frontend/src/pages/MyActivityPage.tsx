import Wallet from '@/assets/wallet.svg?react';
import { ActivityCard, CountdownNumbers } from '@/components/general';
import { useMyActivity } from '@/contexts';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import ms from 'ms';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Breathing } from 'react-shimmer';
import { useAccount } from 'wagmi';

export const MyActivityPage = () => {
  const { isConnected } = useAccount();
  const location = useLocation();
  const { fetchMyActivity, isFetching, myActivities, hasError } =
    useMyActivity();
  const { open: connectWallet } = useWeb3Modal();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 512);
  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));
  const [openActivities, setOpenActivities] = useState(
    myActivities.filter(({ pool }) => now <= pool.seeds.snapshotTime)
  );

  const isPredictionsRoute = location.pathname.includes('predictions');

  useEffect(() => {
    document.title = `My ${
      isMobile && isPredictionsRoute ? 'Predictions' : 'Activity'
    } - Castora`;
  }, [isMobile, isPredictionsRoute]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.trunc(Date.now() / 1000));
      setOpenActivities(
        myActivities.filter(({ pool }) => now <= pool.seeds.snapshotTime)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [now]);

  useEffect(() => {
    const resizer = () => setIsMobile(window.innerWidth < 512);
    window.addEventListener('resize', resizer);
    return () => window.removeEventListener('resize', resizer);
  }, []);

  return (
    <div className="w-full max-md:max-w-[600px] max-w-screen-xl mx-auto flex flex-col grow">
      {(!isConnected ||
        isFetching ||
        hasError ||
        myActivities.length === 0) && (
        <p className="text-sm py-2 px-5 mb-4 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle">
          <span>
            {isMobile && isPredictionsRoute
              ? 'Open Predictions'
              : 'My Activity'}
          </span>
        </p>
      )}

      {!isConnected ? (
        <div className="max-sm:flex max-sm:flex-col max-sm:justify-center max-sm:items-center max-sm:grow max-sm:text-center max-sm:py-12 sm:border sm:border-border-default sm:dark:border-surface-subtle sm:rounded-2xl sm:py-16 sm:px-16 md:px-4 lg:px-8 sm:gap-4 sm:text-center md:max-w-[600px]">
          <p className="text-lg mb-8">
            Here, you will find all your
            {isPredictionsRoute && isMobile
              ? ' open predictions'
              : ' pools and predictions'}
            . Kindly sign in to continue.
          </p>
          <button
            className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple flex justify-center items-center"
            onClick={() => connectWallet()}
          >
            <Wallet className="mr-2 w-5 h-5 stroke-white" />
            <span>Connect Wallet</span>
            <Ripple />
          </button>
        </div>
      ) : isFetching ? (
        [1, 2, 3, 4, 5].map((i) => (
          <Breathing
            key={i}
            height={128}
            className="mb-5 rounded-2xl w-full md:max-w-[600px]"
          />
        ))
      ) : hasError ? (
        <div className="flex flex-col items-center justify-center grow text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Error Occured</h1>
          <p className="text-lg mb-8">Something went wrong</p>
          <button
            className="mx-auto py-2 px-16 rounded-full font-medium border border-border-default dark:border-surface-subtle text-text-subtitle p-ripple"
            onClick={fetchMyActivity}
          >
            Try Again
            <Ripple />
          </button>
        </div>
      ) : myActivities.length === 0 ? (
        <div className="max-sm:flex max-sm:flex-col max-sm:justify-center max-sm:items-center max-sm:grow max-sm:text-center max-sm:py-12 sm:border sm:border-border-default sm:dark:border-surface-subtle sm:rounded-2xl sm:py-16 sm:px-16 md:px-4 lg:px-8 sm:gap-4 sm:text-center md:max-w-[600px]">
          <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
          <p className="text-lg mb-8">
            Predict Prizes. Win Prizes.
            <br />
            Join Pools by Making Predictions.
          </p>
          <Link
            to="/pools"
            className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
          >
            Predict Now
            <Ripple />
          </Link>
        </div>
      ) : (
        <div className="md:flex md:flex-row-reverse md:gap-8">
          {(!isMobile || (isMobile && isPredictionsRoute)) && (
            <div className="md:basis-1/3 md:relative">
              <div className="md:sticky md:top-0 max-md:mb-16">
                <p className="text-sm py-2 px-5 mb-4 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle">
                  Open Predictions
                </p>

                {openActivities.length === 0 ? (
                  <div className="max-sm:flex max-sm:flex-col max-sm:justify-center max-sm:items-center max-sm:grow max-sm:text-center max-sm:py-12 sm:border-2 sm:border-surface-subtle sm:rounded-2xl sm:py-16 sm:px-16 md:px-4 lg:px-8 sm:gap-4 sm:text-center md:max-w-2xl ">
                    <p className="max-md:text-lg mb-8">
                      You have no predictions in currently Open Pools. Join a
                      pool by making a prediction.
                    </p>
                    <Link
                      to="/pools"
                      className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
                    >
                      Predict Now
                      <Ripple />
                    </Link>
                  </div>
                ) : (
                  <>
                    {openActivities.map(
                      ({
                        pool: { poolId, seeds },
                        prediction: {
                          id: predictionId,
                          price: predictionPrice,
                          time
                        }
                      }) => (
                        <div
                          key={`${poolId} ${predictionId}`}
                          className="rounded-2xl border-2 border-surface-subtle p-4 flex justify-between items-center flex-wrap gap-4 mb-4"
                        >
                          <p>
                            {seeds.predictionTokenDetails.name} @{' '}
                            {predictionPrice}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={`/pool/${poolId}`}
                              className="p-ripple rounded-full"
                            >
                              <p className="text-text-caption border border-border-default dark:border-surface-subtle py-1 px-3 rounded-full text-xs hover:underline">
                                Pool ID: {poolId}
                              </p>
                              <Ripple />
                            </Link>

                            <p className="text-text-caption border border-border-default dark:border-surface-subtle py-1 px-3 rounded-full text-xs">
                              Prediction ID: {predictionId}
                            </p>
                          </div>

                          {seeds.snapshotTime > now && (
                            <p className="text-primary-darker bg-primary-subtle py-1 px-4 rounded-full text-sm w-fit">
                              <CountdownNumbers
                                timestamp={seeds.snapshotTime}
                              />
                            </p>
                          )}

                          <p className="text-text-caption">
                            {ms((now - time) * 1000)} ago
                          </p>
                        </div>
                      )
                    )}

                    <div className="border-2 border-surface-subtle rounded-2xl py-16 max-xs:px-4 max-md:px-16 md:px-4 lg:px-8 gap-4 text-center">
                      <p className="max-md:text-lg mb-8">
                        That's all for now. You can make multiple predictions in
                        the same pools.
                      </p>
                      <Link
                        to="/pools"
                        className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
                      >
                        Predict Now
                        <Ripple />
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {(!isMobile || (isMobile && !isPredictionsRoute)) && (
            <div className="md:basis-2/3">
              <p className="text-sm py-2 px-5 mb-4 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle">
                My Activity
              </p>

              {myActivities.map(({ pool, prediction }) => (
                <ActivityCard
                  key={pool.poolId + ' ' + prediction.id}
                  pool={pool}
                  prediction={prediction}
                  refresh={fetchMyActivity}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
