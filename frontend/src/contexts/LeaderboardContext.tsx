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
}

const LeaderboardContext = createContext<LeaderboardContextProps>({
  entries: [],
  isLoading: true,
  hasError: false,
  refresh: () => {},
  lastUpdatedTime: new Date().toISOString(),
  totalUsersCount: 0
});

export const useLeaderboard = () => useContext(LeaderboardContext);

export const LeaderboardProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toISOString());
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const server = useServer();

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

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <LeaderboardContext.Provider
      value={{ entries, isLoading, hasError, refresh: fetchLeaderboard, lastUpdatedTime, totalUsersCount }}
    >
      {children}
    </LeaderboardContext.Provider>
  );
};
