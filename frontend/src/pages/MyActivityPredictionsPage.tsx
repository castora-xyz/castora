import MoodSadFilled from '@/assets/mood-sad-filled.svg?react';
import RectangleStack from '@/assets/rectangle-stack.svg?react';
import Squares2x2 from '@/assets/squares-2x2.svg?react';
import Timer from '@/assets/timer.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import Wallet from '@/assets/wallet.svg?react';
import { ActivityPredictCard, ClaimPredictButton, ClaimAllPredictButton, CountdownNumbers, MyActivityPageIntro, predictionsActivityType } from '@/components/general';
import { rowsPerPageOptions, useCurrentTime, useMyPredictActivity } from '@/contexts';
import { ActivityPredict } from '@/contexts/MyPredictActivityContext';
import { useViewPreference } from '@/hooks/useViewPreference';
import { useAppKit } from '@reown/appkit/react';
import { ColumnDef, createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Paginator } from 'primereact/paginator';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Breathing } from 'react-shimmer';
import ms from 'ms';
import { useConnection } from 'wagmi';

type PredictionTableRow = ActivityPredict & {
  count: number;
};

const columnHelper = createColumnHelper<PredictionTableRow>();

export const MyActivityPredictionsPage = () => {
  const { isConnected } = useConnection();
  const location = useLocation();
  const { now } = useCurrentTime();
  const [view, setView] = useViewPreference('myPredictionsView', 'grid');
  const {
    activityCount,
    fetchMyActivity,
    isFetching,
    myActivities,
    claimableActivities,
    hasError,
    currentPage,
    rowsPerPage,
    setRowsPerPage,
    updateCurrentPage
  } = useMyPredictActivity();
  const { open: connectWallet } = useAppKit();

  useEffect(() => {
    document.title = `My Predictions - Castora`;
  }, []);

  // Transform activities to include count
  const tableData = useMemo(() => {
    if (!myActivities.length || currentPage === null) return [];
    return myActivities.map((activity, i, total) => ({
      ...activity,
      count: currentPage * rowsPerPage + total.length - i
    }));
  }, [myActivities, currentPage, rowsPerPage]);

  const columns = useMemo(
    () =>
      [
      columnHelper.accessor('count', {
        header: '#',
        cell: (info) => <span className="text-text-caption text-sm">#{info.getValue()}</span>,
        size: 60
      }),
      columnHelper.accessor((row) => row.pool.seeds, {
        id: 'pair',
        header: 'Pair',
        cell: (info) => {
          const seeds = info.getValue();
          return (
            <div className="flex items-center gap-2">
              {seeds.predictionTokenDetails.img && (
                <img
                  src={`/assets/${seeds.predictionTokenDetails.img}.png`}
                  className="w-5 h-5 rounded-full"
                  alt=""
                />
              )}
              <span className="text-sm">{seeds.pairName()}</span>
            </div>
          );
        },
        size: 150
      }),
      columnHelper.accessor((row) => row.pool.seeds, {
        id: 'stake',
        header: 'Stake',
        cell: (info) => <span className="text-sm">{info.getValue().displayStake()}</span>,
        size: 120
      }),
      columnHelper.accessor((row) => row.pool.seeds, {
        id: 'poolLife',
        header: 'Pool Life',
        cell: (info) => {
          const seeds = info.getValue();
          return (
            <div className="flex items-center gap-1 text-sm">
              <Timer className="fill-text-caption w-4 h-4" />
              <span>{seeds.displayPoolLife()}</span>
            </div>
          );
        },
        size: 120
      }),
      columnHelper.accessor((row) => row.pool.poolId, {
        id: 'poolId',
        header: 'Pool ID',
        cell: (info) => {
          const poolId = info.getValue();
          return (
            <Link to={`/pool/${poolId}`} className="p-ripple rounded-full" state={{ from: location }}>
              <span className="border border-primary-darker dark:border-primary-default text-primary-darker dark:text-primary-default py-1 px-3 rounded-full text-xs hover:underline">
                {poolId}
              </span>
              <Ripple />
            </Link>
          );
        },
        size: 100
      }),
      columnHelper.accessor((row) => row.prediction.id, {
        id: 'predictionId',
        header: 'Prediction ID',
        cell: (info) => (
          <span className="text-text-caption border border-border-default dark:border-surface-subtle py-1 px-3 rounded-full text-xs">
            {info.getValue()}
          </span>
        ),
        size: 120
      }),
      columnHelper.accessor((row) => ({ pool: row.pool, prediction: row.prediction }), {
        id: 'status',
        header: 'Status',
        cell: (info) => {
          const { pool, prediction } = info.getValue();
          const { seeds, snapshotPrice, completionTime } = pool;
          const { price: predictionPrice } = prediction;

          return (
            <div className="flex flex-wrap gap-2">
              {!completionTime ? (
                <>
                  <span className="text-primary-darker bg-primary-subtle py-1 px-3 rounded-full text-xs">
                    Awaiting Snapshot
                  </span>
                  {now <= seeds.snapshotTime && (
                    <span className="text-primary-darker bg-primary-subtle py-1 px-3 rounded-full text-xs">
                      <CountdownNumbers timestamp={seeds.snapshotTime} />
                    </span>
                  )}
                  <span className="text-primary-darker bg-primary-subtle py-1 px-3 rounded-full text-xs">
                    ${predictionPrice}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-primary-darker bg-primary-subtle py-1 px-3 rounded-full text-xs">
                    Snapshot: ${snapshotPrice}
                  </span>
                  <span
                    className={`py-1 px-3 rounded-full text-xs ${
                      prediction.isAWinner
                        ? 'text-success-darker bg-success-subtle'
                        : 'text-errors-darker bg-errors-subtle'
                    }`}
                  >
                    Mine: ${predictionPrice}
                  </span>
                </>
              )}
            </div>
          );
        },
        size: 250
      }),
      columnHelper.accessor((row) => ({ pool: row.pool, prediction: row.prediction }), {
        id: 'result',
        header: 'Result',
        cell: (info) => {
          const { pool, prediction } = info.getValue();
          const { seeds, completionTime, winAmount } = pool;
          const { isAWinner } = prediction;

          return (
            <div className="flex items-center gap-2">
              {!!completionTime && !isAWinner && (
                <span className="text-text-disabled font-medium flex items-center bg-surface-subtle py-1 px-3 rounded-full text-xs">
                  <MoodSadFilled className="fill-text-disabled w-4 h-4 mr-1" />
                  Unlucky
                </span>
              )}
              {!!completionTime && isAWinner && !!winAmount && (
                <span className="text-white font-medium flex items-center bg-success-default py-1 px-3 rounded-full text-xs">
                  <Trophy className="fill-white w-4 h-4 mr-1" />
                  Won {winAmount} {seeds.stakeTokenDetails.name}
                </span>
              )}
              {!!completionTime && isAWinner && (
                <ClaimPredictButton pool={pool} prediction={prediction} />
              )}
            </div>
          );
        },
        size: 200
      }),
      columnHelper.accessor((row) => ({ pool: row.pool, prediction: row.prediction }), {
        id: 'time',
        header: 'Time',
        cell: (info) => {
          const { pool, prediction } = info.getValue();
          const { poolId } = pool;
          const { id: predictionId, time } = prediction;

          return (
            <span
              className={`activity-time-${poolId}-${predictionId} activity-time text-text-caption text-sm cursor-context-menu`}
              data-pr-tooltip={`${new Date(time * 1000)}`.split(' GMT')[0]}
            >
              {ms((now - time) * 1000)}
            </span>
          );
        },
        size: 120
      })
      ] as ColumnDef<PredictionTableRow>[],
    [location, now]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="w-full max-md:max-w-[584px] max-w-(--breakpoint-xl) mx-auto flex flex-col grow">
      <MyActivityPageIntro
        myActivityType={predictionsActivityType}
        claimAll={
          claimableActivities.length > 0 ? (
            <div className="w-fit ml-auto">
              <ClaimAllPredictButton
                pools={claimableActivities.map(({ pool }) => pool)}
                predictions={claimableActivities.map(({ prediction }) => prediction)}
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
            <>
              <div className="flex justify-end mb-4 gap-2">
                <Tooltip target=".view-toggle-grid" />
                <button
                  className={`view-toggle-grid px-3 py-2 rounded-full border p-ripple ${
                    view === 'grid'
                      ? 'bg-primary-default border-primary-default'
                      : 'border-border-default dark:border-surface-subtle hover:bg-surface-subtle'
                  }`}
                  data-pr-tooltip="Grid View"
                  onClick={() => setView('grid')}
                  aria-label="Grid View"
                >
                  <Squares2x2
                    className={`w-5 h-5 ${
                      view === 'grid'
                        ? 'fill-white'
                        : 'fill-text-subtitle'
                    }`}
                  />
                  <Ripple />
                </button>
                <Tooltip target=".view-toggle-table" />
                <button
                  className={`view-toggle-table px-3 py-2 rounded-full border p-ripple ${
                    view === 'table'
                      ? 'bg-primary-default border-primary-default'
                      : 'border-border-default dark:border-surface-subtle hover:bg-surface-subtle'
                  }`}
                  data-pr-tooltip="Table View"
                  onClick={() => setView('table')}
                  aria-label="Table View"
                >
                  <RectangleStack
                    className={`w-5 h-5 ${
                      view === 'table'
                        ? 'fill-white'
                        : 'fill-text-subtitle'
                    }`}
                  />
                  <Ripple />
                </button>
              </div>

              {view === 'grid' ? (
                <>
                  <div className="lg:grid lg:grid-cols-2 lg:gap-x-6">
                    {isFetching
                      ? [1, 2, 3, 4, 5, 6, 7].map((i) => (
                          <Breathing key={i} height={128} className="mb-5 rounded-2xl w-full" />
                        ))
                      : myActivities.map(({ pool, prediction }, i, total) => (
                          <ActivityPredictCard
                            count={currentPage! * rowsPerPage + total.length - i}
                            key={pool.poolId + ' ' + prediction.id}
                            pool={pool}
                            prediction={prediction}
                          />
                        ))}
                  </div>

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
                      className="rounded-2xl bg-surface-subtle mb-6 mt-6"
                      pt={{
                        RPPDropdown: {
                          root: { className: 'bg-app-bg' },
                          panel: { className: 'bg-app-bg' }
                        }
                      }}
                    />
                  )}
                </>
              ) : (
                <>
                  <Tooltip target=".activity-time" />
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <tr key={headerGroup.id} className="border-b-2 border-surface-subtle">
                            {headerGroup.headers.map((header) => (
                              <th
                                key={header.id}
                                className="text-left py-4 px-4 text-sm font-medium text-text-caption"
                                style={{
                                  minWidth: header.getSize(),
                                  width: header.getSize()
                                }}
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody>
                        {isFetching ? (
                          <tr>
                            <td colSpan={columns.length} className="py-8">
                              <div className="flex flex-col gap-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <Breathing key={i} height={60} className="rounded-2xl w-full" />
                                ))}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          table.getRowModel().rows.map((row) => (
                            <tr
                              key={row.id}
                              className="border-b border-surface-subtle hover:bg-surface-subtle/50 transition-colors"
                            >
                              {row.getVisibleCells().map((cell) => (
                                <td
                                  key={cell.id}
                                  className="py-4 px-4"
                                  style={{
                                    minWidth: cell.column.getSize(),
                                    width: cell.column.getSize()
                                  }}
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

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
                      className="rounded-2xl bg-surface-subtle mb-6 mt-6"
                      pt={{
                        RPPDropdown: {
                          root: { className: 'bg-app-bg' },
                          panel: { className: 'bg-app-bg' }
                        }
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
