import {
  CASTORA_ADDRESS,
  abi,
  useContract,
  usePools,
  usePredictions
} from '@/contexts';
import { Pool, Prediction } from '@/models';
import { useEffect, useState } from 'react';
import { useAccount, useWatchContractEvent } from 'wagmi';

export interface Activity {
  pool: Pool;
  prediction: Prediction;
}

export const useMyActivity = () => {
  const { address } = useAccount();
  const { readContract } = useContract();
  const { fetchOne: fetchPool } = usePools();
  const retrieve = usePredictions();
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const load = async () => {
    if (!address) {
      setIsFetching(false);
      setHasError(false);
      setMyActivities([]);
      return;
    }

    setIsFetching(true);

    const noOfJoinedPools = (await readContract('noOfJoinedPoolsByAddresses', [
      address!
    ])) as number | null;
    if (noOfJoinedPools === null) {
      setIsFetching(false);
      setHasError(true);
      return;
    }

    let joinedPoolIds: number[] = [];
    for (let i = 0; i < noOfJoinedPools; i++) {
      const poolId = (await readContract('joinedPoolIdsByAddresses', [
        address!,
        i
      ])) as bigint | null;
      if (!poolId) {
        setIsFetching(false);
        setHasError(true);
        return;
      }
      joinedPoolIds.push(Number(poolId));
    }
    // making them unique because the same pool can be joined multiple times
    joinedPoolIds = [...new Set(joinedPoolIds)];

    const poolInfos = [];
    for (let i = 0; i < joinedPoolIds.length; i++) {
      const predictionIds = (await readContract('getPredictionIdsForAddress', [
        BigInt(joinedPoolIds[i]),
        address!
      ])) as bigint[] | null;
      if (!predictionIds) {
        setIsFetching(false);
        setHasError(true);
        return;
      }
      poolInfos.push({ poolId: joinedPoolIds[i], predictionIds });
    }

    const activities: Activity[] = [];
    for (const { poolId, predictionIds } of poolInfos) {
      const pool = await fetchPool(poolId);
      if (!pool) {
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

      for (const prediction of predictions) {
        activities.push({ pool, prediction });
      }
    }

    // sort by latest made predictions first
    activities.sort((a, b) => b.prediction.time - a.prediction.time);

    setMyActivities(activities);
    setIsFetching(false);
    setHasError(false);
  };

  useWatchContractEvent({
    address: CASTORA_ADDRESS,
    abi,
    eventName: 'Predicted',
    args: { predicter: address },
    onLogs: async (logs) => {
      console.log('MyActivityContext.tsx Predicted');
      console.log(logs);
      await load();
    }
  });

  useWatchContractEvent({
    address: CASTORA_ADDRESS,
    abi,
    eventName: 'ClaimedWinnings',
    args: { winner: address },
    onLogs: async (logs) => {
      console.log('MyActivityContext.tsx ClaimedWinnings');
      console.log(logs);
      await load();
    }
  });

  useEffect(() => {
    load();
  }, [address]);

  return { fetchMyActivity: load, isFetching, myActivities, hasError };
};
