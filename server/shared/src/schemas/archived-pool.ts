import { Chain } from '../utils/index.js';
import { PoolResults } from './index.js';
import { Pool } from './pool.js';
import { Prediction } from './prediction.js';

/**
 * Details about a closed/completed pool. Stored in the database to
 * hasten completion later on, compute leaderboard, and statistics.
 */
export class ArchivedPool {
  chain: Chain;
  pool: Pool;
  predictions: Prediction[];
  results?: PoolResults | undefined;

  constructor(input: any) {
    this.chain = input['chain'];
    this.pool = input['pool'];
    this.predictions = input['predictions'];
    if (input['results']) this.results = input['results'];
  }

  toJSON() {
    return {
      chain: this.chain,
      pool: this.pool.toJSON(),
      predictions: this.predictions.map((p) => p.toJson()),
      ...(this.results ? { results: this.results } : {})
    };
  }
}
