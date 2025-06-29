import { useCache, useContract, usePools, useToast } from '@/contexts';
import { Pool, Prediction } from '@/schemas';
import { useEffect, useState } from 'react';
import { useAccount, useChains } from 'wagmi';

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
        const key = `chain::${
          (currentChain ?? defaultChain).id
        }::pool::${poolId}::prediction::${Number(predictionId)}`;

        if (completionTime > 0) {
          prediction = await cache.retrieve(key);
          if (prediction) {
            // Necessary to restore callable methods on retrieved instance
            prediction = Object.setPrototypeOf(
              prediction,
              Prediction.prototype
            );
            predictions.push(prediction);
            continue;
          }
        }

        const raw = await readContract('getPrediction', [
          BigInt(poolId),
          predictionId
        ]);
        if (!raw) return null;
        prediction = new Prediction(raw);

        if (
          prediction.claimWinningsTime > 0 ||
          (completionTime > 0 && !prediction.isAWinner)
        ) {
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

export const useMyPredictions = (pool: Pool) => {
  const { address, chain: currentChain } = useAccount();
  const { readContract } = useContract();
  const retrieve = usePredictions();

  const [myPredictions, setMyPredictions] = useState<Prediction[] | null>([]);
  const [hasEverFetched, setHasEverFetched] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const load = async () => {
    if (!address) {
      setIsFetching(false);
      setMyPredictions([]);
      return;
    }

    setIsFetching(true);

    const predictionIds = (await readContract('getPredictionIdsForAddress', [
      BigInt(pool.poolId),
      address!
    ])) as bigint[] | null;
    if (!predictionIds) {
      setIsFetching(false);
      setHasEverFetched(true);
      setMyPredictions(null);
      return;
    }

    const predictions = await retrieve(pool, predictionIds);
    if (!predictions) {
      setIsFetching(false);
      setHasEverFetched(true);
      setMyPredictions(null);
      return;
    }

    setMyPredictions(predictions.sort((a, b) => b.id - a.id));
    setIsFetching(false);
    setHasEverFetched(true);
  };

  useEffect(() => {
    load();
  }, [address, currentChain]);

  return { fetchMyPredictions: load, isFetching, hasEverFetched, myPredictions };
};
