import Telegram from '@/assets/telegram-plain.svg?react';
import { useAuth, useFirebase, useTelegram } from '@/contexts';
import { Pool } from '@/schemas';
import { Ripple } from 'primereact/ripple';

export const CompletedPoolDisplay = ({
  pool: { completionTime, noOfPredictions, seeds, snapshotPrice, winAmount }
}: {
  pool: Pool;
}) => {
  const { signature } = useAuth();
  const { recordEvent } = useFirebase();
  const telegram = useTelegram();

  return (
    <div className="border border-border-default dark:border-surface-subtle p-8 rounded-[24px] w-full max-lg:max-w-lg max-lg:mx-auto">
      <div className="mb-8">
        <p className="font-medium text-xs sm:text-base text-text-disabled text-right">Building on Monad</p>
        <p className="font-medium text-xs sm:text-base text-text-disabled text-right mb-2">Powered by PYTH</p>

        <div className="flex gap-2 sm:gap-3 items-start">
          {seeds.predictionTokenDetails.img && (
            <img
              src={`/assets/${seeds.predictionTokenDetails.img}.png`}
              className="w-8 sm:w-12 h-8 sm:h-12 rounded-full"
            />
          )}
          <div>
            <div className="font-bold text-lg sm:text-2xl text-text-title">{seeds.pairNameSpaced()}</div>
            <div className="font-medium sm:text-lg text-text-caption">{seeds.pairNameFull()}</div>
          </div>
        </div>
      </div>

      {!!snapshotPrice && (
        <>
          <p className="font-medium text-text-subtitle mb-2">Snapshot Price</p>
          <p className="text-2xl sm:text-4xl md:text-5xl text-text-title mb-8">{snapshotPrice} USD</p>
        </>
      )}

      {noOfPredictions === 0 ? (
        <p className="text-xl sm:text-2xl">Nobody Joined This Pool</p>
      ) : completionTime === 0 ? (
        <p className="text-xl sm:text-2xl mb-6">Computing Winners ...</p>
      ) : (
        <></>
      )}

      {!!winAmount && (
        <div className="py-1.5 px-4 font-medium rounded-full w-fit sm:text-lg bg-primary-default text-white">
          Win Amount: {winAmount} {seeds.stakeTokenDetails.name}
        </div>
      )}

      {noOfPredictions > 0 && completionTime === 0 && signature && !telegram.hasLinked && (
        <button
          className="py-1.5 mt-4 px-4 font-medium rounded-full w-fit sm:text-lg bg-primary-default text-white p-ripple flex gap-2 items-center"
          onClick={async () => {
            await telegram.startAuth();
            recordEvent('clicked_get_telegram_notified_awaiting_pool_completion');
          }}
        >
          <Telegram className="w-6 h-6 fill-white" />
          <span>Get Notified</span>
          <Ripple />
        </button>
      )}
    </div>
  );
};
