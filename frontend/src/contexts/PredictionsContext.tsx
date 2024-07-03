import {
  CASTORA_ADDRESS,
  abi,
  useContract,
  usePools,
  useToast
} from '@/contexts';
import { Prediction } from '@/models';
import { useEffect, useState } from 'react';
import { useAccount, useWatchContractEvent } from 'wagmi';

export const usePredictions = () => {
  const { readContract } = useContract();
  const { isValidPoolId } = usePools();
  const { toastError } = useToast();

  return async (poolId: number, predictionIds: bigint[]) => {
    try {
      if (!(await isValidPoolId(poolId))) return null;
      const predictions = [];
      for (const predictionId of predictionIds) {
        const prediction = await readContract('getPrediction', [
          BigInt(poolId),
          predictionId
        ]);
        predictions.push(new Prediction(prediction));
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
  const { address } = useAccount();
  const { readContract } = useContract();
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

  useWatchContractEvent({
    address: CASTORA_ADDRESS,
    abi,
    eventName: 'Predicted',
    args: { poolId: BigInt(poolId), predicter: address },
    onLogs: async (logs) => {
      console.log('PredictionsContext.tsx Predicted');
      console.log(logs);
      await load();
    }
  });

  useWatchContractEvent({
    address: CASTORA_ADDRESS,
    abi,
    eventName: 'ClaimedWinnings',
    args: { poolId: BigInt(poolId), winner: address },
    onLogs: async (logs) => {
      console.log('PredictionsContext.tsx ClaimedWinnings');
      console.log(logs);
      await load();
    }
  });

  useEffect(() => {
    load();
  }, [address]);

  return { fetchMyPredictions: load, isFetching, hasError, myPredictions };
};
