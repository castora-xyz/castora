import { useEffect, useState } from 'react';

export default function CountdownNumbers({ timestamp }: { timestamp: number }) {
  const [diff, setDiff] = useState(timestamp - Math.floor(Date.now() / 1000));
  const [secs, setSecs] = useState(diff % 60);
  const [mins, setMins] = useState(Math.floor((diff % 3600) / 60));
  const [hrs, setHrs] = useState(Math.floor((diff % 86400) / 3600));
  const [days, setDays] = useState(Math.floor(diff / 86400));

  useEffect(() => {
    setSecs(diff % 60);
    setMins(Math.floor((diff % 3600) / 60));
    setHrs(Math.floor((diff % 86400) / 3600));
    setDays(Math.floor(diff / 86400));
    const interval = setInterval(
      () => setDiff(timestamp - Math.floor(Date.now() / 1000)),
      1000
    );
    return () => clearInterval(interval);
  }, [diff]);

  if (diff <= 0) return <></>;

  return (
    <>
      {days > 0 && <span>{days}d</span>}
      {days > 0 && <span> : </span>}
      {(hrs > 0 || (days > 0 && hrs == 0)) && <span>{hrs}h</span>}
      {(hrs > 0 || (days > 0 && hrs == 0)) && <span> : </span>}
      {(mins > 0 || ((hrs > 0 || days > 0) && mins == 0)) && (
        <span>{mins}m</span>
      )}
      {(mins > 0 || ((hrs > 0 || days > 0) && mins == 0)) && <span> : </span>}
      <span>{secs}s</span>
    </>
  );
}
