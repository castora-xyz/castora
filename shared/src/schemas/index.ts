import { Prediction } from './prediction';

export * from './activities';
export * from './archived-pool';
export * from './leaderboard';
export * from './pool';
export * from './pool-seeds';
export * from './prediction';

export interface PoolResults {
  winnerAddressesUniqued: string[];
  winnerPredictionIds: number[];
}

export interface SplitPredictionResult extends PoolResults {
  predictions: Prediction[];
  winnerPredictionIdsBigInts: bigint[];
}
