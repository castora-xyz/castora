import { CountdownNumbers } from '@/components';
import { useContract } from '@/contexts';
import { Pool, landingPageDefaults } from '@/schemas';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Ripple } from 'primereact/ripple';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

export const LandingPredictionsSection = ({ pool }: { pool: Pool | null }) => {
  const connection = new PriceServiceConnection('https://hermes.pyth.network');

  const { isConnected } = useAccount();
  const { balance } = useContract();
  const navigate = useNavigate();
  const { open: connectWallet } = useWeb3Modal();

  const [currentPrice, setCurrentPrice] = useState(0);
  const [hasEnoughBalance, setHasEnoughBalance] = useState(true);
  const [predictionError, setPredictionError] = useState('');
  const predictionInput = useRef<HTMLInputElement>(null);

  const checkBalance = async () => {
    if (!pool || !isConnected) setHasEnoughBalance(true);
    else {
      const balanceOf = await balance(pool?.seeds.stakeToken);
      setHasEnoughBalance(
        balanceOf !== null && balanceOf >= pool?.seeds.stakeAmount
      );
    }
  };

  const handleClick = () => {
    if (!isConnected) return connectWallet();
    const val = predictionInput.current?.value;
    const toAppend = val ? `?prediction=${val}` : '';
    navigate(pool ? `/pool/${pool.poolId}${toAppend}` : '/pools');
  };

  const nextHour = () => {
    const now = new Date();
    const yrs = now.getFullYear();
    const months = now.getMonth();
    const date = now.getDate();
    const hrs = new Date().getHours();
    return new Date(yrs, months, date, hrs + 1, 0, 0)
      .toTimeString()
      .split(':')
      .slice(0, 2)
      .join(':');
  };

  const validatePrediction = () => {
    if (!predictionInput.current) return;
    const { valid, rangeUnderflow, stepMismatch, valueMissing } =
      predictionInput.current.validity;
    const error = valid
      ? ''
      : valueMissing
      ? 'Required'
      : rangeUnderflow
      ? '≥ 0'
      : stepMismatch
      ? '8 Decimals Max.'
      : predictionInput.current.validationMessage;
    setPredictionError(error);
  };

  useEffect(() => {
    checkBalance();
  }, [isConnected]);

  useEffect(() => {
    connection.subscribePriceFeedUpdates(
      [
        pool?.seeds.predictionTokenDetails.pythPriceId ??
          landingPageDefaults.pythPriceId
      ],
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
  }, [pool]);

  return (
    <div className="bg-app-bg rounded-[48px] px-4 xs:px-6 py-16 mb-20 md:py-24 md:mb-32">
      <h2 className="font-bold text-3xl md:text-4xl lg:text-5xl mb-4 text-center">
        Enter Predictions
      </h2>
      <p className="mb-12 max-md:max-w-lg md:max-w-[800px] mx-auto text-xl md:text-2xl text-center">
        Join Pools by predicting the price of a Pool Pair. You stake the Entry
        Fee into the Pool. The closest predictions to the price at the snapshot
        time are the winners.
      </p>

      <div className="flex flex-col gap-8 lg:flex-row mx-auto max-w-screen-lg">
        <div className="max-[414px]:p-4 p-8 rounded-[32px] bg-surface-subtle border border-border-default dark:border-surface-disabled max-lg:max-w-lg max-lg:mx-auto lg:basis-1/2">
          <div className="border border-border-default dark:border-surface-subtle p-6 rounded-[24px] w-full bg-app-bg">
            <h3 className="font-medium text-xl text-text-subtitle mb-4">
              Join Pool
            </h3>

            <p className="bg-surface-subtle rounded-2xl p-4 text-text-subtitle text-sm mb-6 ">
              Predict the price by Snapshot Time. This will add your prediction
              to the pool alongside with other predictions. You will stake the
              Entry Fee to predict. The predictions whose prices are closest to
              the price by{' '}
              {pool?.seeds.formattedSnapshotTime()[0] ?? nextHour()} will
              withdraw all the pool's money.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleClick();
              }}
            >
              <label>
                <span className="font-medium text-text-subtitle block mb-2">
                  Predict{' '}
                  {pool?.seeds.predictionTokenDetails.name ??
                    landingPageDefaults.pairToken}
                  's Price at Snapshot Time
                </span>
                <input
                  min={0}
                  step={10 ** (-1 * 8)}
                  type="number"
                  onChange={validatePrediction}
                  ref={predictionInput}
                  className="w-full border border-surface-subtle rounded-2xl py-2 px-3 mb-3 font-medium focus:outline-none text-xl  focus:valid:border-primary-default focus:invalid:border-errors-default"
                  placeholder="0 USD"
                  required
                />
                {predictionError && (
                  <p className="-mt-2 mb-3 text-sm text-errors-default">
                    {predictionError}
                  </p>
                )}
                {!!pool &&
                  pool.seeds.windowCloseTime >
                    Math.trunc(Date.now() / 1000) && (
                    <p className="font-medium text-text-disabled mb-8">
                      Pool Closes In&nbsp;&nbsp;
                      <CountdownNumbers
                        timestamp={pool.seeds.windowCloseTime}
                      />
                    </p>
                  )}
              </label>

              {isConnected && (
                <button
                  className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white disabled:bg-surface-disabled disabled:text-text-disabled"
                  disabled={!!predictionError}
                  type="submit"
                >
                  Make Prediction
                  {!predictionError && <Ripple />}
                </button>
              )}
            </form>

            {!isConnected && (
              <button
                className="w-full py-2 px-4 rounded-full font-medium border border-border-default dark:border-surface-subtle text-text-subtitle  p-ripple"
                onClick={() => connectWallet()}
              >
                Connect Wallet
                <Ripple />
              </button>
            )}
          </div>
        </div>

        <div className="max-[414px]:p-4 p-8 rounded-[32px] bg-surface-subtle border border-border-default dark:border-surface-disabled max-lg:max-w-lg max-lg:mx-auto w-full flex flex-col grow lg:basis-1/2">
          <div className="border border-border-default dark:border-surface-subtle bg-app-bg p-6 rounded-[24px] w-full flex flex-col grow">
            <h3 className="font-medium text-xl text-text-title mb-4">
              Make Prediction
            </h3>

            <p className="flex text-sm p-2 pl-4 mb-6 rounded-full items-center w-fit border border-border-default dark:border-surface-subtle">
              <span>Pool Pair</span>
              <span className="font-medium ml-4 p-2 px-4 rounded-full bg-primary-subtle text-primary-darker border border-surface-subtle">
                {pool?.seeds.pairName() ?? landingPageDefaults.pairName}
              </span>
            </p>

            <div className="py-3 px-5 rounded-2xl border border-border-default dark:border-surface-subtle flex gap-8 flex-wrap justify-center items-stretch text-center mb-8">
              <div>
                <p className="mb-2">Current Price</p>
                <p className="py-2 px-4 border border-border-default dark:border-surface-subtle rounded-full">
                  ${currentPrice}
                </p>
              </div>
              <div>
                <p className="mb-2">Your Prediction</p>
                <p className="py-2 px-4 border border-border-default dark:border-surface-subtle rounded-full">
                  ${predictionInput.current?.value ?? 0}
                </p>
              </div>
            </div>

            <button
              className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white disabled:bg-surface-disabled disabled:text-text-disabled mt-auto"
              onClick={handleClick}
            >
              Join Pool (
              {pool?.seeds.displayStake() ?? landingPageDefaults.stake})
              {hasEnoughBalance && <Ripple />}
            </button>

            {!hasEnoughBalance && (
              <p className="text-xs text-center mt-4 text-errors-default">
                Insufficient Balance. Please Top Up To Continue.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
