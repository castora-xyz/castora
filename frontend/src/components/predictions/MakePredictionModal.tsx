import CheckCircle from '@/assets/check-circle.svg?react';
import ExternalLink from '@/assets/external-link.svg?react';
import Spinner from '@/assets/spinner.svg?react';
import { CountdownNumbers, SuccessIcon } from '@/components';
import { useContract, usePools } from '@/contexts';
import { Pool } from '@/schemas';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';

export const MakePredictionModal = ({
  pool: { poolId, seeds },
  price,
  handleShowHeading,
  handleClose,
  handlePredictionSuccess
}: {
  pool: Pool;
  price: number;
  handleShowHeading: (isLoading: boolean) => void;
  handleClose: () => void;
  handlePredictionSuccess: () => void;
}) => {
  const { approve, balance, castoraAddress, hasAllowance } = useContract();
  const { predict } = usePools();

  const [currentPrice, setCurrentPrice] = useState(0);
  const [currentWalletStep, setCurrentWalletStep] = useState(0);
  const [explorerUrl, setExplorerUrl] = useState('');
  const [isMakingPrediction, setIsMakingPrediction] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasEnoughBalance, setHasEnoughBalance] = useState(true);
  const [loadingBody, setLoadingBody] = useState('');
  const [loadingTitle, setLoadingTitle] = useState('');
  const [walletSteps, setWalletSteps] = useState(0);

  const checkBalance = async () => {
    const balanceOf = await balance(seeds.stakeToken);
    setHasEnoughBalance(balanceOf !== null && balanceOf >= seeds.stakeAmount);
  };

  const reset = () => {
    setIsMakingPrediction(false);
    setLoadingTitle('');
    setLoadingBody('');
    setCurrentWalletStep(0);
    setWalletSteps(0);
  };

  const uiPredict = () => {
    setLoadingTitle('Prediction Transaction');
    setLoadingBody('Submitting ...');
    let successUrl: string;
    predict(
      poolId,
      price * 10 ** 8,
      seeds.stakeToken,
      seeds.stakeAmount,
      (url) => (successUrl = url)
    ).subscribe({
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
        setIsSuccess(!!successUrl);
        handlePredictionSuccess();
        reset();
      }
    });
  };

  const makePrediction = async () => {
    if (seeds.status() !== 'Open') return;

    setIsMakingPrediction(true);
    setLoadingTitle('Checking ...');

    await checkBalance();
    if (!hasEnoughBalance) {
      setIsMakingPrediction(false);
      setLoadingTitle('');
      return;
    }

    const { stakeToken, stakeAmount } = seeds;
    // When staking with Native token
    if (stakeToken.toLowerCase() == castoraAddress.toLowerCase()) {
      setWalletSteps(1);
      uiPredict();
    } else {
      // When staking with ERC20 token
      const hadAllowee = await hasAllowance(stakeToken, stakeAmount);
      setWalletSteps(hadAllowee ? 1 : 2);
      if (!hadAllowee) {
        setCurrentWalletStep(1);
        setLoadingTitle('Token Spend Approval');
        setLoadingBody('Submitting ...');
        let approvalTxHash: string;
        approve(
          stakeToken,
          stakeAmount,
          (hash) => (approvalTxHash = hash)
        ).subscribe({
          next: (status) => {
            if (status === 'submitted') {
              setLoadingBody('Approve Token Spend in Wallet');
            } else if (status === 'waiting') {
              setLoadingBody('Waiting for On-Chain Confirmation ...');
            }
          },
          error: () => {
            setIsSuccess(false);
            reset();
          },
          complete: () => {
            if (approvalTxHash) {
              setCurrentWalletStep(2);
              uiPredict();
            } else {
              setIsSuccess(false);
              reset();
            }
          }
        });
      } else {
        uiPredict();
      }
    }
  };

  useEffect(() => {
    handleShowHeading(!isMakingPrediction && !isSuccess);
  }, [isMakingPrediction, isSuccess]);

  useEffect(() => {
    checkBalance();

    const connection = new PriceServiceConnection(
      'https://hermes.pyth.network'
    );
    connection.subscribePriceFeedUpdates(
      [seeds.predictionTokenDetails.pythPriceId],
      (priceFeed) => {
        const { price, expo } = priceFeed.getPriceUnchecked();
        setCurrentPrice(
          parseFloat(
            (+price * 10 ** expo).toFixed(
              Math.abs(expo) < 2 ? Math.abs(expo) : 2
            )
          )
        );
      }
    );
    return () => connection.closeWebSocket();
  }, []);

  if (seeds.status() !== 'Open') return <></>;

  if (isSuccess)
    return (
      <>
        <SuccessIcon child={<CheckCircle className="w-8 h-8 fill-app-bg" />} />

        <p className="text-center text-xl mb-4 xs:px-4">
          You've successfully made a Prediction!
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

        <p className="flex flex-wrap gap-4 text-sm p-2 pl-4 mb-8 rounded-full justify-center items-center w-fit mx-auto border border-border-default dark:border-surface-subtle">
          <span>Snapshot Time</span>
          <span className="font-medium p-2 px-4 rounded-full text-primary-darker border border-border-default dark:border-surface-subtle">
            <CountdownNumbers timestamp={seeds.snapshotTime} />
          </span>
        </p>

        <button
          className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white"
          onClick={handleClose}
        >
          Close
          <Ripple />
        </button>
      </>
    );

  if (isMakingPrediction) {
    return (
      <div className="py-8 xs:px-8">
        {walletSteps > 1 && (
          <div className="flex w-full justify-center items-center mx-auto mb-8">
            {Array.from(Array(walletSteps).keys()).map((i) => (
              <div
                key={i}
                className={
                  'flex justify-center items-center' +
                  (i < walletSteps - 1 ? ' grow' : '')
                }
              >
                <p
                  className={
                    'w-8 h-8 flex justify-center items-center rounded-full mx-1 border border-primary-default ' +
                    `${
                      i <= currentWalletStep - 1
                        ? 'bg-primary-default text-white'
                        : 'text-primary-default'
                    }`
                  }
                >
                  {i + 1}
                </p>

                {i < walletSteps - 1 && (
                  <div className="block h-px bg-primary-default mx-px grow w-4"></div>
                )}
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
      <p className="flex text-sm p-2 pl-4 mb-3 rounded-full items-center w-fit border border-border-default dark:border-surface-subtle">
        <span>Pool Pair</span>
        <span className="font-medium ml-4 p-2 px-4 rounded-full bg-primary-subtle text-primary-darker border border-surface-subtle">
          {seeds.pairName()}
        </span>
      </p>

      <div className="py-3 px-5 rounded-2xl border border-border-default dark:border-surface-subtle flex gap-8 flex-wrap justify-center items-stretch text-center mb-6 text-sm">
        <div>
          <p className="mb-2">Current Price</p>
          <p className="py-2 px-4 border border-border-default dark:border-surface-subtle rounded-full">
            ${currentPrice}
          </p>
        </div>
        <div>
          <p className="mb-2">Prediction Price</p>
          <p className="py-2 px-4 border border-border-default dark:border-surface-subtle rounded-full">
            ${price}
          </p>
        </div>
      </div>

      <button
        className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white disabled:bg-surface-disabled disabled:text-text-disabled"
        disabled={isMakingPrediction || !hasEnoughBalance}
        onClick={makePrediction}
      >
        Join Pool ({seeds.displayStake()})
        {!isMakingPrediction && hasEnoughBalance && <Ripple />}
      </button>

      <p className="mt-1 text-center">
        <span className="text-xs">Potential Winnings </span>
        <span className="text-sm font-bold text-primary-default">
          (x{poolId == 3000 ? 10 : 2}):{' '}
          {seeds.displayStake(poolId == 3000 ? 10 : 2)}
        </span>
      </p>

      {!hasEnoughBalance && (
        <p className="text-xs text-center mt-4 text-errors-default">
          Insufficient Balance. Please Top Up To Continue.
        </p>
      )}
    </>
  );
};
