import Coin3Fill from '@/assets/coin-3-fill.svg?react';
import ExternalLink from '@/assets/external-link.svg?react';
import Spinner from '@/assets/spinner.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import { useFirebase, usePools } from '@/contexts';
import { Pool, Prediction } from '@/models';
import { Dialog } from 'primereact/dialog';
import { Ripple } from 'primereact/ripple';
import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function ClaimButton({
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
}) {
  const { isConnected } = useAccount();
  const { recordEvent } = useFirebase();
  const { claimWinnings } = usePools();

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
        className="py-1 px-3 rounded-full bg-surface-disabled border-2 border-surface-subtle font-medium text-text-disabled"
        disabled
      >
        <span>Claimed</span>
      </button>
    );
  }

  return (
    <>
      <button
        className="py-1 px-3 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-white p-ripple"
        onClick={openModal}
      >
        <span>Claim Winnings</span>
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
            <div className="w-fit mx-auto bg-success-subtle dark:bg-success-lighter p-1 rounded-full mb-4">
              <div className="bg-success-lighter dark:bg-success-default p-1 rounded-full">
                <div className="bg-success-default dark:bg-success-darker p-2 rounded-full">
                  <Coin3Fill className="w-8 h-8 fill-app-bg" />
                </div>
              </div>
            </div>

            <p className="text-center text-xl mb-6 xs:px-4">
              You've claimed your rewards!
            </p>

            <p className="mb-8 text-sm text-text-caption text-center flex items-center justify-center">
              <ExternalLink className="w-5 h-5 mr-1 fill-text-caption" />
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
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
            <div className="w-fit mx-auto bg-success-subtle dark:bg-success-lighter p-1 rounded-full mb-4">
              <div className="bg-success-lighter dark:bg-success-default p-1 rounded-full">
                <div className="bg-success-default dark:bg-success-darker p-2 rounded-full">
                  <Trophy className="w-8 h-8 fill-app-bg" />
                </div>
              </div>
            </div>

            <p className="text-center text-xl mb-6 px-8">
              You won {winAmount} {stakeTokenDetails.name}
            </p>

            <p className="flex flex-wrap gap-4 text-sm p-1 pl-4 mb-2 rounded-full items-center w-fit mx-auto border border-border-default dark:border-surface-subtle">
              <span>Pool Fee</span>
              <span className="font-medium ml-4 p-1 px-5 rounded-full text-primary-darker border border-border-default dark:border-surface-subtle">
                5%
              </span>
            </p>

            <p className="flex flex-wrap gap-4 text-sm p-1 pl-4 mb-8 rounded-full items-center w-fit mx-auto border border-border-default dark:border-surface-subtle">
              <span>Claimable</span>
              <span className="font-medium p-1 px-3 rounded-full text-primary-darker border border-border-default dark:border-surface-subtle">
                {winAmount * 0.95} {stakeTokenDetails.name}
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
}
