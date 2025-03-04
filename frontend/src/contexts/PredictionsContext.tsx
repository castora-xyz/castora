import {
  abi,
  useCache,
  useContract,
  usePools,
  useServer,
  useToast
} from '@/contexts';
import { Pool, Prediction } from '@/schemas';
import { useEffect, useState } from 'react';
import { useAccount, useChains, useWatchContractEvent } from 'wagmi';

export const usePredictions = () => {
  const { chain: currentChain } = useAccount();
  const [defaultChain] = useChains();
  const cache = useCache();
  const { readContract } = useContract();
  const { isValidPoolId } = usePools();
  const { toastError } = useToast();
  const server = useServer();

  return async (
    { poolId, completionTime }: Pool,
    predictionIds: bigint[],
    fetchExplorerUrls = true
  ) => {
    try {
      if (!(await isValidPoolId(poolId))) return null;

      const explorerUrls: { [key: number]: string } = {};
      if (fetchExplorerUrls && predictionIds.length > 0) {
        const activities = await server.get(`/pool/${poolId}/activities`);
        if (activities && Array.isArray(activities) && activities.length > 0) {
          for (const activity of activities) {
            const { predictionId, txHash } = activity;
            if (!predictionId || !txHash) continue;
            if (currentChain) {
              const url = `${
                (currentChain ?? defaultChain).blockExplorers?.default.url
              }/tx/${txHash}`;
              explorerUrls[predictionId] = url;
            }
          }
        }
      }

      const predictions: Prediction[] = [];
      for (const predictionId of predictionIds) {
        const key = `chain::${
          (currentChain ?? defaultChain).id
        }::pool::${poolId}::prediction::${Number(predictionId)}`;
        let prediction = await cache.retrieve(key);
        if (prediction) {
          // Necessary to restore callable methods on retrieved instance
          prediction = Object.setPrototypeOf(prediction, Prediction.prototype);
          predictions.push(prediction as Prediction);
          continue;
        }

        const raw = await readContract('getPrediction', [
          BigInt(poolId),
          predictionId
        ]);
        if (!raw) return null;
        
        prediction = new Prediction(raw);
        if (fetchExplorerUrls) {
          prediction.explorerUrl = explorerUrls[prediction.id] ?? null;
        }
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
  const { castoraAddress, readContract } = useContract();
  const retrieve = usePredictions();

  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const load = async () => {
    if (!address) {
      setIsFetching(false);
      setHasError(false);
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
      setHasError(true);
      return;
    }

    const predictions = await retrieve(pool, predictionIds);
    if (!predictions) {
      setIsFetching(false);
      setHasError(true);
      return;
    }

    setMyPredictions(predictions.sort((a, b) => b.id - a.id));
    setHasError(false);
    setIsFetching(false);
  };

  // TODO: Review if this watcher is updated for every chain (contract address)
  // change
  useWatchContractEvent({
    address: castoraAddress,
    abi,
    eventName: 'Predicted',
    args: { poolId: BigInt(pool.poolId), predicter: address },
    onLogs: async (logs) => {
      let hasChanges = false;
      for (const { args } of logs) {
        hasChanges = myPredictions.every(
          (p) => p.id != Number(args.predictionId)
        );
        if (hasChanges) break;
      }
      if (hasChanges) await load();
    }
  });

  /*
   * Not Watching ClaimWinnings Event here so that the ClaimButton's Modal
   * will not be destroyed after successful Claiming. The onSuccess callback
   * from ClaimButton will trigger a reload.
   */

  useEffect(() => {
    load();
  }, [address, currentChain]);

  return { fetchMyPredictions: load, isFetching, hasError, myPredictions };
};
