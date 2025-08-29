import { Chain, Pool, Prediction, readContract } from '@castora/shared';
/**
 * Fetches and returns all predictions made in the pool with the provided poolId
 *
 * @param chain The chain to fetch the pool from.
 * @param pool The pool to get its predictions.
 * @returns An array of the predictions that were fetched.
 */
export const fetchPredictions = async (chain: Chain, pool: Pool): Promise<Prediction[]> => {
  const predictions = [];
  for (let i = 1; i <= pool.noOfPredictions; i++) {
    const raw = await readContract(chain, 'getPrediction', [BigInt(pool.poolId), BigInt(i)]);
    if (!raw) throw `Could not fetch prediction: ${i}`;
    predictions.push(new Prediction(raw));
  }
  return predictions;
};
