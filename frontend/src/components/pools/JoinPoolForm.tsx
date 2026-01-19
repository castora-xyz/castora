import { MakePredictionModal } from '@/components';
import { useFirebase } from '@/contexts';
import { Pool } from '@/schemas';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Dialog } from 'primereact/dialog';
import { Ripple } from 'primereact/ripple';
import { useEffect, useRef, useState } from 'react';
import { useConnection } from 'wagmi';

export const JoinPoolForm = ({
  pool,
  pool: { seeds },
  handlePredictionSuccess
}: {
  pool: Pool;
  handlePredictionSuccess: () => void;
}) => {
  const connection = new PriceServiceConnection('https://hermes.pyth.network');

  const { isConnected } = useConnection();
  const { recordEvent } = useFirebase();
  const { open: connectWallet } = useWeb3Modal();

  const [currentPrice, setCurrentPrice] = useState(0);
  const [predictionError, setPredictionError] = useState('');
  const [isShowingModal, setIsShowingModal] = useState(false);
  const [showModalHeading, setShowModalHeading] = useState(true);
  const predictionInput = useRef<HTMLInputElement>(null);

  const closeModal = ({ reset }: { reset: boolean }) => {
    document.body.classList.remove('overflow-hidden');
    setIsShowingModal(false);
    if (reset) {
      recordEvent('closed_make_prediction_modal', { poolId: pool.poolId });
      setPredictionError('');
      predictionInput.current!.value = '';
      setShowModalHeading(true);
    }
  };

  const submitForm = (e: any) => {
    e.preventDefault();
    if (validatePrediction()) return;

    if (!isConnected) connectWallet();
    else {
      document.body.classList.add('overflow-hidden');
      setIsShowingModal(true);
    }
    recordEvent('opened_make_prediction_modal', { poolId: pool.poolId });
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
    const searchParams = new URLSearchParams(window.location.search);
    const entered = searchParams.get('prediction');
    if (entered && predictionInput.current) {
      predictionInput.current.value = entered;
      predictionInput.current.focus();
      searchParams.delete('prediction');
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${!!`${searchParams}` ? `?${searchParams}` : ''}`
      );
    }

    connection.subscribePriceFeedUpdates([pool.seeds.predictionTokenDetails.pythPriceId], (priceFeed) => {
      const { price, expo } = priceFeed.getPriceUnchecked();
      setCurrentPrice(parseFloat((+price * 10 ** expo).toFixed(Math.abs(expo) < 8 ? Math.abs(expo) : 8)));
    });

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

    return () => connection.closeWebSocket();
  }, []);

  if (seeds.status() != 'Open') return <></>;

  return (
    <div className="border border-border-default dark:border-surface-subtle p-6 rounded-[24px] w-full mb-8">
      <h3 className="font-medium text-xl text-text-subtitle mb-4">Join Pool</h3>

      <ul className="list-primary-bullet bg-surface-subtle rounded-2xl p-4 pl-8 text-text-subtitle mb-6 list-disc">
        <li>
          Predict {seeds.predictionTokenDetails.name}'s Price for{' '}
          <span className="font-bold">{seeds.formattedSnapshotTime().reverse().join(' ')}</span> with{' '}
          <span className="font-bold">{seeds.displayStake()}</span> stake.
        </li>
        <li>
          Winner Predictions are <span className="font-bold">Earliest & Closest </span> Prices to Snapshot Price.
        </li>
        <li>
          Win x{pool.seeds.multiplier} (<span className="font-bold">{seeds.displayStake(pool.seeds.multiplier)}</span>
          ), if you are in Top <span className="font-bold">{pool.percentWinners()}%</span> Predictions.
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
            onBlur={(e) => recordEvent('entered_prediction_price', { price: e.target.value })}
            ref={predictionInput}
            id="prediction-input"
            className="w-full border border-surface-subtle rounded-2xl py-2 px-3 mb-2 font-medium focus:outline-none text-xl focus:valid:border-primary-default focus:invalid:border-errors-default"
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
            onClick={(e) => submitForm(e)}
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

      <Dialog
        visible={isShowingModal}
        onHide={() => closeModal({ reset: false })}
        unstyled={true}
        header={<h4 className="font-medium text-xl text-text-title mr-2">Make Prediction</h4>}
        pt={{
          root: {
            className: 'bg-app-bg mx-8 xs:mx-auto max-w-sm p-6 rounded-2xl'
          },
          header: {
            className: showModalHeading ? 'flex justify-between mb-4' : 'hidden'
          },
          mask: { className: 'bg-black/50 dark:bg-white/20' }
        }}
      >
        <MakePredictionModal
          pool={pool}
          price={+(predictionInput.current?.value ?? 0)}
          handleShowHeading={setShowModalHeading}
          handleClose={() => closeModal({ reset: true })}
          handlePredictionSuccess={handlePredictionSuccess}
        />
      </Dialog>
    </div>
  );
};
