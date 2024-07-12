import { Pool } from '@/schemas';

export const CompletedPoolDisplay = ({
  pool: { seeds, snapshotPrice, winAmount }
}: {
  pool: Pool;
}) => {
  return (
    <div className="border border-border-default dark:border-surface-subtle p-8 rounded-[24px] w-full max-lg:max-w-lg max-lg:mx-auto">
      <div className="mb-8">
        <p className="font-medium text-xs sm:text-base text-text-disabled text-right mb-2">
          Powered by PYTH
        </p>

        <div className="font-bold text-lg sm:text-2xl text-text-title">
          {seeds.pairNameSpaced()}
        </div>
        <div className="font-medium sm:text-lg text-text-caption">
          {seeds.pairNameFull()}
        </div>
      </div>

      {!!snapshotPrice ? (
        <>
          <p className="font-medium text-text-subtitle mb-2">Snapshot Price</p>
          <p className="text-2xl sm:text-4xl md:text-5xl text-text-title mb-8">
            {snapshotPrice} USD
          </p>
        </>
      ) : (
        <p className="text-xl sm:text-2xl">Nobody Joined This Pool</p>
      )}

      {!!winAmount && (
        <div className="py-1.5 px-4 font-medium rounded-full w-fit sm:text-lg bg-primary-default text-white">
          Win Amount: {winAmount} {seeds.stakeTokenDetails.name}
        </div>
      )}
    </div>
  );
};
