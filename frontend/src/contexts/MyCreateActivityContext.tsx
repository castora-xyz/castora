import { useContract } from '@/contexts';
import { Pool, UserCreatedPool } from '@/schemas';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export interface ActivityCreate {
  pool: Pool;
  userCreated: UserCreatedPool;
}

interface MyCreateActivityContextProps {
  activityCount: number | null;
  currentPage: number | null;
  fetchMyActivity: (page?: number, rows?: number) => void;
  isFetching: boolean;
  hasError: boolean;
  rowsPerPage: number;
  isFetchingUnclaimed: boolean;
  myUnclaimedPoolIds: number[];
  myUnclaimedUserCreateds: UserCreatedPool[];
  setRowsPerPage: (value: number) => void;
  myActivities: ActivityCreate[];
  updateActivityCount: () => void;
  updateCurrentPage: (value: number) => void;
  updateUnclaimed: () => void;
}

const MyCreateActivityContext = createContext<MyCreateActivityContextProps>({
  activityCount: null,
  currentPage: null,
  fetchMyActivity: () => {},
  isFetching: false,
  hasError: false,
  myActivities: [],
  rowsPerPage: 100,
  isFetchingUnclaimed: false,
  myUnclaimedPoolIds: [],
  myUnclaimedUserCreateds: [],
  setRowsPerPage: () => {},
  updateActivityCount: () => {},
  updateCurrentPage: () => {},
  updateUnclaimed: () => {}
});

export const useMyCreateActivity = () => useContext(MyCreateActivityContext);

export const MyCreateActivityProvider = ({ children }: { children: ReactNode }) => {
  const { address, chain: currentChain } = useAccount();
  const { readContract } = useContract();
  const [rowsPerPage, setRowsPerPage] = useState(Number(localStorage.getItem('myActivityCreationsRowsPerPage')) || 100);

  const getLastPage = (total: number) => {
    const last = Math.ceil(total / rowsPerPage);
    return last == 0 ? 0 : last - 1;
  };

  const [noOfPoolsCreated, setNoOfPoolsCreated] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [myActivities, setMyActivities] = useState<ActivityCreate[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isFetchingUnclaimed, setIsFetchingUnclaimed] = useState(true);
  const [myUnclaimedPoolIds, setMyUnclaimedPoolIds] = useState([]);
  const [myUnclaimedUserCreateds, setMyUnclaimedUserCreateds] = useState([]);

  const updateUnclaimed = async () => {
    if (!address) return;

    setIsFetchingUnclaimed(true);
    const poolIds = await readContract({
      contract: 'pools-manager',
      functionName: 'getUserClaimableFeesPoolIdsPaginated',
      args: [address, 0, 250]
    });
    if (poolIds) {
      const raws = await readContract({
        contract: 'pools-manager',
        functionName: 'getUserCreatedPools',
        args: [poolIds]
      });
      if (raws) {
        setMyUnclaimedPoolIds(poolIds.map((pI: any) => Number(pI)));
        setMyUnclaimedUserCreateds(raws.map((u: any) => new UserCreatedPool(u)));
      } else {
        setMyUnclaimedPoolIds([]);
        setMyUnclaimedUserCreateds([]);
      }
    } else {
      setMyUnclaimedPoolIds([]);
      setMyUnclaimedUserCreateds([]);
    }
    setIsFetchingUnclaimed(false);
  };

  const updateActivityCount = async (showLoading = false) => {
    if (!address) return;
    // Only show loading if requested or if there is no previous data
    if (showLoading || noOfPoolsCreated === null) setIsFetching(true);

    const raw = await readContract({
      contract: 'pools-manager',
      functionName: 'getUserStats',
      args: [address]
    });
    if (raw !== null) {
      if (noOfPoolsCreated == Number(raw.noOfPoolsCreated)) setIsFetching(false);
      setNoOfPoolsCreated(Number(raw.noOfPoolsCreated));
      setHasError(false);
    } else {
      // Only set error if the previous value was null
      // This is to allow valid data to be displayed even if the
      // current data might have needed an update
      if (noOfPoolsCreated === null) setHasError(true);
      setIsFetching(false);
    }
  };

  const fetchMyActivity = async (page = currentPage, rows = rowsPerPage) => {
    if (!noOfPoolsCreated || page === null || !address) return;

    setIsFetching(true);
    let start = (page + 1) * rows - rows;
    const poolIds = await readContract({
      contract: 'pools-manager',
      functionName: 'getUserCreatedPoolIdsPaginated',
      args: [address, start, rows]
    });
    if (poolIds) {
      const raw1 = await readContract({
        contract: 'castora',
        functionName: 'getPools',
        args: [poolIds]
      });
      const raw2 = await readContract({
        contract: 'pools-manager',
        functionName: 'getUserCreatedPools',
        args: [poolIds]
      });
      if (raw1 && raw2) {
        let activities: ActivityCreate[] = [];
        for (let i = 0; i < poolIds.length; i++) {
          activities.push({
            pool: new Pool(raw1[i]),
            userCreated: new UserCreatedPool(raw2[i])
          });
        }
        setMyActivities([...activities.reverse()]);
        setHasError(false);
      } else setHasError(true);
    } else {
      setHasError(true);
    }
    setIsFetching(false);
  };

  useEffect(() => {
    if (!address || !currentChain) {
      setIsFetching(false);
      setHasError(false);
      setMyActivities([]);
      setNoOfPoolsCreated(null);
      setCurrentPage(null);
      setIsFetchingUnclaimed(false);
      setMyUnclaimedPoolIds([]);
      setMyUnclaimedUserCreateds([]);
    } else {
      updateActivityCount();
      updateUnclaimed();
    }
  }, [address, currentChain]);

  useEffect(() => {
    if (noOfPoolsCreated !== null) {
      // The below is to set the currentPage to the last page on
      // initial load or disconnect wallet and connect back
      if (currentPage === null) {
        setCurrentPage(getLastPage(noOfPoolsCreated));
        fetchMyActivity(getLastPage(noOfPoolsCreated));
      }

      // Re-Fetch MyActivity on update of noOfPoolsCreated
      if (currentPage !== null) fetchMyActivity(currentPage);
    }
  }, [noOfPoolsCreated]);

  useEffect(() => {
    updateActivityCount();
    updateUnclaimed();
  }, []);

  return (
    <MyCreateActivityContext.Provider
      value={{
        activityCount: noOfPoolsCreated,
        currentPage,
        fetchMyActivity,
        isFetching,
        myActivities,
        hasError,
        rowsPerPage,
        setRowsPerPage,
        isFetchingUnclaimed,
        myUnclaimedPoolIds,
        myUnclaimedUserCreateds,
        updateActivityCount,
        updateCurrentPage: setCurrentPage,
        updateUnclaimed
      }}
    >
      {children}
    </MyCreateActivityContext.Provider>
  );
};
