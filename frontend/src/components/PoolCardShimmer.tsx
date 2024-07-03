import { Breathing } from 'react-shimmer';

export default function PoolCardShimmer() {
  return (
    <div className="border border-border-default dark:border-surface-subtle p-6 rounded-2xl w-full max-w-md mx-auto md:flex md:grow md:flex-col">
      <Breathing width={180} height={48} className="mb-3 rounded-full" />
      <Breathing width={144} height={32} className="mb-3" />
      <Breathing width={96} height={16} className="mb-2" />
      <Breathing width={120} height={32} className="mb-3 rounded-full" />

      <div className="flex justify-between mb-3">
        <Breathing width={120} height={20} />
        <Breathing width={64} height={20} />
      </div>

      <div className="flex justify-between mb-8">
        <Breathing width={120} height={20} />
        <Breathing width={64} height={20} />
      </div>

      <Breathing
        height={40}
        className="rounded-full w-full border mt-auto border-border-default dark:border-surface-subtle"
      />
    </div>
  );
}
