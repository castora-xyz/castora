import { Chain, Pool, Prediction, readCastoraContract, readGettersContract } from '@castora/shared';
/**
 * Fetches and returns all predictions made in the pool with the provided poolId
 *
 * @param chain The chain to fetch the pool from.
 * @param pool The pool to get its predictions.
 * @returns An array of the predictions that were fetched.
 */
export const fetchPredictions = async (chain: Chain, pool: Pool): Promise<Prediction[]> => {
  const predictions = [];
  if (chain === 'monadtestnet') {
    for (let i = 1; i <= pool.noOfPredictions; i++) {
      const raw = await readCastoraContract(chain, 'getPrediction', [BigInt(pool.poolId), BigInt(i)]);
      if (!raw) throw `Could not fetch prediction: ${i}`;
      predictions.push(new Prediction(raw));
    }
  } else {
    for (let i = 1; i <= pool.noOfPredictions; i += 200) {
      const end = Math.min(i + 201, pool.noOfPredictions + 1);
      const ids = [];
      for (let j = i; j < end; j++) ids.push(BigInt(j));
      const raws = await readGettersContract(chain, 'predictions', [BigInt(pool.poolId), ids]);
      for (const raw of raws) {
        if (!raw) throw `Could not fetch prediction in batch starting at: ${i}`;
        predictions.push(new Prediction(raw));
      }
    }
  }
  return predictions;
};
