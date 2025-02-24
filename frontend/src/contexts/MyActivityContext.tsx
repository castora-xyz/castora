import {
  abi,
  useContract,
  usePools,
  usePredictions,
  useServer
} from '@/contexts';
import { Pool, Prediction } from '@/schemas';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import { zeroAddress } from 'viem';
import { useAccount, useWatchContractEvent } from 'wagmi';

export interface Activity {
  pool: Pool;
  prediction: Prediction;
}

interface MyActivityContextProps {
  fetchMyActivity: () => void;
  isFetching: boolean;
  hasError: boolean;
  myActivities: Activity[];
}

const MyActivityContext = createContext<MyActivityContextProps>({
  fetchMyActivity: () => {},
  isFetching: false,
  hasError: false,
  myActivities: []
});

export const useMyActivity = () => useContext(MyActivityContext);

export const MyActivityProvider = ({ children }: { children: ReactNode }) => {
  const { address, chain: currentChain } = useAccount();
  const { castoraAddress, readContract } = useContract();
  const { fetchOne: fetchPool } = usePools();
  const retrieve = usePredictions();
  const server = useServer();

  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchMyActivity = async () => {
    if (!address || !currentChain) {
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

    const explorerUrls: { [key: string]: string } = {};
    const offchained = await server.get(`/user/${address}/activities`);
    if (offchained && Array.isArray(offchained) && offchained.length > 0) {
      for (const item of offchained) {
        const { poolId, predictionId, txHash } = item;
        if (!poolId || !predictionId || !txHash) continue;
        const url = `${currentChain.blockExplorers?.default.url}/tx/${txHash}`;
        explorerUrls[`pl${poolId}-pr${predictionId}`] = url;
      }
    }

    const activities: Activity[] = [];
    for (const { poolId, predictionIds } of poolInfos) {
      const pool = await fetchPool(poolId);
      if (!pool) {
        setIsFetching(false);
        setHasError(true);
        return;
      }

      const predictions = await retrieve(pool, predictionIds, false);
      if (!predictions) {
        setIsFetching(false);
        setHasError(true);
        return;
      }

      for (const prediction of predictions) {
        const url = explorerUrls[`pl${poolId}-pr${prediction.id}`];
        if (url) prediction.explorerUrl = url;
        activities.push({ pool, prediction });
      }
    }

    // sort by latest made predictions first
    activities.sort((a, b) => b.prediction.time - a.prediction.time);

    setMyActivities(activities);
    setIsFetching(false);
    setHasError(false);
  };

  // TODO: Review if this watcher is updated for every chain (contract address)
  // change
  useWatchContractEvent({
    address: castoraAddress,
    abi,
    eventName: 'Predicted',
    args: { predicter: address ?? zeroAddress },
    onLogs: async (logs) => {
      let hasChanges = false;
      const flattened: { [key: number]: number[] } = {};
      for (const { pool, prediction } of myActivities) {
        flattened[pool.poolId] = [
          ...(flattened[pool.poolId] ?? []),
          prediction.id
        ];
      }
      for (const { args } of logs) {
        if (!Object.keys(flattened).includes(`${Number(args.poolId)}`)) {
          hasChanges = true;
        } else {
          for (const [poolId, predictionIds] of Object.entries(flattened)) {
            hasChanges =
              +poolId == Number(args.poolId) &&
              !predictionIds.includes(Number(args.predictionId));
            if (hasChanges) break;
          }
        }
        if (hasChanges) break;
      }
      if (hasChanges) await fetchMyActivity();
    }
  });

  /*
   * Not Watching ClaimWinnings Event here so that the ClaimButton's Modal
   * will not be destroyed after successful Claiming. The onSuccess callback
   * from ClaimButton will trigger a reload.
   */

  useEffect(() => {
    setTimeout(fetchMyActivity, 0);
  }, [address, currentChain]);

  return (
    <MyActivityContext.Provider
      value={{ fetchMyActivity, isFetching, myActivities, hasError }}
    >
      {children}
    </MyActivityContext.Provider>
  );
};
