export interface TokenAndAmount {
  token: string;
  amount: number;
}

export interface LeaderboardEntry {
  address: string;
  stakedAmounts: TokenAndAmount[];
  totalStakedUsd: number;
  wonAmounts: TokenAndAmount[];
  totalWonUsd: number;
  lostAmounts: TokenAndAmount[];
  totalLostUsd: number;
  predictionsCount: number;
  winningsCount: number;
  lostCount: number;
  poolsCount: number;
}
