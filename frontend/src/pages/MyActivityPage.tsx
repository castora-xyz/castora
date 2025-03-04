import Wallet from '@/assets/wallet.svg?react';
import {
  ActivityCard,
  ClaimAllButton,
  CountdownNumbers
} from '@/components/general';
import {
  Activity,
  rowsPerPageOptions,
  useMyActivity,
  usePaginators
} from '@/contexts';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import ms from 'ms';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Paginator } from 'primereact/paginator';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Breathing } from 'react-shimmer';
import { useAccount } from 'wagmi';

export const MyActivityPage = () => {
  const { isConnected } = useAccount();
  const location = useLocation();
  const {
    activityCount,
    fetchMyActivity,
    isFetching,
    myActivities,
    hasError,
    currentPage,
    updateCurrentPage
  } = useMyActivity();
  const paginators = usePaginators();
  const { open: connectWallet } = useWeb3Modal();
  const [unclaimedWins, setUnclaimedWins] = useState<Activity[]>([]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 512);
  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));
  const [openActivities, setOpenActivities] = useState(
    myActivities.filter(({ pool }) => now <= pool.seeds.snapshotTime)
  );
  const [otherActivities, setOtherActivities] = useState(
    myActivities.filter(({ pool }) => now > pool.seeds.snapshotTime)
  );
  const [grouped, setGrouped] = useState<{ [key: number]: Activity[] }>({});
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);

  const isPredictionsRoute = location.pathname.includes('predictions');

  useEffect(() => {
    if (otherActivities.length == 0) {
      setExpandedGroups([]);
      setGrouped({});
    } else {
      const group: { [key: number]: Activity[] } = {};
      for (const activity of otherActivities) {
        const { poolId } = activity.pool;
        if (!group[poolId]) group[poolId] = [activity];
        else group[poolId].push(activity);
      }
      setExpandedGroups(Array.from(Array(Object.keys(grouped).length)));
      setGrouped(group);
    }
  }, [otherActivities]);

  useEffect(() => {
    setUnclaimedWins(
      myActivities.filter(
        ({ prediction: { claimWinningsTime, isAWinner } }) =>
          claimWinningsTime === 0 && isAWinner
      )
    );
  }, [myActivities]);

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
      setOtherActivities(
        myActivities.filter(({ pool }) => now > pool.seeds.snapshotTime)
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
            onClick={() => fetchMyActivity()}
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
          <div className="md:basis-1/3 md:relative">
            <div className="md:sticky md:top-0 max-md:mb-16">
              <p className="text-sm py-2 px-5 mb-4 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle">
                Open Predictions
              </p>

              {openActivities.length === 0 ? (
                <div className="max-sm:flex max-sm:flex-col max-sm:justify-center max-sm:items-center max-sm:grow max-sm:text-center max-sm:py-12 sm:border-2 sm:border-surface-subtle sm:rounded-2xl sm:py-16 sm:px-16 md:px-4 lg:px-8 sm:gap-4 sm:text-center md:max-w-2xl ">
                  <p className="max-md:text-lg mb-8">
                    You have no predictions in currently Open Pools. Join a pool
                    by making a prediction.
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
                            <p className="border border-primary-darker dark:border-primary-default text-primary-darker dark:text-primary-default py-1 px-3 rounded-full text-xs hover:underline">
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
                            <CountdownNumbers timestamp={seeds.snapshotTime} />
                          </p>
                        )}

                        <Tooltip target=".prediction-time" />
                        <p
                          className="prediction-time text-text-caption cursor-context-menu"
                          data-pr-tooltip={`Prediction Time: ${
                            `${new Date(time * 1000)}`.split(' GMT')[0]
                          }`}
                        >
                          {ms((now - time) * 1000)} ago
                        </p>
                      </div>
                    )
                  )}

                  <div className="border-2 border-surface-subtle rounded-2xl py-16 max-xs:px-4 max-md:px-16 md:px-4 lg:px-8 gap-4 text-center">
                    <p className="max-md:text-lg mb-8">
                      You can make multiple predictions in the same pools.
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

          <div className="md:basis-2/3">
            <div className="flex gap-4 justify-between flex-wrap items-center mb-4">
              <p className="text-sm py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle">
                My Activity
              </p>

              <div className="flex gap-3 items-center w-fit">
                {unclaimedWins.length > 1 && (
                  <ClaimAllButton
                    pools={unclaimedWins.map(({ pool }) => pool)}
                    predictions={unclaimedWins.map(
                      ({ prediction }) => prediction
                    )}
                    onSuccess={fetchMyActivity}
                  />
                )}
              </div>
            </div>

            {activityCount && currentPage && (
              <Paginator
                first={paginators.rowsPerPage * currentPage}
                rows={paginators.rowsPerPage}
                rowsPerPageOptions={rowsPerPageOptions}
                totalRecords={activityCount}
                onPageChange={(e) => {
                  paginators.updateRowsPerPage(e.rows);
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

            <Accordion multiple activeIndex={[0, ...expandedGroups]}>
              {Object.entries(grouped).map(([poolId, activities]) => (
                <AccordionTab
                  header={
                    <span className="font-normal">{`Pool ID: ${poolId}`}</span>
                  }
                  pt={{
                    root: { className: 'bg-app-bg mb-4' },
                    header: { className: 'rounded-2xl' },
                    content: { className: 'bg-app-bg px-0' }
                  }}
                  key={poolId}
                >
                  {activities.map(({ pool, prediction }) => (
                    <ActivityCard
                      key={pool.poolId + ' ' + prediction.id}
                      pool={pool}
                      prediction={prediction}
                      refresh={fetchMyActivity}
                    />
                  ))}
                </AccordionTab>
              ))}
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
};
