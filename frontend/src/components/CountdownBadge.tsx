import CountdownNumbers from '@/components/CountdownNumbers';
import { PoolSeeds } from '@/models';
import { useEffect, useState } from 'react';

export default function CountdownBadge({
  seeds,
  seeds: { windowCloseTime, snapshotTime }
}: {
  seeds: PoolSeeds;
}) {
  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));
  const [diff, setDiff] = useState(windowCloseTime - now);
  const [timestamp, setTimestamp] = useState(
    seeds.openTime() ?? windowCloseTime
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.trunc(Date.now() / 1000));
      setDiff(windowCloseTime - now);
      setTimestamp(seeds.openTime() ?? windowCloseTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [now]);

  if (diff <= 0) return <></>;

  return (
    <div
      className={
        'py-1.5 px-4 mb-3 font-medium rounded-full w-fit text-sm sm:text-md border ' +
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
}
