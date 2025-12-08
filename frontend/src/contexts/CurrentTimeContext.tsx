import React, { createContext, useContext, useEffect, useState } from 'react';

interface CurrentTimeContextType {
  now: number;
}

const CurrentTimeContext = createContext<CurrentTimeContextType>({ now: Math.trunc(Date.now() / 1000) });

export const useCurrentTime = () => useContext(CurrentTimeContext);

export const CurrentTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [now, setNow] = useState(Math.trunc(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.trunc(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  return <CurrentTimeContext.Provider value={{ now }}>{children}</CurrentTimeContext.Provider>;
};
