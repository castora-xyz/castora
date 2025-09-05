import { WriteContractStatus, useCache, useContract, useFirebase, useToast } from '@/contexts';
import { Pool, PoolSeeds } from '@/schemas';
import { doc, onSnapshot } from 'firebase/firestore';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { Observable } from 'rxjs';
import { monadTestnet } from 'viem/chains';
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
  liveCryptoPools: Pool[];
  liveStocksPools: Pool[];
  isFetchingLiveCrypto: boolean;
  isFetchingLiveStocks: boolean;
  isValidPoolId: (poolId: any) => Promise<boolean>;
  fetchOne: (poolId: number) => Promise<Pool | null>;
  predict: (
    poolId: number,
    price: number,
    bulkCount: number | null,
    stakeToken: string,
    stakeAmount: number,
    onSuccessCallback?: (explorerUrl: string) => void
  ) => Observable<WriteContractPoolStatus>;
}

const PoolsContext = createContext<PoolsContextProps>({
  claimWinnings: () => new Observable(),
  claimWinningsBulk: () => new Observable(),
  liveCryptoPools: [],
  liveStocksPools: [],
  isFetchingLiveCrypto: true,
  isFetchingLiveStocks: true,
  isValidPoolId: async () => false,
  fetchOne: async () => null,
  predict: () => new Observable()
});

export const usePools = () => useContext(PoolsContext);

export const PoolsProvider = ({ children }: { children: ReactNode }) => {
  const { chain: currentChain } = useAccount();
  const cache = useCache();
  const [defaultChain] = useChains();
  const { castoraAddress, readContract, writeContract } = useContract();
  const { firestore, recordEvent } = useFirebase();
  const { toastError, toastSuccess } = useToast();

  const [isFetchingLiveStocks, setIsFetchingLiveStocks] = useState(true);
  const [isFetchingLiveCrypto, setIsFetchingLiveCrypto] = useState(true);
  const [liveCryptoPools, setLiveCryptoPools] = useState<Pool[]>([]);
  const [liveCryptoPoolIds, setLiveCryptoPoolIds] = useState<number[]>([]);
  const [liveStocksPools, setLiveStocksPools] = useState<Pool[]>([]);
  const [liveStocksPoolIds, setLiveStocksPoolIds] = useState<number[]>([]);

  const getChain = () => currentChain ?? defaultChain;
  const getChainName = () => ({ [monadTestnet.id]: 'monadtestnet' }[getChain().id]);

  /**
   * Claims the winnings of a winner from a pool.
   * @param poolId The poolId of the pool from which to claim winnings.
   * @param predictionId The predictionId of the winning prediction to claim.
   * @param onSuccessCallback Callback with txHash as argument
   */
  const claimWinnings = (poolId: number, predictionId: number, onSuccessCallback?: (explorerUrl: string) => void) => {
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
          const explorerUrl = `${getChain().blockExplorers?.default.url}/tx/${txHash}`;
          toastSuccess('Withdrawal Successful', 'View Transaction on Explorer', explorerUrl);
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
          const explorerUrl = `${getChain().blockExplorers?.default.url}/tx/${txHash}`;
          toastSuccess('Bulk Withdrawals Successful', 'View Transaction on Explorer', explorerUrl);
          onSuccessCallback && onSuccessCallback(explorerUrl);
          subscriber.complete();
        }
      });
    });
  };

  const fetchOne = async (poolId: number) => {
    try {
      const key = `chain::${getChain().id}::pool::${poolId}`;
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

  const fetchLiveStocksPools = async () => {
    setIsFetchingLiveStocks(true);
    const fetched = [];
    for (const poolId of liveStocksPoolIds) {
      const pool = await fetchOne(poolId);
      if (pool) fetched.push(pool);
    }
    setLiveStocksPools(fetched);
    setIsFetchingLiveStocks(false);
  };

  const fetchLiveCryptoPools = async () => {
    setIsFetchingLiveCrypto(true);
    const fetched = [];
    for (const poolId of liveCryptoPoolIds) {
      const pool = await fetchOne(poolId);
      if (pool) fetched.push(pool);
    }
    setLiveCryptoPools(fetched);
    setIsFetchingLiveCrypto(false);
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
    bulkCount: number | null,
    stakeToken: string,
    stakeAmount: number,
    onSuccessCallback?: (explorerUrl: string) => void
  ) => {
    return new Observable<WriteContractPoolStatus>((subscriber) => {
      let predictionIds: number[];
      let txHash: string;
      writeContract(
        bulkCount ? 'bulkPredict' : 'predict',
        [BigInt(poolId), BigInt(price), ...(bulkCount ? [BigInt(bulkCount)] : [])],
        ...[stakeToken.toLowerCase() == castoraAddress.toLowerCase() ? stakeAmount : undefined],
        (hash, result) => {
          txHash = hash;
          predictionIds = Array.isArray(result) ? result.map(Number) : [Number(result)];
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
          recordEvent(`${bulkCount ? 'bulk_' : ''}predicted`, {
            poolId,
            predictionIds
          });
          const explorerUrl = `${getChain().blockExplorers?.default.url}/tx/${txHash}`;
          toastSuccess('Prediction Successful', 'View Transaction on Explorer', explorerUrl);
          onSuccessCallback && onSuccessCallback(explorerUrl);
          subscriber.complete();
        }
      });
    });
  };

  useEffect(() => {
    fetchLiveStocksPools();
  }, [liveStocksPoolIds]);

  useEffect(() => {
    fetchLiveCryptoPools();
  }, [liveCryptoPoolIds]);

  useEffect(() => {
    return onSnapshot(doc(firestore, `/chains/${getChainName()}/live/stocks`), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if ('poolIds' in data && Array.isArray(data.poolIds)) {
          setLiveStocksPoolIds(data.poolIds);
        }
      } else {
        setLiveStocksPoolIds([]);
      }
    });
  }, [currentChain]);

  useEffect(() => {
    return onSnapshot(doc(firestore, `/chains/${getChainName()}/live/crypto`), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if ('poolIds' in data && Array.isArray(data.poolIds)) {
          setLiveCryptoPoolIds(data.poolIds);
        }
      } else {
        setLiveCryptoPoolIds([]);
      }
    });
  }, [currentChain]);

  return (
    <PoolsContext.Provider
      value={{
        claimWinnings,
        claimWinningsBulk,
        liveStocksPools,
        liveCryptoPools,
        isFetchingLiveStocks,
        isFetchingLiveCrypto,
        isValidPoolId,
        fetchOne,
        predict
      }}
    >
      {children}
    </PoolsContext.Provider>
  );
};
