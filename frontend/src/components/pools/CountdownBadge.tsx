import { CountdownNumbers } from '@/components';
import { PoolSeeds } from '@/schemas';
import { useEffect, useState } from 'react';

export const CountdownBadge = ({
  seeds,
  seeds: { windowCloseTime, snapshotTime }
}: {
  seeds: PoolSeeds;
}) => {
  const getReferenceTime = () => {
    const now = Math.trunc(Date.now() / 1000);
    const openTime = seeds.openTime();
    if (openTime && openTime > now) return openTime;
    return windowCloseTime;
  };

  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));
  const [diff, setDiff] = useState(windowCloseTime - now);
  const [timestamp, setTimestamp] = useState(getReferenceTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.trunc(Date.now() / 1000));
      setTimestamp(getReferenceTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [now]);

  useEffect(() => {
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
