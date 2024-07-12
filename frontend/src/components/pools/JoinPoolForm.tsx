import { CountdownNumbers, MakePredictionModal } from '@/components';
import { useFirebase } from '@/contexts';
import { Pool } from '@/schemas';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Dialog } from 'primereact/dialog';
import { Ripple } from 'primereact/ripple';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

export const JoinPoolForm = ({ pool, pool: { seeds } }: { pool: Pool }) => {
  const { isConnected } = useAccount();
  const { recordEvent } = useFirebase();
  const { open: connectWallet } = useWeb3Modal();

  const [predictionError, setPredictionError] = useState('');
  const [isShowingModal, setIsShowingModal] = useState(false);
  const [showModalHeading, setShowModalHeading] = useState(true);
  const predictionInput = useRef<HTMLInputElement>(null);

  const closeModal = (reset = false) => {
    document.body.classList.remove('overflow-hidden');
    setIsShowingModal(false);
    if (reset) {
      setPredictionError('');
      predictionInput.current!.value = '';
      setShowModalHeading(true);
    }
    recordEvent('closed_make_prediction_modal', { poolId: pool.poolId });
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
    const searchParams = new URLSearchParams(window.location.search);
    const entered = searchParams.get('prediction');
    if (entered && predictionInput.current) {
      predictionInput.current.value = entered;
      predictionInput.current.focus();
      searchParams.delete('prediction');
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${
          !!`${searchParams}` ? `?${searchParams}` : ''
        }`
      );
    }
  }, []);

  if (seeds.status() != 'Open') return <></>;

  return (
    <div className="border border-border-default dark:border-surface-subtle p-6 rounded-[24px] w-full mb-8">
      <h3 className="font-medium text-xl text-text-subtitle mb-4">Join Pool</h3>

      <p className="bg-surface-subtle rounded-2xl p-4 text-text-subtitle text-sm mb-6 ">
        Predict the price by Snapshot Time. This will add your prediction to the
        pool alongside with other predictions. You will stake the Entry Fee to
        predict. The predictions whose prices are closest to the price by{' '}
        {seeds.formattedSnapshotTime()[0]} will withdraw all the pool's money.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isConnected) connectWallet();
          else {
            document.body.classList.add('overflow-hidden');
            setIsShowingModal(true);
            recordEvent('opened_make_prediction_modal', {
              poolId: pool.poolId
            });
          }
        }}
      >
        <label>
          <span className="font-medium text-text-subtitle block mb-2">
            Predict {seeds.predictionTokenDetails.name}'s Price at Snapshot Time
          </span>
          <input
            min={0}
            step={10 ** (-1 * 8)}
            type="number"
            onChange={validatePrediction}
            onBlur={(e) =>
              recordEvent('entered_prediction_price', { price: e.target.value })
            }
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
          <p className="font-medium text-text-disabled mb-8">
            Pool Closes In&nbsp;&nbsp;
            <CountdownNumbers timestamp={seeds.windowCloseTime} />
          </p>
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

      <Dialog
        visible={isShowingModal}
        onHide={closeModal}
        unstyled={true}
        header={
          <h4 className="font-medium text-xl text-text-title mr-2">
            Make Prediction
          </h4>
        }
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
          handleClose={() => closeModal(true)}
        />
      </Dialog>
    </div>
  );
};
