import { abi, useContract, usePools, useServer, useToast } from '@/contexts';
import { Prediction } from '@/schemas';
import { useEffect, useState } from 'react';
import { useAccount, useWatchContractEvent } from 'wagmi';

export const usePredictions = () => {
  const { chain: currentChain } = useAccount();
  const { readContract } = useContract();
  const { isValidPoolId } = usePools();
  const { toastError } = useToast();
  const server = useServer();

  return async (
    poolId: number,
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
              const url = `${currentChain.blockExplorers?.default.url}/tx/${txHash}`;
              explorerUrls[predictionId] = url;
            }
          }
        }
      }

      const predictions = [];
      for (const predictionId of predictionIds) {
        const raw = await readContract('getPrediction', [
          BigInt(poolId),
          predictionId
        ]);
        const prediction = new Prediction(raw);
        if (fetchExplorerUrls) {
          prediction.explorerUrl = explorerUrls[prediction.id] ?? null;
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

export const useMyPredictions = (poolId: number) => {
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
      BigInt(poolId),
      address!
    ])) as bigint[] | null;
    if (!predictionIds) {
      setIsFetching(false);
      setHasError(true);
      return;
    }

    const predictions = await retrieve(poolId, predictionIds);
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
    args: { poolId: BigInt(poolId), predicter: address },
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
