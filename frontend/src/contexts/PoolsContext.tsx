import {
  WriteContractStatus,
  useCache,
  useContract,
  useFirebase,
  useToast
} from '@/contexts';
import { Pool, PoolSeeds } from '@/schemas';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import { Observable } from 'rxjs';
import { useAccount, useChains } from 'wagmi';

export type WriteContractPoolStatus = WriteContractStatus | 'finalizing';

interface PoolsContextProps {
  claimWinnings: (
    poolId: number,
    predictionId: number,
    onSuccessCallback?: (explorerUrl: string) => void
  ) => Observable<WriteContractPoolStatus>;
  claimWinningsBulk: (
    poolIds: number[],
    predictionIds: number[],
    onSuccessCallback?: (explorerUrl: string) => void
  ) => Observable<WriteContractPoolStatus>;
  exprtlPools: Pool[];
  isFetchingLive: boolean;
  isFetchingExprtl: boolean;
  isValidPoolId: (poolId: any) => Promise<boolean>;
  fetchOne: (poolId: number) => Promise<Pool | null>;
  livePools: Pool[];
  predict: (
    poolId: number,
    price: number,
    stakeToken: string,
    stakeAmount: number,
    onSuccessCallback?: (explorerUrl: string) => void
  ) => Observable<WriteContractPoolStatus>;
}

const PoolsContext = createContext<PoolsContextProps>({
  claimWinnings: () => new Observable(),
  claimWinningsBulk: () => new Observable(),
  exprtlPools: [],
  isFetchingLive: true,
  isFetchingExprtl: true,
  isValidPoolId: async () => false,
  fetchOne: async () => null,
  livePools: [],
  predict: () => new Observable()
});

export const usePools = () => useContext(PoolsContext);

export const PoolsProvider = ({ children }: { children: ReactNode }) => {
  const { chain: currentChain } = useAccount();
  const cache = useCache();
  const [defaultChain] = useChains();
  const { castoraAddress, readContract, writeContract } = useContract();
  const { ensureNotifications, firestore, recordEvent } = useFirebase();
  const { toastError, toastSuccess } = useToast();

  const [isFetchingExprtl, setIsFetchingExprtl] = useState(true);
  const [isFetchingLive, setIsFetchingLive] = useState(true);
  const [exprtlPools, setExprtlPools] = useState<Pool[]>([]);
  const [exprtlPoolIds, setExprtlPoolIds] = useState<number[]>([]);
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
        undefined,
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
          recordEvent('claimed_winnings', { poolId, predictionId });
          const explorerUrl = `${
            (currentChain ?? defaultChain).blockExplorers?.default.url
          }/tx/${txHash}`;
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

  const claimWinningsBulk = (
    poolIds: number[],
    predictionIds: number[],
    onSuccessCallback?: (explorerUrl: string) => void
  ) => {
    return new Observable<WriteContractPoolStatus>((subscriber) => {
      let txHash: string;
      writeContract(
        'claimWinningsBulk',
        [poolIds.map((i) => BigInt(i)), predictionIds.map((i) => BigInt(i))],
        undefined,
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
          recordEvent('claimed_winnings_bulk', { poolIds, predictionIds });
          const explorerUrl = `${
            (currentChain ?? defaultChain).blockExplorers?.default.url
          }/tx/${txHash}`;
          toastSuccess(
            'Bulk Withdrawals Successful',
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
      const key = `chain::${
        (currentChain ?? defaultChain).id
      }::pool::${poolId}`;
      let pool = await cache.retrieve(key);
      if (pool) {
        // Necessary to restore callable methods on retrieved instance
        pool = Object.setPrototypeOf(pool, Pool.prototype);
        pool.seeds = Object.setPrototypeOf(pool.seeds, PoolSeeds.prototype);
        return pool;
      }

      if (!(await isValidPoolId(poolId))) return null;
      const raw = await readContract('pools', [BigInt(poolId)]);
      if (!raw) return null;

      pool = new Pool(raw);
      if (pool.completionTime > 0) await cache.save(key, pool);
      return pool;
    } catch (error) {
      console.error(error);
      toastError(`${error}`);
      return null;
    }
  };

  const fetchExprtlPools = async () => {
    setIsFetchingExprtl(true);
    const fetched = [];
    const sorted = exprtlPoolIds.sort((a, b) => b - a);
    for (const poolId of sorted) {
      const pool = await fetchOne(poolId);
      if (pool) fetched.push(pool);
    }
    setExprtlPools(fetched);
    setIsFetchingExprtl(false);
  };

  const fetchLivePools = async () => {
    setIsFetchingLive(true);
    const fetched = [];
    const sorted = livePoolIds.sort((a, b) => b - a);
    for (const poolId of sorted) {
      const pool = await fetchOne(poolId);
      if (pool) fetched.push(pool);
    }
    setLivePools(fetched);
    setIsFetchingLive(false);
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
    stakeToken: string,
    stakeAmount: number,
    onSuccessCallback?: (explorerUrl: string) => void
  ) => {
    return new Observable<WriteContractPoolStatus>((subscriber) => {
      let predictionId: number;
      let txHash: string;
      writeContract(
        'predict',
        [BigInt(poolId), BigInt(price)],
        ...[
          stakeToken.toLowerCase() == castoraAddress.toLowerCase()
            ? stakeAmount
            : undefined
        ],
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
          recordEvent('predicted', { poolId, predictionId });
          const explorerUrl = `${
            (currentChain ?? defaultChain).blockExplorers?.default.url
          }/tx/${txHash}`;
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
    fetchExprtlPools();
  }, [exprtlPoolIds]);

  useEffect(() => {
    fetchLivePools();
  }, [livePoolIds]);

  useEffect(() => {
    return onSnapshot(doc(firestore, '/live/experimentals'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if ('poolIds' in data && Array.isArray(data.poolIds)) {
          setExprtlPoolIds(data.poolIds);
        }
      } else {
        setExprtlPoolIds([]);
      }
    });
  }, [firestore]);

  useEffect(() => {
    return onSnapshot(doc(firestore, '/live/live'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if ('poolIds' in data && Array.isArray(data.poolIds)) {
          setLivePoolIds(data.poolIds);
        }
      } else {
        setLivePoolIds([]);
      }
    });
  }, [firestore]);

  return (
    <PoolsContext.Provider
      value={{
        claimWinnings,
        claimWinningsBulk,
        exprtlPools,
        isFetchingExprtl,
        isFetchingLive,
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
