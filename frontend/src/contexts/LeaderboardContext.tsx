import { useAuth } from '@/contexts/AuthContext';
import { useServer } from '@/contexts/ServerContext';
import { LeaderboardEntry } from '@/schemas';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface LeaderboardContextProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  hasError: boolean;
  refresh: () => void;
  lastUpdatedTime: string;
  totalUsersCount: number;
  mine: (LeaderboardEntry & { rank: number }) | null;
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
  const [mine, setMine] = useState<(LeaderboardEntry & { rank: number }) | null>(null);
  const server = useServer();
  const { address } = useAuth();

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await server.get('/leaderboard/testnet/top');
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
      const data = await server.get('/leaderboard/testnet/mine');
      if (data) setMine({ address, ...data });
    } catch (error) {
      console.error('Failed to fetch my leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

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
