import { CountdownNumbers } from '@/components';
import { useCurrentTime } from '@/contexts';
import { PoolSeeds } from '@/schemas';
import { useEffect, useState } from 'react';

export const CountdownBadge = ({ seeds, seeds: { windowCloseTime, snapshotTime } }: { seeds: PoolSeeds }) => {
  const { now } = useCurrentTime();

  const getReferenceTime = () => {
    const openTime = seeds.openTime();
    if (openTime && openTime > now) return openTime;
    return windowCloseTime;
  };

  const [diff, setDiff] = useState(windowCloseTime - now);
  const [timestamp, setTimestamp] = useState(getReferenceTime());

  useEffect(() => {
    setTimestamp(getReferenceTime());
    setDiff(timestamp - now);
  }, [now, timestamp]);

  if (diff <= 0) return <></>;

  return (
    <div
      className={
        'py-1.5 px-4 mb-4 font-medium rounded-full w-fit text-sm sm:text-md border ' +
        `${
          timestamp - now <= snapshotTime - windowCloseTime
            ? 'border-errors-lighter bg-errors-subtle text-errors-darker'
            : 'border-primary-lighter bg-primary-subtle text-primary-darker'
        }`
      }
    >
      <CountdownNumbers timestamp={timestamp} />
    </div>
  );
};
