import { useAuth } from '@/contexts/AuthContext';
import { useServer } from '@/contexts/ServerContext';
import { getChainName } from '@/utils/config';
import { LeaderboardEntry } from '@/schemas';
import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useConnection } from 'wagmi';

interface LeaderboardContextProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  hasError: boolean;
  refresh: () => void;
  lastUpdatedTime: string;
  totalUsersCount: number;
  mine: LeaderboardEntry | null;
  /** Chain the leaderboard data is for (from route or connected wallet). Use for explorer links. */
  chain: string;
}

const LeaderboardContext = createContext<LeaderboardContextProps>({
  entries: [],
  isLoading: true,
  hasError: false,
  refresh: () => {},
  lastUpdatedTime: new Date().toISOString(),
  totalUsersCount: 0,
  mine: null,
  chain: 'monad'
});

export const useLeaderboard = () => useContext(LeaderboardContext);

export const LeaderboardProvider = ({ children }: { children: ReactNode }) => {
  const { chain: currentChain } = useConnection();
  const { chainName: routeChainName } = useParams();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toISOString());
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [mine, setMine] = useState<LeaderboardEntry | null>(null);
  const server = useServer();
  const { address } = useAuth();
  const fetchChainRef = useRef<string | null>(null);

  // Use route chain when on :chainName/leaderboard so URL and data match; otherwise connected wallet chain
  const effectiveChain = getChainName(routeChainName ?? currentChain);

  const fetchLeaderboard = async () => {
    const chainName = effectiveChain;
    fetchChainRef.current = chainName;
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await server.get(`/leaderboard/top`, { chain: chainName });
      if (fetchChainRef.current !== chainName) return;
      if (data) {
        setEntries(data.entries || []);
        setLastUpdatedTime(data.lastUpdatedTime || new Date().toISOString());
        setTotalUsersCount(data.totalUsersCount || 0);
      } else {
        setHasError(true);
      }
    } catch (error) {
      if (fetchChainRef.current !== chainName) return;
      console.error('Failed to fetch leaderboard:', error);
      setHasError(true);
    } finally {
      if (fetchChainRef.current === chainName) setIsLoading(false);
    }
  };

  const fetchMine = async () => {
    if (!address) {
      setMine(null);
      return;
    }

    const foundIndex = entries.findIndex((e) => e.address.toLowerCase() === address.toLowerCase());
    if (foundIndex !== -1) {
      setMine({ ...entries[foundIndex], rank: foundIndex + 1 });
      return;
    }

    try {
      const chainName = effectiveChain;
      const data = await server.get(`/leaderboard/mine`, { chain: chainName });
      if (fetchChainRef.current !== chainName) return;
      if (data) setMine(data);
    } catch (error) {
      console.error('Failed to fetch my leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [effectiveChain]);

  useEffect(() => {
    if (!isLoading && entries.length > 0) fetchMine();
  }, [address, entries, isLoading, effectiveChain]);

  return (
    <LeaderboardContext.Provider
      value={{
        entries,
        isLoading,
        hasError,
        refresh: fetchLeaderboard,
        lastUpdatedTime,
        totalUsersCount,
        mine,
        chain: effectiveChain
      }}
    >
      {children}
    </LeaderboardContext.Provider>
  );
};
