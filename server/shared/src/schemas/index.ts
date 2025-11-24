import { Prediction } from './prediction.js';

export * from './archived-pool.js';
export * from './pool-seeds.js';
export * from './pool.js';
export * from './prediction.js';

export interface PoolResults {
  winnerAddressesUniqued: string[];
  winnerPredictionIds: number[];
}

export interface SplitPredictionResult extends PoolResults {
  predictions: Prediction[];
  winnerPredictionIdsBigInts: bigint[];
}
