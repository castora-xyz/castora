import {
  useCache,
  useContract,
  usePaginators,
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
import { useAccount } from 'wagmi';

export interface Activity {
  pool: Pool;
  prediction: Prediction;
}

interface MyActivityContextProps {
  activityCount: number | null;
  currentPage: number | null;
  fetchMyActivity: (page?: number, rows?: number) => void;
  isFetching: boolean;
  hasError: boolean;
  myActivities: Activity[];
  updateActivityCount: () => void;
  updateCurrentPage: (value: number) => void;
}

const MyActivityContext = createContext<MyActivityContextProps>({
  activityCount: null,
  currentPage: null,
  fetchMyActivity: () => {},
  isFetching: false,
  hasError: false,
  myActivities: [],
  updateActivityCount: () => {},
  updateCurrentPage: () => {}
});

export const useMyActivity = () => useContext(MyActivityContext);

export const MyActivityProvider = ({ children }: { children: ReactNode }) => {
  const { address, chain: currentChain } = useAccount();
  const { save, retrieve } = useCache();
  const { readContract } = useContract();
  const { fetchOne: fetchPool } = usePools();
  const paginators = usePaginators();
  const fetchPredictions = usePredictions();
  const server = useServer();

  const [noOfJoinedPools, setNoOfJoinedPools] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const updateActivityCount = async (showLoading = false) => {
    if (!address || !currentChain) return;
    // Only show loading if requested or if there is no previous data
    if (showLoading || noOfJoinedPools === null) setIsFetching(true);

    const count = await readContract('noOfJoinedPoolsByAddresses', [address!]);
    if (count !== null) {
      if (noOfJoinedPools == Number(count)) setIsFetching(false);
      setNoOfJoinedPools(Number(count));
      setHasError(false);
    } else {
      // Only set error if the previous value was nul l
      // This is to allow valid data to be displayed even if the
      // current data might have needed an update
      if (noOfJoinedPools === null) setHasError(true);
      setIsFetching(false);
    }
  };

  const fetchMyActivity = async (
    page = currentPage,
    rows = paginators.rowsPerPage
  ) => {
    if (!noOfJoinedPools || page === null || !address || !currentChain) return;

    setIsFetching(true);
    let start = (page + 1) * rows - 1;
    if (start >= noOfJoinedPools - 1) start = noOfJoinedPools - 1;
    const target = page * rows;

    let poolIds: number[] = [];
    for (let i = start; i >= target; i--) {
      const key = `chain::${currentChain.id}::address::${address}::activity::${i}`;
      let poolId = await retrieve(key);
      if (!poolId) {
        poolId = await readContract('joinedPoolIdsByAddresses', [address!, i]);
        if (!poolId) {
          setIsFetching(false);
          setHasError(true);
          return;
        } else await save(key, Number(poolId));
      }
      poolIds.push(Number(poolId));
    }

    const uniqued = [...new Set(poolIds)];
    const poolInfos = [];
    let predictionsSum = 0;
    for (let i = 0; i < uniqued.length; i++) {
      const predictionIds = (await readContract('getPredictionIdsForAddress', [
        BigInt(uniqued[i]),
        address!
      ])) as bigint[] | null;
      if (!predictionIds) {
        setIsFetching(false);
        setHasError(true);
        return;
      }
      poolInfos.push({ poolId: uniqued[i], predictionIds });
      predictionsSum += predictionIds.length;
    }

    if (poolIds.length != predictionsSum) {
      // TODO: Filter out the right predictions to show for the overlap
    }

    // Using the fetched user addresses to minimize calls for each pool
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

      const predictions = await fetchPredictions(pool, predictionIds, false);
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

  /*
   * Not Watching ClaimWinnings Event here so that the ClaimButton's Modal
   * will not be destroyed after successful Claiming. The onSuccess callback
   * from ClaimButton will trigger a reload.
   */

  useEffect(() => {
    if (!address || !currentChain) {
      setIsFetching(false);
      setHasError(false);
      setMyActivities([]);
      setNoOfJoinedPools(null);
      setCurrentPage(null);
    } else {
      updateActivityCount();
    }
  }, [address, currentChain]);

  useEffect(() => {
    if (noOfJoinedPools !== null) {
      // The below is to set the currentPage to the last page on
      // initial load or disconnect wallet and connect back
      if (currentPage === null) {
        setCurrentPage(paginators.getLastPage(noOfJoinedPools));
        fetchMyActivity(paginators.getLastPage(noOfJoinedPools));
      }

      // Re-Fetch MyActivity on update of noOfJoinedPools
      if (currentPage !== null) fetchMyActivity(currentPage);
    }
  }, [noOfJoinedPools]);

  useEffect(() => {
    updateActivityCount();
  }, []);

  return (
    <MyActivityContext.Provider
      value={{
        activityCount: noOfJoinedPools,
        currentPage,
        fetchMyActivity,
        isFetching,
        myActivities,
        hasError,
        updateActivityCount,
        updateCurrentPage: setCurrentPage
      }}
    >
      {children}
    </MyActivityContext.Provider>
  );
};
