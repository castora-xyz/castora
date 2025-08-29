import ExternalLink from '@/assets/external-link.svg?react';
import MoodSadFilled from '@/assets/mood-sad-filled.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import { ClaimAllButton, ClaimButton } from '@/components';
import { useContract, useMyActivity, usePredictions } from '@/contexts';
import { Pool, Prediction } from '@/schemas';
import ms from 'ms';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Paginator } from 'primereact/paginator';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Breathing } from 'react-shimmer';
import { useAccount } from 'wagmi';

export interface MyInPoolPredsRef {
  onPredict: (showLoading?: boolean) => Promise<void>;
}

interface MyInPoolPredsProps {
  pool: Pool;
}

export const MyInPoolPredictions = forwardRef<MyInPoolPredsRef, MyInPoolPredsProps>(
  ({ pool, pool: { seeds, completionTime } }, ref) => {
    const { isConnected, address, chain: currentChain } = useAccount();
    const { readContract } = useContract();
    const { fetchMyActivity } = useMyActivity();
    const retrieve = usePredictions();
    const [ids, setIds] = useState<bigint[] | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isFetchingIds, setIsFetchingIds] = useState(true);
    const [isFetchingPreds, setIsFetchingPreds] = useState(true);
    const [myPredictions, setMyPredictions] = useState<Prediction[] | null>([]);
    const [currentPage, setCurrentPage] = useState<number | null>(null);
    const [unclaimedWins, setUnclaimedWins] = useState<Prediction[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    useImperativeHandle(ref, () => ({ onPredict: fetchMyPredictionIds }));

    const getLastPage = (total: number) => {
      const last = Math.ceil(total / rowsPerPage);
      return last == 0 ? 0 : last - 1;
    };

    const fetchMyPredictionIds = async (showLoading = true) => {
      if (!address) {
        setIsFetchingIds(false);
        setIds([]);
        return;
      }

      setIsFetchingIds(showLoading);

      const fetched = (await readContract('getPredictionIdsForAddress', [BigInt(pool.poolId), address!])) as
        | bigint[]
        | null;

      // if silently fetching, don't update on error
      if (!showLoading && !fetched) {
        setIsFetchingIds(false);
        return;
      }

      // Use callback to access current state value to avoid stale closure
      setIds((currentIds) => {
        // Deep comparison for arrays of bigints
        const arraysEqual = (a: bigint[] | null, b: bigint[] | null): boolean => {
          if (a === null && b === null) return true;
          if (a === null || b === null) return false;
          if (a.length !== b.length) return false;
          return a.every((val, index) => val === b[index]);
        };

        setIsFetchingIds(false);

        // Only update if the arrays are actually different
        return arraysEqual(currentIds, fetched) ? currentIds : fetched;
      });
    };

    const fetchMyPredictions = async (page = currentPage, rows = rowsPerPage) => {
      if (isFetchingIds || !ids || ids.length == 0) {
        setMyPredictions([]);
        setIsFetchingPreds(false);
        return;
      }

      setIsFetchingPreds(true);
      if (page === null) page = getLastPage(ids.length);
      let start = (page + 1) * rows;
      if (start >= ids.length) start = ids.length;
      const target = page * rows + 1;

      const predictionIds = [];
      for (let i = start; i >= target; i--) predictionIds.push(ids[i - 1]);
      const fetched = await retrieve(pool, predictionIds);
      setMyPredictions(fetched);
      setIsFetchingPreds(false);
    };

    useEffect(() => {
      setUnclaimedWins(
        myPredictions
          ? myPredictions.filter(({ claimWinningsTime, isAWinner }) => claimWinningsTime === 0 && isAWinner)
          : []
      );
    }, [myPredictions]);

    useEffect(() => {
      (async () => {
        if (ids) {
          if (ids.length == 0) {
            setMyPredictions([]);
          } else {
            if (currentPage === null) setCurrentPage(getLastPage(ids.length));

            await fetchMyPredictions();
            fetchMyActivity();
          }
        }
      })();
    }, [ids]);

    useEffect(() => {
      fetchMyPredictions();
    }, [completionTime]);

    const [now, setNow] = useState(Math.trunc(Date.now() / 1000));

    useEffect(() => {
      const interval = setInterval(() => setNow(Math.trunc(Date.now() / 1000)), 1000);
      return () => clearInterval(interval);
    }, [now]);

    useEffect(() => {
      fetchMyPredictionIds();
    }, [address, currentChain]);

    useEffect(() => {
      // Update the IDs silently anytime the user leaves the page and comes back
      const handleFocus = () => fetchMyPredictionIds(false);
      window.addEventListener('focus', handleFocus);

      // Cleanup the event listener
      return () => window.removeEventListener('focus', handleFocus);
    }, []); // Keep empty dependency array since we want this to run once

    if (
      !isConnected ||
      (!isFetchingIds && !isFetchingPreds && ids && ids.length === 0 && myPredictions && myPredictions.length === 0)
    ) {
      return <></>;
    }

    return (
      <div className="border border-border-default dark:border-surface-subtle p-6 rounded-[24px] w-full mb-8">
        <div className="flex gap-4 justify-between flex-wrap items-center mb-6">
          <h3 className="font-medium text-xl text-text-subtitle">My Predictions</h3>

          {pool.completionTime > 0 && unclaimedWins.length > 1 && (
            <ClaimAllButton
              pools={Array.from(Array(unclaimedWins.length)).map((_) => pool)}
              predictions={unclaimedWins}
              onSuccess={() => {
                fetchMyPredictions();
                fetchMyActivity();
              }}
            />
          )}
        </div>

        {currentPage !== null && ids && ids.length > 0 && (
          <Paginator
            first={rowsPerPage * currentPage}
            rows={rowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            totalRecords={ids.length}
            onPageChange={(e) => {
              setCurrentPage(e.page);
              setRowsPerPage(e.rows);
              fetchMyPredictions(e.page, e.rows);
            }}
            template="FirstPageLink PrevPageLink JumpToPageDropdown CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="{first} to {last} of {totalRecords}"
            className="rounded-2xl bg-surface-subtle mb-4"
            pt={{
              RPPDropdown: {
                root: { className: 'bg-app-bg' },
                panel: { className: 'bg-app-bg' }
              }
            }}
          />
        )}

        {isFetchingIds || isFetchingPreds ? (
          <Accordion
            activeIndex={isExpanded ? 0 : null}
            onTabOpen={() => setIsExpanded(true)}
            onTabClose={() => setIsExpanded(false)}
          >
            <AccordionTab
              header={isExpanded ? 'Collapse' : 'Expand'}
              pt={{
                root: { className: 'bg-app-bg mb-4' },
                header: { className: 'rounded-2xl' },
                content: { className: 'bg-app-bg px-0' }
              }}
            >
              {[1, 2, 3].map((i) => (
                <Breathing key={i} height={64} className="mb-3 rounded-2xl w-full" />
              ))}
            </AccordionTab>
          </Accordion>
        ) : !ids || !myPredictions ? (
          <div className="text-center pb-4">
            <p className="mb-4">Something Went Wrong</p>
            <button
              onClick={async () => {
                if (!ids) await fetchMyPredictionIds();
                else fetchMyPredictions();
              }}
              className="py-2 px-4 rounded-full font-medium p-ripple border border-border-default dark:border-surface-subtle text-text-subtitle"
            >
              Retry
              <Ripple />
            </button>
          </div>
        ) : (
          <Accordion
            activeIndex={isExpanded ? 0 : null}
            onTabOpen={() => setIsExpanded(true)}
            onTabClose={() => setIsExpanded(false)}
          >
            <AccordionTab
              header={isExpanded ? 'Collapse' : 'Expand'}
              pt={{
                root: { className: 'bg-app-bg mb-4' },
                header: { className: 'rounded-2xl' },
                content: { className: 'bg-app-bg px-0' }
              }}
            >
              {myPredictions.map((prediction) => {
                const { explorerUrl, id, price, time, isAWinner } = prediction;
                return (
                  <div
                    key={id}
                    className="rounded-2xl bg-surface-subtle p-4 flex justify-between items-center flex-wrap gap-4 mb-4"
                  >
                    <p className="text-primary-darker bg-primary-subtle border border-primary-lighter py-0.5 px-3 rounded-full text-sm">
                      ID: {id}
                    </p>

                    <Tooltip target=".prediction-time" />
                    <p
                      className="prediction-time text-text-caption cursor-context-menu"
                      data-pr-tooltip={`Prediction Time: ${`${new Date(time * 1000)}`.split(' GMT')[0]}`}
                    >
                      {ms((now - time) * 1000)}
                    </p>

                    {!completionTime ? (
                      <p>
                        {seeds.predictionTokenDetails.name} @ {price}
                      </p>
                    ) : (
                      <>
                        <p
                          className={
                            'py-1 px-4 rounded-full text-sm w-fit ' +
                            `${
                              isAWinner
                                ? 'text-success-darker bg-success-subtle'
                                : 'text-errors-darker bg-errors-subtle'
                            }`
                          }
                        >
                          ${price}
                        </p>

                        {isAWinner ? (
                          <div className="flex items-center justify-end gap-3">
                            <p className="text-white font-medium flex items-center bg-success-default py-1 px-3 rounded-full w-fit">
                              <Trophy className="fill-white w-4 h-4 mr-1" />
                              Won
                            </p>
                            <ClaimButton
                              pool={pool}
                              prediction={prediction}
                              onSuccess={() => {
                                fetchMyPredictions();
                                fetchMyActivity();
                              }}
                            />
                          </div>
                        ) : (
                          <p className="text-text-disabled font-medium items-center flex bg-surface-subtle py-1 px-3 rounded-full w-fit">
                            <MoodSadFilled className="fill-text-disabled w-4 h-4 mr-1" />
                            Unlucky
                          </p>
                        )}
                      </>
                    )}

                    {!!explorerUrl && (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center text-xs text-text-caption hover:underline"
                      >
                        View in Explorer
                        <ExternalLink className="w-4 h-4 ml-1 fill-text-caption" />
                      </a>
                    )}
                  </div>
                );
              })}
            </AccordionTab>
          </Accordion>
        )}
      </div>
    );
  }
);
