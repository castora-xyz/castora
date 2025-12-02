import { useAuth } from '@/contexts/AuthContext';
import { useServer } from '@/contexts/ServerContext';
import { LeaderboardEntry } from '@/schemas';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useChains } from 'wagmi';
import { monadMainnet } from './chains';

interface LeaderboardContextProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  hasError: boolean;
  refresh: () => void;
  lastUpdatedTime: string;
  totalUsersCount: number;
  mine: LeaderboardEntry | null;
}

const LeaderboardContext = createContext<LeaderboardContextProps>({
  entries: [],
  isLoading: true,
  hasError: false,
  refresh: () => {},
  lastUpdatedTime: new Date().toISOString(),
  totalUsersCount: 0,
  mine: null
});

export const useLeaderboard = () => useContext(LeaderboardContext);

export const LeaderboardProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toISOString());
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [mine, setMine] = useState<LeaderboardEntry | null>(null);
  const server = useServer();
  const { address } = useAuth();
  const { chain: currentChain } = useAccount();
  const [defaultChain] = useChains();

  const getChainName = () => {
    const chain = currentChain ?? defaultChain;
    return chain.id === monadMainnet.id ? 'mainnet' : 'testnet';
  };

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const chainName = getChainName();
      const data = await server.get(`/leaderboard/${chainName}/top`);
      if (data) {
        setEntries(data.entries || []);
        setLastUpdatedTime(data.lastUpdatedTime || new Date().toISOString());
        setTotalUsersCount(data.totalUsersCount || 0);
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMine = async () => {
    if (!address) {
      setMine(null);
      return;
    }

    // Check if user is in top entries
    const foundIndex = entries.findIndex((e) => e.address.toLowerCase() === address.toLowerCase());
    if (foundIndex !== -1) {
      setMine({ ...entries[foundIndex], rank: foundIndex + 1 });
      return;
    }

    // Fetch from server if not in top
    try {
      const chainName = getChainName();
      const data = await server.get(`/leaderboard/${chainName}/mine`);
      if (data) setMine(data);
    } catch (error) {
      console.error('Failed to fetch my leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [currentChain, defaultChain]);

  useEffect(() => {
    if (!isLoading && entries.length > 0) fetchMine();
  }, [address, entries, isLoading]);

  return (
    <LeaderboardContext.Provider
      value={{ entries, isLoading, hasError, refresh: fetchLeaderboard, lastUpdatedTime, totalUsersCount, mine }}
    >
      {children}
    </LeaderboardContext.Provider>
  );
};
