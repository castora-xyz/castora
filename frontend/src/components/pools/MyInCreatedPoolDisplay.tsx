import Telegram from '@/assets/telegram-plain.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import { useAuth, useFirebase, useTelegram } from '@/contexts';
import { Pool } from '@/schemas';
import ms from 'ms';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useState } from 'react';
import { ClaimCreateButton } from '../general';

export const MyInCreatedPoolDisplay = ({ pool, pool: { seeds, noOfPredictions, userCreated } }: { pool: Pool }) => {
  const { address } = useAuth();
  const { recordEvent } = useFirebase();
  const telegram = useTelegram();

  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.trunc(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, [now]);

  if (!userCreated || userCreated.creator.toLowerCase() != address?.toLowerCase()) return <></>;

  return (
    <div className="border border-border-default dark:border-surface-subtle p-6 rounded-[24px] w-full mb-8">
      <div className="flex gap-4 justify-between flex-wrap items-center  mb-6">
        <h3 className="font-medium text-xl text-text-subtitle">My Created Pool</h3>

        <Tooltip target=".creation-time" />
        <p
          className="creation-time text-text-caption inline-block cursor-context-menu"
          data-pr-tooltip={`${new Date(userCreated.creationTime * 1000)}`.split(' GMT')[0]}
        >
          {ms((now - userCreated.creationTime) * 1000)}
        </p>
      </div>

      {!userCreated.completionFeesAmount ? (
        <div className="flex gap-4 justify-between flex-wrap items-center">
          {now <= seeds.snapshotTime && (
            <div className="flex flex-wrap justify-start items-center gap-3">
              <p className="text-primary-darker bg-primary-subtle py-1 px-4 rounded-full text-sm w-fit">
                Awaiting Snapshot
              </p>
            </div>
          )}
          {now > seeds.snapshotTime && noOfPredictions > 0 && (
            <p className="text-primary-darker bg-primary-subtle py-1 px-4 rounded-full text-sm w-fit">
              Awaiting Processing
            </p>
          )}
          {now > seeds.snapshotTime && noOfPredictions === 0 && <p className="text-lg">There Was No Pool Activity</p>}

          {!telegram.hasLinked && (now <= seeds.snapshotTime || noOfPredictions > 0) && (
            <button
              className="py-1.5 px-4 font-medium rounded-full w-fit sm:text-lg bg-primary-default text-white p-ripple flex gap-2 items-center"
              onClick={async () => {
                await telegram.startAuth();
                recordEvent('clicked_get_telegram_notified_in_pending_my_created_pool');
              }}
            >
              <Telegram className="w-6 h-6 fill-white" />
              <span>Get Notified</span>
              <Ripple />
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-4 justify-between flex-wrap items-center">
          <p className="text-white font-medium flex items-center bg-success-default py-1 px-3 rounded-full w-fit">
            <Trophy className="fill-white w-4 h-4 mr-1" />
            Gained {userCreated.getGainedDisplay()}
          </p>

          <ClaimCreateButton pool={pool} userCreated={userCreated} />
        </div>
      )}
    </div>
  );
};
