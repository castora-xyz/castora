import {
  WriteContractStatus,
  useContract,
  useFirebase,
  useServer,
  useToast
} from '@/contexts';
import { Pool } from '@/schemas';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import { Observable } from 'rxjs';
import { useChains } from 'wagmi';

export type WriteContractPoolStatus = WriteContractStatus | 'finalizing';

interface PoolsContextProps {
  claimWinnings: (
    poolId: number,
    predictionId: number,
    onSuccessCallback?: (explorerUrl: string) => void
  ) => Observable<WriteContractPoolStatus>;
  isFetching: boolean;
  isValidPoolId: (poolId: any) => Promise<boolean>;
  fetchOne: (poolId: number) => Promise<Pool | null>;
  livePools: Pool[];
  predict: (
    poolId: number,
    price: number,
    onSuccessCallback?: (explorerUrl: string) => void
  ) => Observable<WriteContractPoolStatus>;
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
  const { ensureNotifications, firestore, recordEvent } = useFirebase();
  const server = useServer();
  const { toastError, toastSuccess } = useToast();

  const [isFetching, setIsFetching] = useState(true);
  const [livePools, setLivePools] = useState<Pool[]>([]);
  const [livePoolIds, setLivePoolIds] = useState<number[]>([]);

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
    return new Observable<WriteContractPoolStatus>((subscriber) => {
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

          subscriber.next('finalizing');
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
    const sorted = livePoolIds.sort((a, b) => b - a);
    for (const poolId of sorted) {
      const pool = await fetchOne(poolId);
      if (pool) fetched.push(pool);
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
    return new Observable<WriteContractPoolStatus>((subscriber) => {
      let predictionId: number;
      let txHash: string;
      writeContract(
        'predict',
        [BigInt(poolId), BigInt(price)],
        (hash, result) => {
          txHash = hash;
          predictionId = Number(result);
        }
      ).subscribe({
        next: subscriber.next.bind(subscriber),
        error: subscriber.error.bind(subscriber),
        complete: async () => {
          if (!txHash) {
            subscriber.error('Transaction Failed');
            return;
          }

          subscriber.next('finalizing');
          await ensureNotifications();
          await server.get(`/record/${txHash}`);
          recordEvent('predicted', { poolId, predictionId });
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
  }, [livePoolIds]);

  useEffect(() => {
    onSnapshot(doc(firestore, '/live/live'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if ('poolIds' in data && Array.isArray(data.poolIds)) {
          setLivePoolIds(data.poolIds);
        }
      } else {
        setLivePoolIds([]);
      }
    });
  }, []);

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
