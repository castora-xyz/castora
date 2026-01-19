import Globe from '@/assets/globe.svg?react';
import LinkIcon from '@/assets/link.svg?react';
import Timer from '@/assets/timer.svg?react';
import { CountdownNumbers, CreatePoolModal } from '@/components';
import { allowedCreatorPredTokens, CreatePoolForm, useCurrentTime, useFirebase, useToast } from '@/contexts';
import { tokens } from '@/schemas';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import ms from 'ms';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConnection } from 'wagmi';

const formDefaults: CreatePoolForm = {
  predictionToken: 'MON',
  stakeToken: 'MON',
  stakeAmount: '100',
  windowCloseTime: null,
  snapshotTime: null,
  multiplier: 'x2',
  visibility: 'public'
};

const CountdownBadgePreview = ({ timestamp }: { timestamp: number }) => {
  const { now } = useCurrentTime();
  const [diff, setDiff] = useState(timestamp - now);

  useEffect(() => {
    setDiff(timestamp - now);
  }, [now, timestamp]);

  return (
    <div className="py-1.5 px-4 mb-4 font-medium rounded-full w-fit text-sm sm:text-md border  border-primary-lighter bg-primary-subtle text-primary-darker">
      {diff <= 0 ? <>00h : 00m : 00s</> : <CountdownNumbers timestamp={timestamp} />}
    </div>
  );
};

export const CreateCommunityPoolPage = () => {
  const [isShowingModal, setIsShowingModal] = useState(false);
  const [showModalHeading, setShowModalHeading] = useState(true);
  const { isConnected } = useConnection();
  const { open: connectWallet } = useWeb3Modal();
  const { recordEvent } = useFirebase();
  const { toastError } = useToast();
  const [form, setForm] = useState<CreatePoolForm>({ ...formDefaults });
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const windowCloseRef = useRef<Calendar>(null);
  const snapshotRef = useRef<Calendar>(null);

  const multiplierOptions = [
    { label: '2x (50% winners)', value: 'x2' },
    { label: '3x (33% winners)', value: 'x3' },
    { label: '4x (25% winners)', value: 'x4' },
    { label: '5x (20% winners)', value: 'x5' },
    { label: '10x (10% winners)', value: 'x10' }
  ];

  const stakeAmountOptions = ['100', '200', '500', '1000', '2000', '5000'];

  const visibilityOptions = [
    { label: 'Public (Default)', value: 'public' },
    { label: 'Unlisted', value: 'unlisted' }
  ];

  const stakeTokenOptions = [
    { label: 'MON', value: 'MON' }
    // { label: 'USDC', value: 'USDC' }
  ];

  const predictionTokenOptions = tokens
    .filter((t) => allowedCreatorPredTokens.includes(t.name))
    .map((token) => ({
      label: `${token.name} - ${token.fullName}`,
      value: token.name
    }));

  useEffect(() => {
    document.title = 'Create Pool | Castora';
  }, []);

  const validateForm = (f: CreatePoolForm = form): boolean => {
    const newErrors: Record<string, string> = {};
    const now = new Date();

    if (!f.predictionToken) newErrors.predictionToken = 'Required';
    if (!f.stakeToken) newErrors.stakeToken = 'Required';
    if (!f.stakeAmount) newErrors.stakeAmount = 'Required';
    if (!f.windowCloseTime) newErrors.windowCloseTime = 'Required';
    if (!f.snapshotTime) newErrors.snapshotTime = 'Required';
    if (!f.multiplier) newErrors.multiplier = 'Required';
    if (!f.visibility) newErrors.visibility = 'Required';

    if (f.windowCloseTime && f.windowCloseTime <= now) {
      newErrors.windowCloseTime = 'Window close time must be in the future';
    }

    if (f.snapshotTime) {
      if (f.snapshotTime <= now) {
        newErrors.snapshotTime = 'Snapshot time must be in the future';
      }
      if (f.windowCloseTime && f.snapshotTime < f.windowCloseTime) {
        newErrors.snapshotTime = 'Snapshot time must be after window close time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onChangeCheckForm = (newForm: CreatePoolForm) => {
    if (
      newForm.windowCloseTime !== form.windowCloseTime ||
      newForm.snapshotTime !== form.snapshotTime ||
      hasAttemptedSubmit
    ) {
      validateForm(newForm);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    if (!validateForm()) {
      toastError('Kindly Fix the Form Errors');
      return;
    }

    if (!isConnected) connectWallet();
    else {
      document.body.classList.add('overflow-hidden');
      setIsShowingModal(true);
      recordEvent(`opened_create_pool_modal`);
    }
  };

  const formatTimeToNearest5Minutes = (date: Date): Date => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
    const newDate = new Date(date);
    newDate.setMinutes(roundedMinutes, 0, 0);
    return newDate;
  };

  const closeModal = ({ reset }: { reset: boolean }) => {
    document.body.classList.remove('overflow-hidden');
    setIsShowingModal(false);
    recordEvent('closed_create_pool_modal');
    if (reset) setShowModalHeading(true);
  };

  return (
    <div className="flex flex-col justify-center grow bg-surface-subtle px-4 sm:px-8 pt-20 pb-28">
      <div className="bg-app-bg w-full max-lg:max-w-xl lg:max-w-(--breakpoint-lg) mx-auto px-4 sm:px-8 lg:px-10 lg:pt-12 lg:pb-24 rounded-3xl py-8 border border-border-default dark:border-surface-subtle lg:flex">
        <div className="lg:mr-20">
          <h1 className="text-3xl font-bold mb-2 text-text-title">Create Pool</h1>
          <p className="text-text-subtitle mb-8">Create a pool for anyone to predict in and join.</p>

          <div className="lg:hidden">
            <h2 className="text-2xl mb-2 text-text-title">How it Works</h2>

            <ul className="list-primary-bullet bg-surface-subtle rounded-2xl p-4 pl-8 text-text-subtitle mb-12 list-disc sm:text-lg">
              <li>
                Pay
                <span className="font-bold"> 100 MON </span> to create a pool.
              </li>
              <li>
                Gain <span className="font-bold">30% </span>of Pool Fees at settlement.
              </li>
              <li>Withdraw your gains at anytime.</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 lg:w-[414px]">
            {/* Prediction Token */}
            <div>
              <label className="block text-sm font-medium mb-2 text-text-title">Prediction Pair (Token) *</label>
              <Dropdown
                value={form.predictionToken}
                onChange={(e) => {
                  setForm({ ...form, predictionToken: e.value });
                  onChangeCheckForm({ ...form, predictionToken: e.value });
                }}
                options={predictionTokenOptions}
                placeholder="Select prediction token"
                className="w-full"
                filter
                pt={{
                  root: { className: 'w-full bg-surface-subtle' },
                  panel: { className: 'bg-app-bg' },
                  header: { className: 'bg-app-bg' }
                }}
              />
              {errors.predictionToken && <Message severity="error" text={errors.predictionToken} className="mt-2" />}
            </div>

            {/* Stake Token */}
            <div>
              <label className="block text-sm font-medium mb-2 text-text-title">Stake Token *</label>
              <Dropdown
                value={form.stakeToken}
                onChange={(e) => {
                  setForm({ ...form, stakeToken: e.value });
                  onChangeCheckForm({ ...form, stakeToken: e.value });
                }}
                options={stakeTokenOptions}
                placeholder="Select stake token"
                className="w-full"
                pt={{
                  root: { className: 'w-full bg-surface-subtle' },
                  panel: { className: 'bg-app-bg' }
                }}
              />
              {errors.stakeToken && <Message severity="error" text={errors.stakeToken} className="mt-2" />}
            </div>

            {/* Stake Amount */}
            <div>
              <label className="block text-sm font-medium mb-2 text-text-title">Stake Amount *</label>
              <Dropdown
                value={form.stakeAmount}
                onChange={(e) => {
                  setForm({ ...form, stakeAmount: e.value });
                  onChangeCheckForm({ ...form, stakeAmount: e.value });
                }}
                options={stakeAmountOptions}
                placeholder="Select stake amount"
                className="w-full"
                pt={{
                  root: { className: 'w-full bg-surface-subtle' },
                  panel: { className: 'bg-app-bg' }
                }}
              />
              {errors.stakeAmount && <Message severity="error" text={errors.stakeAmount} className="mt-2" />}
            </div>

            {/* Window Close Time */}
            <div>
              <label className="block text-sm font-medium mb-2 text-text-title">Window Close Time *</label>
              <Calendar
                ref={windowCloseRef}
                value={form.windowCloseTime}
                onChange={(e) => {
                  const date = e.value as Date | null;
                  const newForm = { ...form, windowCloseTime: date ? formatTimeToNearest5Minutes(date) : null };
                  if (
                    newForm.snapshotTime &&
                    newForm.windowCloseTime &&
                    newForm.snapshotTime <= newForm.windowCloseTime
                  ) {
                    newForm.snapshotTime = null;
                  }
                  setForm(newForm);
                  validateForm(newForm);
                }}
                showTime
                hourFormat="24"
                stepMinute={5}
                minDate={new Date()}
                placeholder="Select date and time"
                dateFormat="dd/mm/yy"
                timeOnly={false}
                showIcon
                iconPos="right"
                inputClassName={`w-full p-3 rounded-md bg-surface-subtle cursor-pointer border transition-colors ${
                  errors.windowCloseTime
                    ? 'border-errors-default hover:border-errors-default focus:border-errors-default focus:ring-2! focus:!ring-errors-default'
                    : 'border-border-default hover:border-primary-default focus:border-primary-default focus:ring-2! focus:!ring-primary-default'
                } focus:ring-offset-0!`}
                className="w-full"
                pt={{
                  root: { className: 'w-full' },
                  panel: { className: 'bg-app-bg border border-border-default' },
                  header: { className: 'bg-app-bg' },
                  input: {
                    root: {
                      className: 'w-full shadow-none! focus:shadow-none!'
                    }
                  }
                }}
              />
              {form.windowCloseTime && !errors.windowCloseTime && (
                <p className="text-xs text-text-subtitle mt-1">
                  Selected:{' '}
                  {form.windowCloseTime.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </p>
              )}
              {errors.windowCloseTime && <Message severity="error" text={errors.windowCloseTime} className="mt-2" />}
            </div>

            {/* Snapshot Time */}
            <div>
              <label className="block text-sm font-medium mb-2 text-text-title">Snapshot Time *</label>
              <Calendar
                ref={snapshotRef}
                value={form.snapshotTime}
                onChange={(e) => {
                  const date = e.value as Date | null;
                  const newForm = { ...form, snapshotTime: date ? formatTimeToNearest5Minutes(date) : null };
                  setForm(newForm);
                  onChangeCheckForm(newForm);
                }}
                showTime
                hourFormat="24"
                stepMinute={5}
                minDate={form.windowCloseTime || new Date()}
                placeholder="Select date and time"
                dateFormat="dd/mm/yy"
                timeOnly={false}
                showIcon
                iconPos="right"
                inputClassName={`w-full p-3 rounded-md bg-surface-subtle cursor-pointer border transition-colors ${
                  errors.snapshotTime
                    ? 'border-errors-default hover:border-errors-default focus:border-errors-default focus:ring-2! focus:!ring-errors-default'
                    : 'border-border-default hover:border-primary-default focus:border-primary-default focus:ring-2! focus:!ring-primary-default'
                } focus:ring-offset-0! ${!form.windowCloseTime ? 'opacity-50 cursor-not-allowed' : ''}`}
                className="w-full"
                disabled={!form.windowCloseTime}
                pt={{
                  root: { className: 'w-full' },
                  panel: { className: 'bg-app-bg border border-border-default' },
                  header: { className: 'bg-app-bg' },
                  input: {
                    root: {
                      className: 'w-full shadow-none! focus:shadow-none!'
                    }
                  }
                }}
              />
              {!form.windowCloseTime && (
                <p className="text-xs text-text-subtitle mt-1">Please select Window Close Time first</p>
              )}
              {form.snapshotTime && !errors.snapshotTime && (
                <p className="text-xs text-text-subtitle mt-1">
                  Selected:{' '}
                  {form.snapshotTime.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </p>
              )}
              {errors.snapshotTime && <Message severity="error" text={errors.snapshotTime} className="mt-2" />}
            </div>

            {/* Pool Multiplier */}
            <div>
              <label className="block text-sm font-medium mb-2 text-text-title">Pool Multiplier *</label>
              <Dropdown
                value={form.multiplier}
                onChange={(e) => {
                  setForm({ ...form, multiplier: e.value });
                  onChangeCheckForm({ ...form, multiplier: e.value });
                }}
                options={multiplierOptions}
                placeholder="Select multiplier"
                className="w-full"
                pt={{
                  root: { className: 'w-full bg-surface-subtle' },
                  panel: { className: 'bg-app-bg' }
                }}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium mb-2 text-text-title">Visibility *</label>
              <Dropdown
                value={form.visibility}
                onChange={(e) => {
                  setForm({ ...form, visibility: e.value });
                  onChangeCheckForm({ ...form, visibility: e.value });
                }}
                options={visibilityOptions}
                placeholder="Select visibility"
                className="w-full"
                pt={{
                  root: { className: 'w-full bg-surface-subtle' },
                  panel: { className: 'bg-app-bg' }
                }}
              />
            </div>
          </form>
        </div>

        <div className="mt-10 lg:w-max">
          <div className="lg:block hidden">
            <h2 className="text-2xl mb-2 text-text-title">How it Works</h2>
            <ul className="list-primary-bullet bg-surface-subtle rounded-2xl p-4 pl-8 text-text-subtitle mb-8 list-disc text-lg px-8">
              <li>
                Pay
                <span className="font-bold"> 100 MON </span> to create a pool.
              </li>
              <li>
                Gain <span className="font-bold">30% </span>of Pool Fees at settlement.
              </li>
              <li>Withdraw your gains at anytime.</li>
            </ul>
          </div>

          <div className="lg:w-80">
            <h2 className="text-2xl mb-3 text-text-title">Preview</h2>

            <div className="border border-border-default dark:border-surface-subtle p-5 rounded-2xl w-full max-w-sm mb-12">
              <div className="flex justify-between">
                <div className="flex p-2 pl-4 mb-4 rounded-full items-center  bg-surface-subtle w-fit">
                  <div className="text-sm md:text-md">Pool ID: ---</div>
                  <div className={'ml-6 text-xs md:text-sm p-2 px-4 rounded-full  bg-success-default text-white'}>
                    Open
                  </div>
                </div>

                <div>
                  <Tooltip target="#preview-pool-life" />
                  {!form.windowCloseTime || form.windowCloseTime.getTime() < Date.now() ? (
                    <Timer
                      id="preview-pool-life"
                      className="w-5 h-5 mt-1 -mr-1 fill-primary-default"
                      data-pr-tooltip="Pool Life"
                    />
                  ) : (
                    <span
                      id="preview-pool-life"
                      className="text-sm text-primary-default mt-1 inline-block"
                      data-pr-tooltip="Pool Life"
                    >
                      {ms(form.windowCloseTime.getTime() - Date.now())}
                    </span>
                  )}

                  <Tooltip target="#preview-pool-visibility" />
                  {form.visibility == 'unlisted' ? (
                    <LinkIcon
                      id="preview-pool-visibility"
                      className="mt-5 w-5 h-5 -mr-1 text-primary-default"
                      data-pr-tooltip="Unlisted"
                    />
                  ) : (
                    <Globe
                      id="preview-pool-visibility"
                      className="mt-5 w-5 h-5 -mr-1 text-primary-default"
                      data-pr-tooltip="Public"
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-2.5 items-start mb-4">
                {form.predictionToken ? (
                  <img src={`/assets/${form.predictionToken.toLowerCase()}.png`} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-surface-subtle"></div>
                )}
                <div className="font-medium text-2xl text-text-title">
                  {!!form.predictionToken ? form.predictionToken : '---'}/USD
                </div>
              </div>

              <div className="text-xs md:text-sm text-text-subtitle mb-2">
                Pool <span className="font-black">Closes</span> In
              </div>

              <CountdownBadgePreview
                timestamp={form.windowCloseTime ? Math.trunc(form.windowCloseTime.getTime() / 1000) : 0}
              />
              <div className="flex justify-between font-medium text-sm md:text-md text-text-subtitle mb-3">
                <span className="mr-4">Entry Fee</span>
                {form.stakeToken && form.stakeAmount && (
                  <div className="flex w-fit items-center -mt-1">
                    <img src={`/assets/${form.stakeToken.toLowerCase()}.png`} className="w-6 h-6 rounded-full mr-2" />
                    <span>{form.stakeAmount + ' ' + form.stakeToken}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between font-medium text-sm md:text-md text-text-subtitle mb-4">
                <span className="mr-4">Multiplier</span>
                <span className="font-bold text-base -mt-1">{form.multiplier}</span>
              </div>
            </div>

            <div className="lg:flex lg:justify-center">
              <div className="w-full lg:max-w-80 lg:-mr-24">
                <p className="text-xs text-text-subtitle mb-3 text-center">
                  By creating this pool, you agree to our{' '}
                  <Link to="/terms" className="text-primary-default underline hover:text-primary-darker">
                    Terms of Service
                  </Link>
                </p>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full py-3 px-6 rounded-full bg-primary-default text-white font-medium p-ripple disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Pool
                  <Ripple />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        visible={isShowingModal}
        onHide={() => closeModal({ reset: false })}
        unstyled={true}
        header={<h4 className="font-medium text-xl text-text-title mr-2">Summary</h4>}
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
        <CreatePoolModal
          form={form}
          handleShowHeading={setShowModalHeading}
          handleClose={() => closeModal({ reset: true })}
          handleCreationSuccess={() => {
            setForm({ ...formDefaults });
            setHasAttemptedSubmit(false);
          }}
        />
      </Dialog>
    </div>
  );
};
