import Wallet from '@/assets/wallet.svg?react';
import { ActivityCard, ClaimAllButton, MyActivityPageIntro, predictionsActivityType } from '@/components/general';
import { Activity, rowsPerPageOptions, useMyActivity } from '@/contexts';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Paginator } from 'primereact/paginator';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Breathing } from 'react-shimmer';
import { useAccount } from 'wagmi';

export const MyActivityPredictionsPage = () => {
  const { isConnected } = useAccount();
  const {
    activityCount,
    fetchMyActivity,
    isFetching,
    myActivities,
    hasError,
    currentPage,
    rowsPerPage,
    setRowsPerPage,
    updateCurrentPage
  } = useMyActivity();
  const { open: connectWallet } = useWeb3Modal();
  const [unclaimedWins, setUnclaimedWins] = useState<Activity[]>([]);
  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));

  useEffect(() => {
    setUnclaimedWins(
      myActivities.filter(({ prediction: { claimWinningsTime, isAWinner } }) => claimWinningsTime === 0 && isAWinner)
    );
  }, [myActivities]);

  useEffect(() => {
    document.title = `My Predictions - Castora`;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.trunc(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [now]);

  return (
    <div className="w-full max-md:max-w-[584px] max-w-screen-xl mx-auto flex flex-col grow">
      <MyActivityPageIntro
        myActivityType={predictionsActivityType}
        claimAll={
          unclaimedWins.length > 1 ? (
            <div className="w-fit ml-auto">
              <ClaimAllButton
                pools={unclaimedWins.map(({ pool }) => pool)}
                predictions={unclaimedWins.map(({ prediction }) => prediction)}
                onSuccess={fetchMyActivity}
              />
            </div>
          ) : undefined
        }
      />

      {!isConnected ? (
        <div className="max-sm:flex max-sm:flex-col max-sm:justify-center max-sm:items-center max-sm:grow max-sm:text-center max-sm:py-12 sm:border sm:border-border-default sm:dark:border-surface-subtle sm:rounded-2xl sm:py-16 sm:px-16 md:px-4 lg:px-8 sm:gap-4 sm:text-center md:max-w-[600px]">
          <p className="text-lg mb-8">Here, you will find all your predictions. Kindly sign in to continue.</p>
          <button
            className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple flex justify-center items-center"
            onClick={() => connectWallet()}
          >
            <Wallet className="mr-2 w-5 h-5 stroke-white" />
            <span>Connect Wallet</span>
            <Ripple />
          </button>
        </div>
      ) : myActivities.length === 0 && !isFetching && !hasError ? (
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
        <div className="w-full">
          {activityCount && currentPage !== null && (
            <Paginator
              first={rowsPerPage * currentPage}
              rows={rowsPerPage}
              rowsPerPageOptions={rowsPerPageOptions}
              totalRecords={activityCount}
              onPageChange={(e) => {
                setRowsPerPage(e.rows);
                updateCurrentPage(e.page);
                fetchMyActivity(e.page, e.rows);
              }}
              template="FirstPageLink PrevPageLink JumpToPageDropdown CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
              currentPageReportTemplate="{first} to {last} of {totalRecords}"
              className="rounded-2xl bg-surface-subtle mb-6"
              pt={{
                RPPDropdown: {
                  root: { className: 'bg-app-bg' },
                  panel: { className: 'bg-app-bg' }
                }
              }}
            />
          )}

          {hasError ? (
            <div className="flex flex-col items-center justify-center grow text-center py-16">
              <h1 className="text-2xl font-bold mb-4">Error Occured</h1>
              <p className="text-lg mb-8">Something went wrong</p>
              <button
                className="mx-auto py-2 px-16 rounded-full font-medium border border-border-default dark:border-surface-subtle text-text-subtitle p-ripple"
                onClick={() => fetchMyActivity()}
              >
                Try Again
                <Ripple />
              </button>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-6">
              {isFetching
                ? [1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <Breathing key={i} height={128} className="mb-5 rounded-2xl w-full" />
                  ))
                : myActivities.map(({ pool, prediction }) => (
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
};
