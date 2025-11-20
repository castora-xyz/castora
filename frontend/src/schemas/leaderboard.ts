export interface LeaderboardEntry {
  address: string;
  xp: number;
  winningsVolume: number;
  pools: number;
  predictionsVolume: number;
  winnings: number;
  predictions: number;
  createdPools?: number;
}
