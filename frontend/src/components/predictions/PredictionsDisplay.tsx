import Cog from '@/assets/cog.svg?react';
import ExternalLink from '@/assets/external-link.svg?react';
import MoodSadFilled from '@/assets/mood-sad-filled.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import { rowsPerPageOptions, usePaginators, usePredictions } from '@/contexts';
import { Pool, Prediction } from '@/schemas';
import ms from 'ms';
import { Paginator } from 'primereact/paginator';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useState } from 'react';
import { Breathing } from 'react-shimmer';
import { useAccount, useChains } from 'wagmi';

export const PredictionsDisplay = ({
  pool: { noOfPredictions, seeds, completionTime },
  pool
}: {
  pool: Pool;
}) => {
  const { address, chain: currentChain } = useAccount();
  const [defaultChain] = useChains();
  const paginators = usePaginators();
  const retrieve = usePredictions();

  const [currentPage, setCurrentPage] = useState(
    paginators.getLastPage(noOfPredictions)
  );
  const [hasError, setHasError] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const load = async (
    showLoading = true,
    page = currentPage,
    rows = paginators.rowsPerPage
  ) => {
    if (noOfPredictions == 0) {
      setPredictions([]);
      setIsFetching(false);
      setHasError(false);
      return;
    }

    if (showLoading) setIsFetching(true);

    let start = (page + 1) * rows;
    if (start >= noOfPredictions) start = noOfPredictions;
    const target = page * rows + 1;

    const predictionIds = [];
    for (let i = start; i >= target; i--) predictionIds.push(BigInt(i));
    const predictions = await retrieve(pool, predictionIds);
    if (!predictions) {
      setIsFetching(false);
      setHasError(true);
      return;
    }

    setPredictions(predictions);
    setIsFetching(false);
    setHasError(false);
  };

  const shorten = (str: string) => {
    if (str.length < 10) return str;
    return (
      str.substring(0, 5) +
      '...' +
      str.split('').reverse().slice(0, 5).reverse().join('')
    );
  };

  useEffect(() => {
    const interval = setInterval(
      () => setNow(Math.trunc(Date.now() / 1000)),
      1000
    );
    return () => clearInterval(interval);
  }, [now]);

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="border border-border-default dark:border-surface-subtle p-6 rounded-[24px] w-full mb-8">
      <h3 className="font-medium text-xl text-text-subtitle mb-6">
        Pool Activities
      </h3>

      <Paginator
        first={paginators.rowsPerPage * currentPage}
        rows={paginators.rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        totalRecords={noOfPredictions}
        onPageChange={(e) => {
          paginators.updateRowsPerPage(e.rows);
          setCurrentPage(e.page);
          load(true, e.page, e.rows);
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

      {isFetching ? (
        [1, 2, 3, 4, 5].map((i) => (
          <Breathing key={i} height={64} className="mb-3 rounded-2xl w-full" />
        ))
      ) : hasError ? (
        <div className="text-center py-12">
          <p className="mb-4">Something Went Wrong</p>
          <button
            onClick={() => load()}
            className="py-2 px-4 rounded-full font-medium p-ripple border border-border-default dark:border-surface-subtle text-text-subtitle"
          >
            Retry
            <Ripple />
          </button>
        </div>
      ) : predictions.filter(({ predicter }) => predicter != address).length ==
        0 ? (
        <div className="flex flex-col justify-center items-center grow text-center py-20">
          <Cog className="w-12 h-12 mb-4 fill-text-body" />

          <p className="text-lg sm:text-2xl">
            No {noOfPredictions > 0 ? 'Other' : ''} Pool Activity{' '}
            {now >= seeds.windowCloseTime ? '' : 'Yet'}
          </p>
        </div>
      ) : (
        predictions
          .filter(({ predicter }) => predicter != address)
          .map((prediction) => {
            const {
              explorerUrl,
              id,
              isAWinner,
              predicter,
              price,
              time,
              claimWinningsTime
            } = prediction;
            return (
              <div
                key={id}
                className="rounded-2xl bg-surface-subtle p-4 flex justify-between items-center flex-wrap gap-4 mb-4"
              >
                <a
                  href={`${
                    (currentChain ?? defaultChain).blockExplorers?.default.url
                  }/address/${predicter}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center text-xs text-text-caption hover:underline"
                >
                  {shorten(predicter)}
                  <ExternalLink className="w-4 h-4 ml-1 fill-text-caption" />
                </a>

                <p className="text-primary-darker bg-primary-subtle border border-primary-lighter py-0.5 px-3 rounded-full text-sm">
                  ID: {id}
                </p>

                <Tooltip target=".prediction-time" />
                <p
                  className="prediction-time text-text-caption cursor-context-menu"
                  data-pr-tooltip={`Prediction Time: ${
                    `${new Date(time * 1000)}`.split(' GMT')[0]
                  }`}
                >
                  {ms((now - time) * 1000)}{' '}
                  {now < seeds.snapshotTime ? 'ago' : ''}
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

                        {!!claimWinningsTime && (
                          <p className="py-1 px-3 rounded-full bg-surface-disabled border-2 border-surface-subtle font-medium text-text-disabled w-fit">
                            <span>Claimed</span>
                          </p>
                        )}
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
          })
      )}
    </div>
  );
};
