import { useContract } from '@/contexts';
import { Pool, Prediction } from '@/schemas';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export interface ActivityPredict {
  pool: Pool;
  prediction: Prediction;
}

interface MyPredictActivityContextProps {
  activityCount: number | null;
  currentPage: number | null;
  fetchMyActivity: (page?: number, rows?: number) => void;
  isFetching: boolean;
  hasError: boolean;
  rowsPerPage: number;
  setRowsPerPage: (value: number) => void;
  myActivities: ActivityPredict[];
  updateActivityCount: () => void;
  updateCurrentPage: (value: number) => void;
}

const MyPredictActivityContext = createContext<MyPredictActivityContextProps>({
  activityCount: null,
  currentPage: null,
  fetchMyActivity: () => {},
  isFetching: false,
  hasError: false,
  myActivities: [],
  rowsPerPage: 100,
  setRowsPerPage: () => {},
  updateActivityCount: () => {},
  updateCurrentPage: () => {}
});

export const useMyPredictActivity = () => useContext(MyPredictActivityContext);

export const MyPredictActivityProvider = ({ children }: { children: ReactNode }) => {
  const { address, chain: currentChain } = useAccount();
  const { readContract } = useContract();
  const [rowsPerPage, setRowsPerPage] = useState(
    Number(localStorage.getItem('myActivityPredictionsRowsPerPage')) || 100
  );

  const getLastPage = (total: number) => {
    const last = Math.ceil(total / rowsPerPage);
    return last == 0 ? 0 : last - 1;
  };

  const [noOfPredictions, setNoOfPredictions] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [myActivities, setMyActivities] = useState<ActivityPredict[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const updateActivityCount = async (showLoading = false) => {
    if (!address) return;
    // Only show loading if requested or if there is no previous data
    if (showLoading || noOfPredictions === null) setIsFetching(true);

    const stats = await readContract({
      contract: 'getters',
      functionName: 'userStats',
      args: [address]
    });
    if (stats) {
      if (noOfPredictions == Number(stats.noOfPredictions)) setIsFetching(false);
      setNoOfPredictions(Number(stats.noOfJoinedPools));
      setHasError(false);
    } else {
      // Only set error if the previous value was null
      // This is to allow valid data to be displayed even if the
      // current data might have needed an update
      if (noOfPredictions === null) setHasError(true);
      setIsFetching(false);
    }
  };

  const fetchMyActivity = async (page = currentPage, rows = rowsPerPage) => {
    if (noOfPredictions === 0) {
      setMyActivities([]);
      setIsFetching(false);
      return;
    }

    if (!noOfPredictions || page === null || !address) return;

    setIsFetching(true);
    let start = (page + 1) * rows - rows;
    const rawRecords = (await readContract({
      contract: 'getters',
      functionName: 'userPredictionRecordsPaginated',
      args: [address, start, rows]
    })) as any;
    if (rawRecords) {
      // TODO: Optimise later to only fetch pools uniquely
      const rawPools = (await readContract({
        contract: 'getters',
        functionName: 'pools',
        args: [rawRecords.map(({ poolId }: any) => poolId)]
      })) as any;
      const pools = rawPools.map((p: any) => new Pool(p));

      const rawPredictions = (await readContract({
        contract: 'getters',
        functionName: 'predictions',
        args: [rawRecords.map(({ predictionId }: any) => predictionId)]
      })) as any;
      const predictions = rawPredictions.map((p: any) => new Prediction(p));

      const activities: ActivityPredict[] = rawRecords.map((_: any, i: number) => ({
        pool: pools[i],
        prediction: predictions[i]
      }));
      setMyActivities([...activities.reverse()]);
      setHasError(false);
    } else {
      setHasError(true);
    }
    setIsFetching(false);
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
      setNoOfPredictions(null);
      setCurrentPage(null);
    } else {
      updateActivityCount();
    }
  }, [address, currentChain]);

  useEffect(() => {
    if (noOfPredictions !== null) {
      // The below is to set the currentPage to the last page on
      // initial load or disconnect wallet and connect back
      if (currentPage === null) {
        setCurrentPage(getLastPage(noOfPredictions));
        fetchMyActivity(getLastPage(noOfPredictions));
      }

      // Re-Fetch MyActivity on update of noOfJoinedPools
      if (currentPage !== null) fetchMyActivity(currentPage);
    }
  }, [noOfPredictions]);

  useEffect(() => {
    updateActivityCount();
  }, []);

  return (
    <MyPredictActivityContext.Provider
      value={{
        activityCount: noOfPredictions,
        currentPage,
        fetchMyActivity,
        isFetching,
        myActivities,
        hasError,
        rowsPerPage,
        setRowsPerPage,
        updateActivityCount,
        updateCurrentPage: setCurrentPage
      }}
    >
      {children}
    </MyPredictActivityContext.Provider>
  );
};
