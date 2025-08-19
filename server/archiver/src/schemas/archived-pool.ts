import { Chain } from '../utils';
import { Pool } from './pool';
import { Prediction } from './prediction';

/**
 * Details about a closed/completed pool. Stored in the database to
 * hasten completion later on, compute leaderboard, and statistics.
 */
export class ArchivedPool {
  chain: Chain;
  pool: Pool;
  predictions: Prediction[];

  constructor(input: any) {
    this.chain = input['chain'];
    this.pool = input['pool'];
    this.predictions = input['predictions'];
  }

  toJSON() {
    return {
      chain: this.chain,
      pool: this.pool.toJSON(),
      predictions: this.predictions.map((p) => p.toJson())
    };
  }
}
