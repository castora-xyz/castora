import { LeaderboardEntry } from '@/schemas';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface LeaderboardContextProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  hasError: boolean;
  refresh: () => void;
}

const LeaderboardContext = createContext<LeaderboardContextProps>({
  entries: [],
  isLoading: true,
  hasError: false,
  refresh: () => {}
});

export const useLeaderboard = () => useContext(LeaderboardContext);

// Dummy data for development - remove when backend is ready
const generateDummyData = (): LeaderboardEntry[] => {
  return [
    {
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      stakedAmounts: [{ token: 'cUSD', amount: 12500 }],
      totalStakedUsd: 12500,
      wonAmounts: [{ token: 'cUSD', amount: 18750 }],
      totalWonUsd: 18750,
      lostAmounts: [{ token: 'cUSD', amount: 2500 }],
      totalLostUsd: 2500,
      predictionsCount: 45,
      winningsCount: 28,
      lostCount: 17,
      poolsCount: 12
    },
    {
      address: '0x8ba1f109551bD432803012645Hac136c22C9b8B',
      stakedAmounts: [{ token: 'cUSD', amount: 9800 }],
      totalStakedUsd: 9800,
      wonAmounts: [{ token: 'cUSD', amount: 15200 }],
      totalWonUsd: 15200,
      lostAmounts: [{ token: 'cUSD', amount: 1800 }],
      totalLostUsd: 1800,
      predictionsCount: 38,
      winningsCount: 24,
      lostCount: 14,
      poolsCount: 10
    },
    {
      address: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
      stakedAmounts: [{ token: 'cUSD', amount: 11200 }],
      totalStakedUsd: 11200,
      wonAmounts: [{ token: 'cUSD', amount: 13400 }],
      totalWonUsd: 13400,
      lostAmounts: [{ token: 'cUSD', amount: 3200 }],
      totalLostUsd: 3200,
      predictionsCount: 52,
      winningsCount: 30,
      lostCount: 22,
      poolsCount: 15
    },
    {
      address: '0x28C6c06298d514Db089934071355E5743bf21d60',
      stakedAmounts: [{ token: 'cUSD', amount: 7500 }],
      totalStakedUsd: 7500,
      wonAmounts: [{ token: 'cUSD', amount: 11200 }],
      totalWonUsd: 11200,
      lostAmounts: [{ token: 'cUSD', amount: 1500 }],
      totalLostUsd: 1500,
      predictionsCount: 32,
      winningsCount: 20,
      lostCount: 12,
      poolsCount: 8
    },
    {
      address: '0x5632Cf5b7C6bC5C5C5C5C5C5C5C5C5C5C5C5C5C5C',
      stakedAmounts: [{ token: 'cUSD', amount: 6800 }],
      totalStakedUsd: 6800,
      wonAmounts: [{ token: 'cUSD', amount: 9800 }],
      totalWonUsd: 9800,
      lostAmounts: [{ token: 'cUSD', amount: 1200 }],
      totalLostUsd: 1200,
      predictionsCount: 28,
      winningsCount: 18,
      lostCount: 10,
      poolsCount: 7
    },
    {
      address: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
      stakedAmounts: [{ token: 'cUSD', amount: 5500 }],
      totalStakedUsd: 5500,
      wonAmounts: [{ token: 'cUSD', amount: 8200 }],
      totalWonUsd: 8200,
      lostAmounts: [{ token: 'cUSD', amount: 1000 }],
      totalLostUsd: 1000,
      predictionsCount: 25,
      winningsCount: 16,
      lostCount: 9,
      poolsCount: 6
    },
    {
      address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      stakedAmounts: [{ token: 'cUSD', amount: 4200 }],
      totalStakedUsd: 4200,
      wonAmounts: [{ token: 'cUSD', amount: 6500 }],
      totalWonUsd: 6500,
      lostAmounts: [{ token: 'cUSD', amount: 800 }],
      totalLostUsd: 800,
      predictionsCount: 22,
      winningsCount: 14,
      lostCount: 8,
      poolsCount: 5
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      stakedAmounts: [{ token: 'cUSD', amount: 3800 }],
      totalStakedUsd: 3800,
      wonAmounts: [{ token: 'cUSD', amount: 5200 }],
      totalWonUsd: 5200,
      lostAmounts: [{ token: 'cUSD', amount: 600 }],
      totalLostUsd: 600,
      predictionsCount: 18,
      winningsCount: 12,
      lostCount: 6,
      poolsCount: 4
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      stakedAmounts: [{ token: 'cUSD', amount: 3200 }],
      totalStakedUsd: 3200,
      wonAmounts: [{ token: 'cUSD', amount: 4500 }],
      totalWonUsd: 4500,
      lostAmounts: [{ token: 'cUSD', amount: 500 }],
      totalLostUsd: 500,
      predictionsCount: 15,
      winningsCount: 10,
      lostCount: 5,
      poolsCount: 3
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      stakedAmounts: [{ token: 'cUSD', amount: 2800 }],
      totalStakedUsd: 2800,
      wonAmounts: [{ token: 'cUSD', amount: 3800 }],
      totalWonUsd: 3800,
      lostAmounts: [{ token: 'cUSD', amount: 400 }],
      totalLostUsd: 400,
      predictionsCount: 12,
      winningsCount: 8,
      lostCount: 4,
      poolsCount: 3
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      stakedAmounts: [{ token: 'cUSD', amount: 2400 }],
      totalStakedUsd: 2400,
      wonAmounts: [{ token: 'cUSD', amount: 3200 }],
      totalWonUsd: 3200,
      lostAmounts: [{ token: 'cUSD', amount: 300 }],
      totalLostUsd: 300,
      predictionsCount: 10,
      winningsCount: 7,
      lostCount: 3,
      poolsCount: 2
    },
    {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      stakedAmounts: [{ token: 'cUSD', amount: 2000 }],
      totalStakedUsd: 2000,
      wonAmounts: [{ token: 'cUSD', amount: 2800 }],
      totalWonUsd: 2800,
      lostAmounts: [{ token: 'cUSD', amount: 200 }],
      totalLostUsd: 200,
      predictionsCount: 8,
      winningsCount: 6,
      lostCount: 2,
      poolsCount: 2
    }
  ].sort((a, b) => b.totalWonUsd - a.totalWonUsd);
};

export const LeaderboardProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const refresh = () => {
    setIsLoading(true);
    setHasError(false);
    // Simulate loading delay
    setTimeout(() => {
      setEntries(generateDummyData());
      setIsLoading(false);
      setHasError(false);
    }, 500);
  };

  useEffect(() => {
    // Simulate initial loading
    setIsLoading(true);
    const timer = setTimeout(() => {
      setEntries(generateDummyData());
      setIsLoading(false);
      setHasError(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LeaderboardContext.Provider value={{ entries, isLoading, hasError, refresh }}>
      {children}
    </LeaderboardContext.Provider>
  );
};

