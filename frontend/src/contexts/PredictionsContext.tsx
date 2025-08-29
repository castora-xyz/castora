import { useCache, useContract, usePools, useToast } from '@/contexts';
import { Pool, Prediction } from '@/schemas';
import { useAccount, useChains } from 'wagmi';

export const MAX_BULK_PREDICTIONS = 100;

export const usePredictions = () => {
  const { chain: currentChain } = useAccount();
  const [defaultChain] = useChains();
  const cache = useCache();
  const { readContract } = useContract();
  const { isValidPoolId } = usePools();
  const { toastError } = useToast();

  return async ({ poolId, completionTime }: Pool, predictionIds: bigint[]) => {
    try {
      if (!(await isValidPoolId(poolId))) return null;

      const predictions: Prediction[] = [];
      for (const predictionId of predictionIds) {
        let prediction: Prediction;
        const key = `chain::${(currentChain ?? defaultChain).id}::pool::${poolId}::prediction::${Number(predictionId)}`;

        if (completionTime > 0) {
          prediction = await cache.retrieve(key);
          if (prediction) {
            // Necessary to restore callable methods on retrieved instance
            prediction = Object.setPrototypeOf(prediction, Prediction.prototype);
            predictions.push(prediction);
            continue;
          }
        }

        const raw = await readContract('getPrediction', [BigInt(poolId), predictionId]);
        if (!raw) return null;
        prediction = new Prediction(raw);

        if (prediction.claimWinningsTime > 0 || (completionTime > 0 && !prediction.isAWinner)) {
          await cache.save(key, prediction);
        }
        predictions.push(prediction);
      }
      return predictions;
    } catch (error) {
      console.error(error);
      toastError(`${error}`);
      return null;
    }
  };
};
