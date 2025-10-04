import { tokens } from '@/schemas';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Ripple } from 'primereact/ripple';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

interface CreatePoolForm {
  predictionToken: string;
  stakeToken: string;
  stakeAmount: string;
  windowCloseTime: Date | null;
  snapshotTime: Date | null;
  multiplier: string;
  visibility: string;
}

const formDefaults = {
  predictionToken: '',
  stakeToken: 'MON',
  stakeAmount: '1',
  windowCloseTime: null,
  snapshotTime: null,
  multiplier: 'x2',
  visibility: 'unlisted'
};

export const CreateCommunityPoolPage = () => {
  const { isConnected } = useAccount();
  const { open: connectWallet } = useWeb3Modal();
  const [form, setForm] = useState<CreatePoolForm>({ ...formDefaults });
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPoolId, setCreatedPoolId] = useState<string>('');
  const windowCloseRef = useRef<Calendar>(null);
  const snapshotRef = useRef<Calendar>(null);

  const multiplierOptions = [
    { label: '2x (50% winners)', value: 'x2' },
    { label: '3x (33% winners)', value: 'x3' },
    { label: '4x (25% winners)', value: 'x4' },
    { label: '5x (20% winners)', value: 'x5' },
    { label: '10x (10% winners)', value: 'x10' }
  ];

  const stakeAmountOptions = ['0.2', '0.5', '1', '1.5', '2', '2.5', '5', '10'];

  const visibilityOptions = [
    { label: 'Unlisted (Default)', value: 'unlisted' },
    { label: 'Public', value: 'public' }
  ];

  const stakeTokenOptions = [
    { label: 'MON', value: 'MON' }
    // { label: 'USDC', value: 'USDC' }
  ];

  const predictionTokenOptions = tokens
    .filter((t) => ['BTC', 'ETH', 'SOL', 'HYPE', 'PUMP'].includes(t.name))
    .map((token) => ({
      label: `${token.name} - ${token.fullName}`,
      value: token.name
    }));

  useEffect(() => {
    document.title = 'Create Community Pool | Castora';
  }, []);

  const validateForm = (f: CreatePoolForm = form): boolean => {
    const newErrors: Record<string, string> = {};

    if (!f.predictionToken) newErrors.predictionToken = 'Required';
    if (!f.stakeToken) newErrors.stakeToken = 'Required';
    if (!f.stakeAmount) newErrors.stakeAmount = 'Required';
    if (!f.windowCloseTime) newErrors.windowCloseTime = 'Required';
    if (!f.snapshotTime) newErrors.snapshotTime = 'Required';
    if (!f.multiplier) newErrors.multiplier = 'Required';
    if (!f.visibility) newErrors.visibility = 'Required';

    if (f.windowCloseTime && f.snapshotTime) {
      if (f.windowCloseTime >= f.snapshotTime) {
        newErrors.snapshotTime = 'Snapshot time must be after window close time';
      }
      if (f.windowCloseTime <= new Date()) {
        newErrors.windowCloseTime = 'Window close time must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onChangeCheckForm = (newForm: CreatePoolForm) => {
    if (!hasAttemptedSubmit) return;
    validateForm(newForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // TODO: Implement actual pool creation logic
      // This would involve calling the smart contract
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

      setCreatedPoolId('12345'); // This would come from the contract
      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating pool:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeToNearest5Minutes = (date: Date): Date => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
    const newDate = new Date(date);
    newDate.setMinutes(roundedMinutes, 0, 0);
    return newDate;
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col justify-center items-center grow py-20">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-app-bg rounded-3xl p-8 text-center border border-border-default dark:border-surface-subtle">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-green-600 dark:text-green-400">✓</span>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-text-title">Pool Created Successfully!</h1>
            <p className="text-text-subtitle mb-6">
              Your community pool has been created with ID: <span className="font-mono font-bold">{createdPoolId}</span>
            </p>
            <div className="space-y-3">
              <a
                href={`/pool/${createdPoolId}`}
                className="block w-full py-3 px-6 rounded-full bg-primary-default text-white font-medium p-ripple"
              >
                View Pool
                <Ripple />
              </a>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setForm({ ...formDefaults });
                  setHasAttemptedSubmit(false);
                }}
                className="block w-full py-3 px-6 rounded-full border border-border-default dark:border-surface-subtle text-text-subtitle font-medium p-ripple"
              >
                Create Another Pool
                <Ripple />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center grow bg-surface-subtle pt-20 pb-28">
      <div className="w-full max-w-xl mx-auto px-4">
        <div className="bg-app-bg rounded-3xl p-8 border border-border-default dark:border-surface-subtle">
          <h1 className="text-3xl font-bold mb-2 text-text-title">Create Community Pool</h1>
          <p className="text-text-subtitle mb-8">Create a custom pool for anyone in the community to join.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <button className="w-full" onClick={() => windowCloseRef.current?.show()} type="button">
                <Calendar
                  readOnlyInput
                  dateFormat="D dd M yy  "
                  ref={windowCloseRef}
                  value={form.windowCloseTime}
                  onFocus={() => windowCloseRef.current?.show()}
                  onChange={(e) => {
                    const date = e.value as Date | null;
                    if (date) {
                      setForm({ ...form, windowCloseTime: formatTimeToNearest5Minutes(date) });
                      onChangeCheckForm({ ...form, windowCloseTime: formatTimeToNearest5Minutes(date) });
                    }
                  }}
                  showTime
                  hourFormat="24"
                  stepMinute={5}
                  minDate={new Date()}
                  placeholder="Select window close time"
                  className="w-full"
                  pt={{
                    root: { className: 'w-full p-3 rounded-md bg-surface-subtle' },
                    panel: { className: 'bg-app-bg' },
                    header: { className: 'bg-app-bg' },
                    input: { root: { className: 'cursor-pointer !shadow-none focus:!shadow-none' } }
                  }}
                />
              </button>
              {errors.windowCloseTime && <Message severity="error" text={errors.windowCloseTime} className="mt-2" />}
            </div>

            {/* Snapshot Time */}
            <div>
              <label className="block text-sm font-medium mb-2 text-text-title">Snapshot Time *</label>
              <button className="w-full" onClick={() => snapshotRef.current?.show()} type="button">
                <Calendar
                  readOnlyInput
                  value={form.snapshotTime}
                  dateFormat="D dd M yy  "
                  ref={snapshotRef}
                  onChange={(e) => {
                    const date = e.value as Date | null;
                    if (date) {
                      setForm({ ...form, snapshotTime: formatTimeToNearest5Minutes(date) });
                      onChangeCheckForm({ ...form, snapshotTime: formatTimeToNearest5Minutes(date) });
                    }
                  }}
                  showTime
                  hourFormat="24"
                  stepMinute={5}
                  minDate={form.windowCloseTime || new Date()}
                  placeholder="Select snapshot time"
                  className="w-full"
                  pt={{
                    root: { className: 'p-3 rounded-md w-full bg-surface-subtle' },
                    panel: { className: 'bg-app-bg' },
                    header: { className: 'bg-app-bg' },
                    input: { root: { className: 'cursor-pointer !shadow-none focus:!shadow-none' } }
                  }}
                />
              </button>
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-full bg-primary-default text-white font-medium p-ripple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Pool...' : isConnected ? 'Create Pool' : 'Connect Wallet to Create Pool'}
              <Ripple />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
