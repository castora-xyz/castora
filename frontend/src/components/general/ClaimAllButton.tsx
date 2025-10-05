import Coin3Fill from '@/assets/coin-3-fill.svg?react';
import ExternalLink from '@/assets/external-link.svg?react';
import Spinner from '@/assets/spinner.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import { SuccessIcon } from '@/components';
import { useFirebase, usePools } from '@/contexts';
import { Pool, Prediction, Token } from '@/schemas';
import { Dialog } from 'primereact/dialog';
import { Ripple } from 'primereact/ripple';
import { useState } from 'react';

export const ClaimAllButton = ({
  pools,
  predictions,
  onSuccess
}: {
  pools: Pool[];
  predictions: Prediction[];
  onSuccess: () => void;
}) => {
  const { recordEvent } = useFirebase();
  const { claimWinningsBulk } = usePools();

  const [explorerUrl, setExplorerUrl] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isShowingModal, setIsShowingModal] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const isInOnePool = pools.every((pool) => pool.poolId === pools[0].poolId);

  const grouped = predictions.reduce((acc, { poolId, id }) => {
    if (!acc[poolId]) acc[poolId] = [];
    acc[poolId].push(id);
    return acc;
  }, {} as Record<number, number[]>);

  const winsMap = pools.reduce((acc, pool) => {
    const tokenDetails = pool.seeds.stakeTokenDetails;
    const { winAmount } = pool;
    if (!acc[tokenDetails.name]) {
      acc[tokenDetails.name] = { wins: winAmount, tokenDetails };
    } else {
      acc[tokenDetails.name].wins += winAmount;
    }
    // this is to handle JS weird decimal additions like
    // 0.4 + 0.2 = 0.600000000000001
    acc[tokenDetails.name].wins = parseFloat(acc[tokenDetails.name].wins.toFixed(3));
    return acc;
  }, {} as Record<string, { wins: number; tokenDetails: Token }>);

  const winsDisplay = Object.entries(winsMap)
    .map(([token, { wins }]) => `${wins} ${token}`)
    .join(', ');

  const claimableDisplay = Object.entries(winsMap)
    .map(([token, { wins, tokenDetails }]) => {
      const { decimals } = tokenDetails;
      // calling Math.floor is to avoid too many decimal places
      const actuals = Math.trunc((Math.floor(wins * 0.95 * 10 ** decimals) / 10 ** decimals) * 1000) / 1000;
      return `${actuals} ${token}`;
    })
    .join(', ');

  const reset = () => {
    setIsClaiming(false);
    setLoadingText('');
  };

  const claim = () => {
    setIsClaiming(true);
    setLoadingText('Checking ...');
    claimWinningsBulk(
      pools.map(({ poolId }) => poolId),
      predictions.map(({ id }) => id),
      setExplorerUrl
    ).subscribe({
      next: (status) => {
        if (status === 'submitted') {
          setLoadingText('Sign Bulk Withdrawal Transaction in Wallet');
        } else if (status === 'waiting') {
          setLoadingText('Waiting for On-Chain Confirmation ...');
        } else if (status === 'finalizing') {
          setLoadingText('Finalizing ...');
        }
      },
      error: reset,
      complete: reset
    });
  };

  const closeModal = () => {
    document.body.classList.remove('overflow-hidden');
    setIsShowingModal(false);
    recordEvent('closed_claim_bulk_modal', { isInOnePool });
    if (explorerUrl) onSuccess();
  };

  const openModal = () => {
    setIsShowingModal(true);
    document.body.classList.add('overflow-hidden');
    recordEvent('opened_claim_bulk_modal', { isInOnePool });
  };

  return (
    <>
      <button
        className="py-1 px-6 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
        onClick={openModal}
        disabled={!!explorerUrl}
      >
        <span>Claim All</span>
        <Ripple />
      </button>

      <Dialog
        visible={isShowingModal}
        onHide={closeModal}
        header={' '}
        unstyled={true}
        pt={{
          root: {
            className: 'bg-app-bg mx-8 xs:mx-auto max-w-md p-6 rounded-2xl my-12'
          },
          header: {
            className: isClaiming || explorerUrl ? 'hidden' : 'flex justify-end'
          },
          mask: { className: 'bg-black/50 dark:bg-white/20' }
        }}
      >
        {isClaiming ? (
          <div className="py-8 xs:px-8">
            <p className="text-center text-xl mb-6">{loadingText}</p>
            <Spinner className="w-16 h-16" />
          </div>
        ) : explorerUrl ? (
          <>
            <p className="pt-8"></p>
            <SuccessIcon child={<Coin3Fill className="w-8 h-8 fill-app-bg" />} />

            <p className="text-center text-xl mb-6 xs:px-4 sm:px-8">You've claimed all rewards!</p>

            <p className="mb-8 text-sm text-text-caption text-center flex items-center justify-center">
              <ExternalLink className="w-5 h-5 mr-1 fill-text-caption" />
              <a href={explorerUrl} target="_blank" rel="noreferrer" className="underline">
                View In Explorer
              </a>
            </p>

            <button
              className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white"
              onClick={closeModal}
            >
              Close
              <Ripple />
            </button>
          </>
        ) : (
          <>
            <SuccessIcon child={<Trophy className="w-8 h-8 fill-app-bg" />} />

            <p className="text-center text-xl mb-6 px-8 sm:px-16">
              You won{' '}
              <span className={`font-bold ${Object.keys(winsMap).length > 1 ? ' block' : ''}`}>{winsDisplay}</span>
            </p>

            <div className="px-4 py-2 border-t border-border-default dark:border-surface-subtle border-l border-r rounded-t-2xl">
              {isInOnePool ? (
                <div className="flex gap-2 flex-wrap items-center">
                  <p className="text-text-caption text-sm">
                    Across <span className="font-bold">{predictions.length} Predictions</span> in
                  </p>
                  <p className="text-text-caption border border-border-default dark:border-surface-subtle py-1 px-3 rounded-full text-xs">
                    Pool ID: {pools[0].poolId}
                  </p>
                </div>
              ) : (
                <p className="text-text-caption">
                  Across <span className="font-bold">{predictions.length} Predictions</span> in{' '}
                  <span className="font-bold">{Object.keys(grouped).length} Pools</span>
                </p>
              )}
            </div>
            <div className="px-4 pt-3 pb-5 bg-surface-subtle mb-6 rounded-b-2xl">
              {isInOnePool ? (
                <div className="flex gap-3 flex-wrap">
                  {predictions.map(({ id }) => (
                    <p
                      className="text-primary-darker bg-primary-subtle border border-primary-lighter py-0.5 px-3 rounded-full text-sm"
                      key={id}
                    >
                      ID: {id}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="max-[414px]:flex max-[414px]:flex-col max-[414px]:gap-2 grid grid-cols-2 gap-y-3 gap-x-6">
                  {predictions.map(({ id, poolId }) => (
                    <div className="flex gap-2" key={`Pool-${poolId} Prediction${id}`}>
                      <p className="text-text-caption border border-border-default dark:border-surface-subtle bg-app-bg py-1 px-3 rounded-full text-xs">
                        Pool ID: {poolId}
                      </p>
                      <p className="text-primary-darker bg-primary-subtle border border-primary-lighter py-0.5 px-3 rounded-full text-sm">
                        ID: {id}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="flex flex-wrap gap-4 text-sm p-1 pl-4 mb-2 rounded-full items-center w-fit mx-auto border border-border-default dark:border-surface-subtle">
              <span>Fees</span>
              <span className="font-medium ml-4 p-1 px-5 rounded-full text-primary-darker dark:text-primary-default border border-border-default dark:border-surface-subtle">
                5%
              </span>
            </p>

            <p className="flex flex-wrap gap-4 text-sm p-1 pl-4 mb-8 rounded-full items-center w-fit mx-auto border border-border-default dark:border-surface-subtle">
              <span>Claimable</span>
              <span className="font-medium p-1 px-3 rounded-full text-primary-darker dark:text-primary-default border border-border-default dark:border-surface-subtle">
                {claimableDisplay}
              </span>
            </p>

            <button
              className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white"
              onClick={claim}
            >
              Claim All
              <Ripple />
            </button>
          </>
        )}
      </Dialog>
    </>
  );
};
