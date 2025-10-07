import { ActivityCreateCard, ClaimAllCreateButton, createdPoolsActivityType, MyActivityPageIntro } from '@/components';
import { rowsPerPageOptions, useMyCreateActivity } from '@/contexts';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Paginator } from 'primereact/paginator';
import { Ripple } from 'primereact/ripple';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Breathing } from 'react-shimmer';
import { useAccount } from 'wagmi';

export const MyActivityCreatedPoolsPage = () => {
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
    updateCurrentPage,
    updateUnclaimed
  } = useMyCreateActivity();
  const { open: connectWallet } = useWeb3Modal();

  useEffect(() => {
    document.title = 'My Created Pools | Castora';
  }, []);

  return (
    <div className="w-full max-md:max-w-[600px] max-w-screen-xl mx-auto flex flex-col grow">
      <MyActivityPageIntro myActivityType={createdPoolsActivityType} claimAll={<ClaimAllCreateButton />} />

      {!isConnected ? (
        <div className="max-sm:flex max-sm:flex-col max-sm:justify-center max-sm:items-center max-sm:grow max-sm:text-center max-sm:py-12 sm:border sm:border-border-default sm:dark:border-surface-subtle sm:rounded-2xl sm:py-16 sm:px-16 md:px-4 lg:px-8 sm:gap-4 sm:text-center md:max-w-[600px]">
          <p className="text-lg mb-8">
            Here, you will find all the pools you have created. Kindly sign in to continue.
          </p>
          <button
            className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple flex justify-center items-center"
            onClick={() => connectWallet()}
          >
            <span>Connect Wallet</span>
            <Ripple />
          </button>
        </div>
      ) : myActivities.length === 0 && !isFetching && !hasError ? (
        <div className="flex flex-col items-center justify-center grow text-center py-16">
          <h2 className="text-2xl font-bold mb-4">My Created Pools</h2>
          <p className="text-lg mb-8 max-w-md">
            Pools that you have created will appear here. Create your first community pool to get started!
          </p>
          <Link
            to="/pools/community/create"
            className="mx-auto py-2 px-8 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
          >
            Create Community Pool
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
                onClick={() => {
                  fetchMyActivity();
                  updateUnclaimed();
                }}
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
                : myActivities.map(({ pool, userCreated }, i, total) => (
                    <ActivityCreateCard
                      count={currentPage! * rowsPerPage + total.length - i}
                      key={pool.poolId}
                      pool={pool}
                      userCreated={userCreated}
                    />
                  ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
