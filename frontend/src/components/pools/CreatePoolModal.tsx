import CheckCircle from '@/assets/check-circle.svg?react';
import ExternalLink from '@/assets/external-link.svg?react';
import Spinner from '@/assets/spinner.svg?react';
import Telegram from '@/assets/telegram-plain.svg?react';
import { SuccessIcon } from '@/components';
import {
  CreatePoolForm,
  useContract,
  useFirebase,
  useMyCreateActivity,
  usePools,
  useTelegram,
  useToast
} from '@/contexts';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const CreatePoolModal = ({
  form,
  handleShowHeading,
  handleClose,
  handleCreationSuccess
}: {
  form: CreatePoolForm;
  handleShowHeading: (isLoading: boolean) => void;
  handleClose: () => void;
  handleCreationSuccess: () => void;
}) => {
  // left the unused extracts here for create with ERC20 token as fees
  const { approve, balance, poolsManagerAddress, castoraAddress, hasAllowance } = useContract();
  const { create } = usePools();
  const { recordEvent } = useFirebase();
  const navigate = useNavigate();
  const { toastInfo } = useToast();
  const { updateActivityCount } = useMyCreateActivity();

  const telegram = useTelegram();

  const [createdPoolId, setCreatedPoolId] = useState(0);
  const [currentWalletStep, setCurrentWalletStep] = useState(0);
  const [explorerUrl, setExplorerUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasEnoughBalance, setHasEnoughBalance] = useState(true);
  const [loadingBody, setLoadingBody] = useState('');
  const [loadingTitle, setLoadingTitle] = useState('');
  const [walletSteps, setWalletSteps] = useState(0);

  const checkBalance = async () => {
    const balanceOf = await balance(castoraAddress);
    setHasEnoughBalance(balanceOf !== null && balanceOf >= 10e18);
  };

  const reset = () => {
    setIsCreating(false);
    setLoadingTitle('');
    setLoadingBody('');
    setCurrentWalletStep(0);
    setWalletSteps(0);
  };

  const uiCreate = () => {
    setLoadingTitle('Create Pool Transaction');
    setLoadingBody('Submitting ...');
    let successUrl: string;
    let poolId: number;
    create(form, (url, createdPoolId) => {
      successUrl = url;
      poolId = createdPoolId;
    }).subscribe({
      next: (status) => {
        if (status === 'submitted') {
          setLoadingBody('Confirm Transaction in Wallet');
        } else if (status === 'waiting') {
          setLoadingBody('Waiting for On-Chain Confirmation ...');
        } else if (status === 'finalizing') {
          setLoadingBody('Finalizing ...');
        }
      },
      error: () => {
        setIsSuccess(false);
        reset();
      },
      complete: () => {
        if (successUrl) setExplorerUrl(successUrl);
        if (poolId) setCreatedPoolId(poolId);
        setIsSuccess(!!successUrl);
        updateActivityCount();
        handleCreationSuccess();
        reset();
      }
    });
  };

  const createPool = async () => {
    setIsCreating(true);
    setLoadingTitle('Checking ...');

    await checkBalance();
    if (!hasEnoughBalance) {
      setIsCreating(false);
      setLoadingTitle('');
      return;
    }

    // When creating with Native token
    // if (createToken.toLowerCase() == castoraAddress.toLowerCase()) {
    setWalletSteps(1);
    uiCreate();
    // } else {
    //   // When creating with ERC20 token
    //   const hadAllowee = await hasAllowance({ contract: 'pools-manager', token: createToken, amount });
    //   setWalletSteps(hadAllowee ? 1 : 2);
    //   if (!hadAllowee) {
    //     setCurrentWalletStep(1);
    //     setLoadingTitle('Token Spend Approval');
    //     setLoadingBody('Submitting ...');
    //     let approvalTxHash: string;
    //     approve({
    //       contract: 'pools-manager',
    //       token: createToken,
    //       amount,
    //       onSuccessCallback: (hash) => (approvalTxHash = hash)
    //     }).subscribe({
    //       next: (status) => {
    //         if (status === 'submitted') {
    //           setLoadingBody('Approve Token Spend in Wallet');
    //         } else if (status === 'waiting') {
    //           setLoadingBody('Waiting for On-Chain Confirmation ...');
    //         }
    //       },
    //       error: () => {
    //         setIsSuccess(false);
    //         reset();
    //       },
    //       complete: () => {
    //         if (approvalTxHash) {
    //           setCurrentWalletStep(2);
    //           uiCreate();
    //         } else {
    //           setIsSuccess(false);
    //           reset();
    //         }
    //       }
    //     });
    //   } else {
    //     uiCreate();
    //   }
    // }
  };

  const displayDate = (date: Date) => {
    const time = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
    const dateStr = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
    return `${time} ${dateStr}`;
  };

  useEffect(() => {
    handleShowHeading(!isCreating && !isSuccess);
  }, [isCreating, isSuccess]);

  if (isSuccess)
    return (
      <>
        <SuccessIcon child={<CheckCircle className="w-8 h-8 fill-app-bg" />} />

        <p className="text-center text-xl mb-4 xs:px-4">
          You've successfully created Pool <span className="text-primary-default font-bold">{createdPoolId}</span>
        </p>

        <p className="mb-4 text-sm text-text-caption text-center flex items-center justify-center">
          <ExternalLink className="w-5 h-5 mr-1 fill-text-caption" />
          <a href={explorerUrl} target="_blank" rel="noreferrer" className="underline">
            View In Explorer
          </a>
        </p>

        {!telegram.hasLinked && (
          <button
            className="py-1.5 px-4 font-medium rounded-full w-fit sm:text-lg bg-primary-default text-white p-ripple flex gap-2 items-center mx-auto mb-4"
            onClick={async () => {
              await telegram.startAuth();
              recordEvent('clicked_get_telegram_notified_prediction_success');
            }}
          >
            <Telegram className="w-6 h-6 fill-white" />
            <span>Get Notified</span>
            <Ripple />
          </button>
        )}

        <div className="flex gap-4 mt-8 mb-4">
          <button
            className="w-full py-2 px-4 rounded-full font-medium p-ripple  border border-border-default dark:border-surface-subtle text-text-subtitle"
            onClick={handleClose}
          >
            Create Another
            <Ripple />
          </button>
          <button
            className="w-full py-2 px-4 rounded-full font-medium p-ripple  border border-border-default dark:border-surface-subtle text-text-subtitle"
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin + '/pool/' + createdPoolId);
              toastInfo(
                'Copied Link',
                `Successfully copied ${window.location.origin}/pool/${createdPoolId} to Clipboard`
              );
            }}
          >
            Copy Link
            <Ripple />
          </button>
        </div>
        <button
          className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white"
          onClick={() => {
            handleClose();
            navigate(`/pool/${createdPoolId}`);
          }}
        >
          Go To Pool
          <Ripple />
        </button>
      </>
    );

  if (isCreating) {
    return (
      <div className="py-8 xs:px-8">
        {walletSteps > 1 && (
          <div className="flex w-full justify-center items-center mx-auto mb-8">
            {Array.from(Array(walletSteps).keys()).map((i) => (
              <div key={i} className={'flex justify-center items-center' + (i < walletSteps - 1 ? ' grow' : '')}>
                <p
                  className={
                    'w-8 h-8 flex justify-center items-center rounded-full mx-1 border border-primary-default ' +
                    `${i <= currentWalletStep - 1 ? 'bg-primary-default text-white' : 'text-primary-default'}`
                  }
                >
                  {i + 1}
                </p>

                {i < walletSteps - 1 && <div className="block h-px bg-primary-default mx-px grow w-4"></div>}
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xl mb-2">{loadingTitle}</p>

        <p className="text-center text-text-caption mb-6">{loadingBody}</p>

        <Spinner className="w-16 h-16" />
      </div>
    );
  }

  return (
    <>
      <table className="mb-12 w-full">
        <tbody>
          {[
            ['Token Pair', `${form.predictionToken}/USD`],
            ['Stake', `${form.stakeAmount} ${form.stakeToken}`],
            ['Window Close', displayDate(form.windowCloseTime!)],
            ['Snapshot', displayDate(form.snapshotTime!)],
            ['Multiplier', form.multiplier],
            ['Visibility', form.visibility == 'unlisted' ? 'Unlisted' : 'Public']
          ].map(([k, v]) => (
            <tr key={k + v}>
              <th className="bg-surface-subtle text-right font-normal p-2 border border-app-bg">{k}</th>
              <th className="font-medium p-2 border text-left border-surface-subtle">{v}</th>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white disabled:bg-surface-disabled disabled:text-text-disabled"
        disabled={isCreating || !hasEnoughBalance}
        onClick={createPool}
      >
        Create Pool (10 MON)
        {!isCreating && hasEnoughBalance && <Ripple />}
      </button>

      <p className="mt-1 text-center">
        <span className="text-xs">You Gain: </span>
        <span className="text-sm font-bold text-primary-default">30% Pool Fees</span>
      </p>

      {!hasEnoughBalance && (
        <p className="text-xs text-center mt-4 text-errors-default">Insufficient Balance. Please Top Up To Continue.</p>
      )}
    </>
  );
};
