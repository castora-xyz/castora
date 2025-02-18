import { Prediction } from './prediction';

export * from './activities';
export * from './leaderboard';
export * from './pool';
export * from './pool-seeds';
export * from './prediction';

export interface SplitPredictionResult {
  loserAddresses: string[];
  loserPredictionIds: bigint[];
  winnerAddresses: string[];
  winnerPredictionIds: bigint[];
}

export interface SetWinnersResult {
  predictions: Prediction[];
  splitted: SplitPredictionResult;
}
