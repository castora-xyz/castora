import Coin3Fill from '@/assets/coin-3-fill.svg?react';
import ExternalLink from '@/assets/external-link.svg?react';
import Spinner from '@/assets/spinner.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import { SuccessIcon } from '@/components';
import { useFirebase, useMyCreateActivity, usePools } from '@/contexts';
import { Token } from '@/schemas';
import { Dialog } from 'primereact/dialog';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { useConnection } from 'wagmi'

export const ClaimAllCreateButton = () => {
  const {isConnected} = useConnection()
  const { recordEvent } = useFirebase();
  const { claimPoolCompletionFeesBulk } = usePools();
  const {
    isFetchingUnclaimed,
    myUnclaimedPoolIds: poolIds,
    myUnclaimedUserCreateds: userCreateds,
    fetchMyActivity,
    updateUnclaimed
  } = useMyCreateActivity();

  const [gainsMap, setGainsMap] = useState<Record<string, { gains: number; tokenDetails: Token }>>({});
  const [gainsDisplay, setGainsDisplay] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isShowingModal, setIsShowingModal] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    setGainsMap(
      userCreateds.reduce((acc, userCreated) => {
        const { completionFeesTokenDetails: tokenDetails, completionFeesAmount: gained } = userCreated;
        if (!acc[tokenDetails.name]) {
          acc[tokenDetails.name] = { gains: gained, tokenDetails };
        } else {
          acc[tokenDetails.name].gains += gained;
        }
        // this is to handle JS weird decimal additions like
        // 0.4 + 0.2 = 0.600000000000001
        acc[tokenDetails.name].gains = parseFloat(acc[tokenDetails.name].gains.toFixed(5));
        return acc;
      }, {} as Record<string, { gains: number; tokenDetails: Token }>)
    );
  }, [userCreateds]);

  useEffect(() => {
    setGainsDisplay(
      Object.entries(gainsMap)
        .map(([token, { gains }]) => `${gains} ${token}`)
        .join(', ')
    );
  }, [gainsMap]);

  const reset = () => {
    setIsClaiming(false);
    setLoadingText('');
  };

  const claim = () => {
    setIsClaiming(true);
    setLoadingText('Checking ...');
    claimPoolCompletionFeesBulk(poolIds, setExplorerUrl).subscribe({
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
    recordEvent('closed_claim_from_created_bulk_modal');
    if (explorerUrl) {
      fetchMyActivity();
      updateUnclaimed();
    }
  };

  const openModal = () => {
    setIsShowingModal(true);
    document.body.classList.add('overflow-hidden');
    recordEvent('opened_claim_from_created_bulk_modal');
  };

  if (!isConnected || isFetchingUnclaimed || poolIds.length === 0) return <></>;

  return (
    <div className="w-fit ml-auto">
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
              You gained{' '}
              <span className={`font-bold ${Object.keys(gainsMap).length > 1 ? ' block' : ''}`}>{gainsDisplay}</span>
            </p>

            <div className="px-4 py-2 border-t border-border-default dark:border-surface-subtle border-l border-r rounded-t-2xl">
              <p className="text-text-caption">
                Across <span className="font-bold">{poolIds.length} Pools</span>
              </p>
            </div>
            <div className="px-4 pt-3 pb-5 bg-surface-subtle mb-6 rounded-b-2xl">
              <div className="max-[414px]:flex max-[414px]:flex-col max-[414px]:gap-2 grid grid-cols-2 gap-y-3 gap-x-6">
                {poolIds.map((poolId) => (
                  <div className="flex gap-2" key={`Pool-${poolId}`}>
                    <p className="text-text-caption border border-border-default dark:border-surface-subtle bg-app-bg py-1 px-3 rounded-full text-xs">
                      Pool ID: {poolId}
                    </p>
                  </div>
                ))}
              </div>
            </div>

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
    </div>
  );
};
