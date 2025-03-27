import { CountdownNumbers } from '@/components';
import { gMON, Pool } from '@/schemas';
import { useEffect, useState } from 'react';

export const PoolDetailsInCards = ({
  pool: { noOfPredictions, poolId, seeds }
}: {
  pool: Pool;
}) => {
  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    now && ( // "now &&" is to always re-render the UI every second
      // This will be re-calling the seeds.methods() to get the control-flow.
      <div className="max-lg:max-w-lg max-lg:mx-auto">
        <div className="grid grid-cols-2 gap-6 w-full mt-12 mb-8">
          <div
            className={
              'px-2 py-4 rounded-lg text-center ' +
              `${
                ['Open', 'Upcoming'].includes(seeds.status())
                  ? 'bg-errors-default text-white'
                  : 'bg-surface-subtle text-text-disabled'
              }`
            }
          >
            {['Open', 'Upcoming'].includes(seeds.status()) ? (
              <>
                <div className="mb-2 text-sm">
                  Pool {seeds.status() === 'Upcoming' ? 'Opens' : 'Closes'} In
                </div>
                <div className="font-medium sm:text-xl">
                  <CountdownNumbers
                    timestamp={seeds.openTime() ?? seeds.windowCloseTime}
                  />
                </div>
              </>
            ) : (
              <div className="my-6 sm:text-2xl">Closed</div>
            )}
          </div>

          <div
            className={
              'px-2 py-4 rounded-lg text-center ' +
              `${
                seeds.status() != 'Completed'
                  ? 'bg-primary-default text-white'
                  : 'bg-surface-subtle text-text-disabled'
              }`
            }
          >
            {seeds.status() != 'Completed' ? (
              <>
                <div className="mb-2 text-sm">Snapshot In</div>
                <div className="font-medium sm:text-xl">
                  <CountdownNumbers timestamp={seeds.snapshotTime} />
                </div>
              </>
            ) : (
              <div className="my-6 sm:text-2xl">Completed</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 w-full">
          <div className="bg-surface-subtle px-2 py-4 rounded-lg text-center">
            <div className="mb-2 text-sm">Pool ID</div>
            <div className="font-medium xs:text-xl">{poolId}</div>
          </div>

          <div className="bg-surface-subtle px-2 py-4 rounded-lg text-center">
            <div className="mb-2 text-sm">Entry Fee</div>
            <div className="flex justify-center items-center">
              {seeds.stakeToken == gMON && (
                <img
                  src="/assets/gmon.png"
                  className="w-6 h-6 rounded-full mr-2"
                />
              )}
              <span className="font-medium xs:text-xl">
                {seeds.displayStake()}
              </span>
            </div>
          </div>

          <div className="bg-surface-subtle px-2 py-4 rounded-lg text-center">
            <div className="mb-2 text-sm">Predictions</div>
            <div className="font-medium xs:text-xl">
              {noOfPredictions ? noOfPredictions : 'None'}
            </div>
          </div>

          <div className="bg-surface-subtle px-2 py-4 rounded-lg text-center">
            <div className="mb-2 text-sm">Snapshot Time</div>
            {seeds.formattedSnapshotTime().length > 1 && (
              <div className="text-xs font-medium bg-primary-subtle text-primary-darker rounded-full w-fit py-px px-1.5 mx-auto">
                {seeds.formattedSnapshotTime()[1]}
              </div>
            )}
            <div className="font-medium xs:text-xl">
              {seeds.formattedSnapshotTime()[0]}
            </div>
          </div>
        </div>
      </div>
    )
  );
};
