import { MAX_BULK_PREDICTIONS, useContract } from '@/contexts';
import { Pool, landingPageDefaults } from '@/schemas';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import { useAppKit } from '@reown/appkit/react';
import { InputNumber } from 'primereact/inputnumber';
import { Ripple } from 'primereact/ripple';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection } from 'wagmi';

export const LandingPredictionsSection = ({ pool }: { pool: Pool | null }) => {
  const connection = new PriceServiceConnection('https://hermes.pyth.network');

  const { isConnected } = useConnection();
  const { balance } = useContract();
  const navigate = useNavigate();
  const { open: connectWallet } = useAppKit();

  const [bulkCount, setBulkCount] = useState(2);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [hasEnoughBalance, setHasEnoughBalance] = useState(true);
  const [predictionError, setPredictionError] = useState('');
  const predictionInput = useRef<HTMLInputElement>(null);

  const checkBalance = async () => {
    if (!pool || !isConnected) setHasEnoughBalance(true);
    else {
      const balanceOf = await balance(pool?.seeds.stakeToken);
      setHasEnoughBalance(balanceOf !== null && balanceOf >= pool?.seeds.stakeAmount * bulkCount);
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
    return new Date(yrs, months, date, hrs + 1, 0, 0).toTimeString().split(':').slice(0, 2).join(':');
  };

  const validatePrediction = () => {
    if (!predictionInput.current) return;
    const { valid, rangeUnderflow, stepMismatch, valueMissing } = predictionInput.current.validity;
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
    return error;
  };

  useEffect(() => {
    checkBalance();
  }, [isConnected]);

  useEffect(() => {
    connection.subscribePriceFeedUpdates(
      [pool?.seeds.predictionTokenDetails.pythPriceId ?? landingPageDefaults.pythPriceId],
      (priceFeed) => {
        const { price, expo } = priceFeed.getPriceUnchecked();
        const parsed = +price * 10 ** expo;
        setCurrentPrice(parseFloat(parsed.toFixed(parsed < 1 ? 8 : 3)));
      }
    );
    return () => connection.closeWebSocket();
  }, [pool]);

  useEffect(() => {
    setTimeout(() => {
      const input = document.querySelector('input#prediction-input[type=number]') as HTMLInputElement;
      input.addEventListener(
        'keydown',
        (e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
        },
        { passive: false }
      );
      input.addEventListener('wheel', (e) => e.preventDefault(), {
        passive: false
      });
    });
  }, []);

  return (
    <div className="bg-app-bg rounded-[48px] px-4 xs:px-6 py-16 mb-20 md:py-24 md:mb-32">
      <h2 className="font-bold text-3xl md:text-4xl lg:text-5xl mb-4 text-center">Enter Predictions</h2>
      <p className="mb-12 max-md:max-w-lg md:max-w-[800px] mx-auto text-xl md:text-2xl text-center">
        Join Pools by predicting the price of a Pool Pair. You stake the Entry Fee as you join. The earliest & closest
        predictions to the price at the snapshot time (Snapshot Price) are the winners.
      </p>

      <div className="flex flex-col gap-8 lg:flex-row mx-auto max-w-(--breakpoint-lg)">
        <div className="max-[414px]:p-4 p-8 rounded-[32px] bg-surface-subtle border border-border-default dark:border-surface-disabled max-lg:max-w-lg max-lg:mx-auto lg:basis-1/2">
          <div className="border border-border-default dark:border-surface-subtle p-6 rounded-[24px] w-full bg-app-bg">
            <h3 className="font-medium text-xl text-text-subtitle mb-4">Join Pool</h3>

            <ul className="list-primary-bullet bg-surface-subtle rounded-2xl p-4 pl-8 text-text-subtitle mb-6 list-disc">
              <li>
                Predict {pool?.seeds.predictionTokenDetails.name ?? landingPageDefaults.pairToken}
                's Price for{' '}
                <span className="font-bold">
                  {pool?.seeds.formattedSnapshotTime().reverse().join(' ') ?? nextHour()}
                </span>{' '}
                with{' '}
                <span className="font-bold">{pool?.seeds.displayStake() ?? landingPageDefaults.stake(bulkCount)}</span>{' '}
                stake.
              </li>
              <li>
                Winner Predictions are <span className="font-bold">Earliest & Closest </span> Prices to Snapshot Price.
              </li>
              <li>
                Win x{pool?.seeds.multiplier ?? 3} (
                <span className="font-bold">
                  {pool?.seeds.displayStake(pool?.seeds.multiplier) ?? landingPageDefaults.stakeMultiplied(bulkCount)}
                </span>
                ), if you are in Top{' '}
                <span className="font-bold">{pool?.percentWinners() ?? landingPageDefaults.percentWinners}%</span>{' '}
                Predictions.
              </li>
            </ul>

            <form>
              <label>
                <span className="font-medium text-sm text-text-disabled block mb-1">Your Prediction</span>

                <input
                  min={0}
                  step={10 ** (-1 * 8)}
                  type="number"
                  onChange={validatePrediction}
                  ref={predictionInput}
                  id="prediction-input"
                  className="w-full border border-surface-subtle rounded-2xl py-2 px-3 mb-2 font-medium focus:outline-none text-xl  focus:valid:border-primary-default focus:invalid:border-errors-default"
                  placeholder="0.00 USD"
                  required
                />

                {predictionError && <p className="-mt-1 mb-3 text-sm text-errors-default">{predictionError}</p>}

                <p className="font-medium mb-8">
                  <span className="text-text-disabled">Current Price:</span>{' '}
                  <span className="text-primary-darker dark:text-primary-subtle">{currentPrice}</span>
                </p>
              </label>

              {isConnected && (
                <button
                  className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white whitespace-nowrap"
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    if (validatePrediction()) return;
                    handleClick();
                  }}
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
            <h3 className="font-medium text-xl text-text-title mb-4">Make Prediction</h3>

            <p className="flex text-sm p-2 pl-4 mb-6 rounded-full items-center w-fit border border-border-default dark:border-surface-subtle">
              <span>Pool Pair</span>
              <span className="font-medium ml-4 p-2 px-4 rounded-full bg-primary-subtle text-primary-darker border border-surface-subtle">
                {pool?.seeds.pairName() ?? landingPageDefaults.pairName}
              </span>
            </p>

            <div className="py-3 px-5 rounded-2xl border border-border-default dark:border-surface-subtle flex gap-8 flex-wrap justify-center items-stretch text-center mb-6">
              <div>
                <p className="mb-2">Your Prediction</p>
                <p className="py-2 px-4 border border-border-default dark:border-surface-subtle rounded-full">
                  ${predictionInput.current?.value ?? 0}
                </p>
              </div>
              <div>
                <p className="mb-2">Current Price</p>
                <p className="py-2 px-4 border border-border-default dark:border-surface-subtle rounded-full">
                  ${currentPrice}
                </p>
              </div>
            </div>

            <div className="py-3 px-3 mb-6 rounded-2xl border border-border-default dark:border-surface-subtle flex max-xs:flex-wrap gap-4">
              <div>
                <p className="pl-1 mb-2 text-xs">How many times?</p>
                <InputNumber
                  className="border border-surface-subtle rounded-xl text-lg font-medium"
                  inputClassName="w-16 focus:shadow! focus:shadow-transparent! pl-4"
                  allowEmpty={false}
                  pt={{
                    incrementButton: {
                      className: 'text-primary-default bg-surface-subtle py-1'
                    },
                    decrementButton: {
                      className: 'text-primary-default bg-surface-subtle py-1'
                    }
                  }}
                  value={bulkCount}
                  onChange={(e) =>
                    setBulkCount(e.value ? (e.value > MAX_BULK_PREDICTIONS ? MAX_BULK_PREDICTIONS : e.value) : 1)
                  }
                  onValueChange={(e) => setBulkCount(e.value ?? 1)}
                  showButtons
                  min={1}
                  max={100}
                />
              </div>
              <ul className="list-primary-bullet pl-4 text-text-subtitle list-disc text-sm w-fit">
                <li>
                  Makes <span className="font-bold text-base text-primary-default">{bulkCount}</span> predictions.
                </li>
                <li>
                  Each at
                  <span className="font-bold text-base text-primary-default">
                    {' '}
                    ${predictionInput.current?.value ?? 0}{' '}
                  </span>{' '}
                  Price.
                </li>
                <li>
                  Each for{' '}
                  <span className="font-bold text-base text-primary-default">
                    {pool?.seeds.displayStake(pool?.seeds.multiplier ?? 3 * bulkCount) ??
                      landingPageDefaults.stakeMultiplied(bulkCount)}{' '}
                  </span>
                  stake.
                </li>
              </ul>
            </div>

            <button
              className="w-full py-2 px-4 rounded-full font-medium p-ripple bg-primary-default text-white disabled:bg-surface-disabled disabled:text-text-disabled mt-auto"
              onClick={handleClick}
            >
              Join Pool ({pool?.seeds.displayStake(bulkCount) ?? landingPageDefaults.stake(bulkCount)})
              {hasEnoughBalance && <Ripple />}
            </button>

            <p className="mt-1 text-center">
              <span className="text-xs">Potential Winnings </span>
              <span className="text-sm font-bold text-primary-default">
                (x{pool?.seeds.multiplier ?? landingPageDefaults.multiplier}):{' '}
                {pool?.seeds.displayStake(pool?.seeds.multiplier * bulkCount) ??
                  landingPageDefaults.stakeMultiplied(bulkCount)}
              </span>
            </p>

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
