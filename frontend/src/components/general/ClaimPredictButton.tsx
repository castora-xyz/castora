import Coin3Fill from '@/assets/coin-3-fill.svg?react';
import ExternalLink from '@/assets/external-link.svg?react';
import Spinner from '@/assets/spinner.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import { SuccessIcon } from '@/components';
import { useFirebase, useMyPredictActivity, usePools } from '@/contexts';
import { Pool, Prediction } from '@/schemas';
import { Dialog } from 'primereact/dialog';
import { Ripple } from 'primereact/ripple';
import { useState } from 'react';
import { useAccount } from 'wagmi';

export const ClaimPredictButton = ({
  pool: {
    poolId,
    seeds: { snapshotTime, stakeTokenDetails },
    completionTime,
    winAmount
  },
  prediction: { id: predictionId, isAWinner, claimWinningsTime }
}: {
  pool: Pool;
  prediction: Prediction;
}) => {
  const { isConnected } = useAccount();
  const { recordEvent } = useFirebase();
  const { claimWinnings } = usePools();
  const { fetchMyActivity } = useMyPredictActivity();

  const [explorerUrl, setExplorerUrl] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isShowingModal, setIsShowingModal] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const reset = () => {
    setIsClaiming(false);
    setLoadingText('');
  };

  const claim = () => {
    setIsClaiming(true);
    setLoadingText('Checking ...');
    claimWinnings(poolId, predictionId, setExplorerUrl).subscribe({
      next: (status) => {
        if (status === 'submitted') {
          setLoadingText('Sign Withdrawal Transaction in Wallet');
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
    recordEvent('closed_claim_modal', { poolId, predictionId });
    if (explorerUrl) fetchMyActivity();
  };

  const now = () => Math.trunc(Date.now() / 1000);

  const openModal = () => {
    setIsShowingModal(true);
    document.body.classList.add('overflow-hidden');
    recordEvent('opened_claim_modal', { poolId, predictionId });
  };

  if (!isConnected || now() < snapshotTime || !completionTime || !isAWinner) {
    return <></>;
  }

  if (!!claimWinningsTime) {
    return (
      <button
        className="py-pt px-4 rounded-full bg-surface-disabled border-2 border-surface-subtle font-medium text-text-disabled"
        disabled
      >
        <span className="align-text-bottom">Claimed</span>
      </button>
    );
  }

  return (
    <>
      <button
        className="py-pt px-6 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
        onClick={openModal}
        disabled={!!explorerUrl}
      >
        <span className="align-text-bottom">Claim</span>
        <Ripple />
      </button>

      <Dialog
        visible={isShowingModal}
        onHide={closeModal}
        header={' '}
        unstyled={true}
        pt={{
          root: {
            className: 'bg-app-bg mx-8 xs:mx-auto max-w-sm p-6 rounded-2xl'
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

            <p className="text-center text-xl mb-6 xs:px-4 sm:px-8">You've claimed your rewards!</p>

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
              <span className="font-bold">
                {winAmount} {stakeTokenDetails.name}
              </span>
            </p>

            <p className="flex flex-wrap gap-4 text-sm p-1 pl-4 mb-2 rounded-full items-center w-fit mx-auto border border-border-default dark:border-surface-subtle">
              <span>Pool Fee</span>
              <span className="font-medium ml-4 p-1 px-5 rounded-full text-primary-darker dark:text-primary-default border border-border-default dark:border-surface-subtle">
                5%
              </span>
            </p>

            <p className="flex flex-wrap gap-4 text-sm p-1 pl-4 mb-8 rounded-full items-center w-fit mx-auto border border-border-default dark:border-surface-subtle">
              <span>Claimable</span>
              <span className="font-medium p-1 px-3 rounded-full text-primary-darker dark:text-primary-default border border-border-default dark:border-surface-subtle">
                {/*calling Math.floor is to avoid too many decimal places*/}
                {Math.floor(winAmount * 0.95 * 10 ** stakeTokenDetails.decimals) /
                  10 ** stakeTokenDetails.decimals}{' '}
                {stakeTokenDetails.name}
              </span>
            </p>

            <button
              className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white"
              onClick={claim}
            >
              Claim
              <Ripple />
            </button>
          </>
        )}
      </Dialog>
    </>
  );
};
