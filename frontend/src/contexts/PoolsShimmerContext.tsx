import { createContext, useContext, useEffect, useState } from 'react';

interface PoolsShimmerContextProps {
  shimmerCount: number;
}

const PoolsShimmerContext = createContext<PoolsShimmerContextProps>({
  shimmerCount: 3
});

export const usePoolsShimmer = () => useContext(PoolsShimmerContext);

export const PoolsShimmerProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const getShimmerCount = () => {
    if (windowWidth < 768) return 3;
    else if (windowWidth < 1024) return 5;
    else if (windowWidth < 1280) return 8;
    else return 10;
  };
  const [shimmerCount, setShimmerCount] = useState(getShimmerCount());

  useEffect(() => {
    setShimmerCount(getShimmerCount());
  }, [windowWidth]);

  useEffect(() => {
    window.addEventListener('resize', () => setWindowWidth(window.innerWidth));
  }, []);

  return (
    <PoolsShimmerContext.Provider value={{ shimmerCount }}>
      {children}
    </PoolsShimmerContext.Provider>
  );
};
