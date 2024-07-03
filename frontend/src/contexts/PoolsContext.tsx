import {
  WriteContractStatus,
  useContract,
  useFirebase,
  useServer,
  useToast
} from '@/contexts';
import { Pool } from '@/models';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import { Observable } from 'rxjs';
import { useChains } from 'wagmi';

interface PoolsContextProps {
  claimWinnings: (
    poolId: number,
    predictionId: number,
    onSuccessCallback?: (explorerUrl: string) => void
  ) => Observable<WriteContractStatus>;
  isFetching: boolean;
  isValidPoolId: (poolId: any) => Promise<boolean>;
  fetchOne: (poolId: number) => Promise<Pool | null>;
  livePools: Pool[];
  predict: (
    poolId: number,
    price: number,
    onSuccessCallback?: (explorerUrl: string) => void
  ) => Observable<WriteContractStatus>;
}

const PoolsContext = createContext<PoolsContextProps>({
  claimWinnings: () => new Observable(),
  isFetching: true,
  isValidPoolId: async () => false,
  fetchOne: async () => null,
  livePools: [],
  predict: () => new Observable()
});

export const usePools = () => useContext(PoolsContext);

export const PoolsProvider = ({ children }: { children: ReactNode }) => {
  const [currentChain] = useChains();
  const { readContract, writeContract } = useContract();
  const { ensureNotifications, recordEvent } = useFirebase();
  const server = useServer();
  const { toastError, toastSuccess } = useToast();

  const [completedPoolsCount, setCompletedPoolsCount] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [livePools, setLivePools] = useState<Pool[]>([]);
  const [openPoolsCount, setOpenPoolsCount] = useState(0);
  const [secs, setSecs] = useState(0);

  const checkPoolCounts = () => {
    let openCount = 0;
    let completedCount = 0;
    for (const {
      seeds: { windowCloseTime, snapshotTime }
    } of livePools) {
      const now = Math.trunc(Date.now() / 1000);
      if (now < windowCloseTime) openCount++;
      else if (now >= snapshotTime) completedCount++;
    }
    setOpenPoolsCount(openCount);
    setCompletedPoolsCount(completedCount);
  };

  /**
   * Claims the winnings of a winner from a pool.
   * @param poolId The poolId of the pool from which to claim winnings.
   * @param predictionId The predictionId of the winning prediction to claim.
   * @param onSuccessCallback Callback with txHash as argument
   */
  const claimWinnings = (
    poolId: number,
    predictionId: number,
    onSuccessCallback?: (explorerUrl: string) => void
  ) => {
    return new Observable<WriteContractStatus>((subscriber) => {
      let txHash: string;
      writeContract(
        'claimWinnings',
        [BigInt(poolId), BigInt(predictionId)],
        (hash) => (txHash = hash)
      ).subscribe({
        next: subscriber.next.bind(subscriber),
        error: subscriber.error.bind(subscriber),
        complete: async () => {
          if (!txHash) {
            subscriber.error('Transaction Failed');
            return;
          }

          await server.get(`/record/${txHash}`);
          recordEvent('claimed_winnings', { poolId, predictionId });
          const explorerUrl = `${currentChain.blockExplorers?.default.url}/tx/${txHash}`;
          toastSuccess(
            'Withdrawal Successful',
            'View Transaction on Explorer',
            explorerUrl
          );
          onSuccessCallback && onSuccessCallback(explorerUrl);
          subscriber.complete();
        }
      });
    });
  };

  const fetchOne = async (poolId: number) => {
    try {
      if (!(await isValidPoolId(poolId))) return null;
      return new Pool(await readContract('pools', [BigInt(poolId)]));
    } catch (error) {
      console.error(error);
      toastError(`${error}`);
      return null;
    }
  };

  const fetchLivePools = async () => {
    setIsFetching(true);
    const fetched = [];
    let poolIds = await server.get('/pools/live');
    if (poolIds && Array.isArray(poolIds)) {
      poolIds = poolIds.sort((a, b) => b - a);
      for (const poolId of poolIds) {
        const pool = await fetchOne(poolId);
        if (pool) fetched.push(pool);
      }
    }
    setLivePools(fetched);
    setIsFetching(false);
  };

  const isValidPoolId = async (poolId: any) => {
    if (Number.isNaN(poolId) || +poolId <= 0 || !Number.isInteger(+poolId)) {
      return false;
    } else {
      const noOfPools = Number(await readContract('noOfPools'));
      return noOfPools !== Number.NaN ? poolId <= noOfPools : false;
    }
  };

  /**
   * Makes a prediction in a pool.
   * @param poolId The poolId of the pool to predict
   * @param price The entered price by the participant with decimals already shifted
   * @param onSuccessCallback Callback with txHash as argument
   */
  const predict = (
    poolId: number,
    price: number,
    onSuccessCallback?: (explorerUrl: string) => void
  ) => {
    return new Observable<WriteContractStatus>((subscriber) => {
      let txHash: string;
      writeContract(
        'predict',
        [BigInt(poolId), BigInt(price)],
        (hash) => (txHash = hash)
      ).subscribe({
        next: subscriber.next.bind(subscriber),
        error: subscriber.error.bind(subscriber),
        complete: async () => {
          if (!txHash) {
            subscriber.error('Transaction Failed');
            return;
          }

          await ensureNotifications();
          await server.get(`/record/${txHash}`);
          recordEvent('predicted', { poolId });
          const explorerUrl = `${currentChain.blockExplorers?.default.url}/tx/${txHash}`;
          toastSuccess(
            'Prediction Successful',
            'View Transaction on Explorer',
            explorerUrl
          );
          onSuccessCallback && onSuccessCallback(explorerUrl);
          subscriber.complete();
        }
      });
    });
  };

  useEffect(() => {
    fetchLivePools();
  }, [openPoolsCount, completedPoolsCount]);

  useEffect(() => {
    checkPoolCounts();
    const interval = setInterval(() => setSecs(secs + 1), 10000); // 10 secs
    return () => clearInterval(interval);
  }, [secs]);

  return (
    <PoolsContext.Provider
      value={{
        claimWinnings,
        isFetching,
        isValidPoolId,
        fetchOne,
        livePools,
        predict
      }}
    >
      {children}
    </PoolsContext.Provider>
  );
};
