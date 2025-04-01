import { SetWinnersResult } from '.';
import { Pool } from './pool';

export interface CompletedPoolLeaderboardInfo extends SetWinnersResult {
  pool: Pool;
}

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

export const getNewLeaderboardEntry = (address: string): LeaderboardEntry => {
  return {
    ...{ address, stakedAmounts: [], totalStakedUsd: 0, wonAmounts: [] },
    ...{ totalWonUsd: 0, lostAmounts: [], totalLostUsd: 0 },
    ...{ predictionsCount: 0, winningsCount: 0, lostCount: 0, poolsCount: 0 }
  };
};
