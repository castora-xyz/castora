import { WriteContractStatus, useContract, useFirebase, useToast } from '@/contexts';
import { Pool, tokens } from '@/schemas';
import { doc, onSnapshot } from 'firebase/firestore';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { Observable } from 'rxjs';
import { useConnection } from 'wagmi';

export type WriteContractPoolStatus = WriteContractStatus | 'finalizing';

export const allowedCreatorPredTokens = ['MON', 'BTC', 'ETH', 'SOL'];

export interface CreatePoolForm {
  predictionToken: string;
  stakeToken: string;
  stakeAmount: string;
  windowCloseTime: Date | null;
  snapshotTime: Date | null;
  multiplier: string;
  visibility: string;
}

interface PoolsContextProps {
  claimPoolCompletionFees: (
    poolId: number,
    onSuccessCallback?: (explorerUrl: string) => void
  ) => Observable<WriteContractPoolStatus>;
  claimPoolCompletionFeesBulk: (
    poolIds: number[],
    onSuccessCallback?: (explorerUrl: string) => void
  ) => Observable<WriteContractPoolStatus>;
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
  liveCommunityPools: Pool[];
  isFetchingLiveCrypto: boolean;
  isFetchingLiveStocks: boolean;
  isFetchingLiveCommunity: boolean;
  create: (
    form: CreatePoolForm,
    onSuccessCallBack?: (explorerUrl: string, createdPoolId: number) => void
  ) => Observable<WriteContractPoolStatus>;
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
  claimPoolCompletionFees: () => new Observable(),
  claimPoolCompletionFeesBulk: () => new Observable(),
  claimWinnings: () => new Observable(),
  claimWinningsBulk: () => new Observable(),
  create: () => new Observable(),
  liveCryptoPools: [],
  liveStocksPools: [],
  liveCommunityPools: [],
  isFetchingLiveCrypto: true,
  isFetchingLiveStocks: true,
  isFetchingLiveCommunity: true,
  isValidPoolId: async () => false,
  fetchOne: async () => null,
  predict: () => new Observable()
});

export const usePools = () => useContext(PoolsContext);

export const PoolsProvider = ({ children }: { children: ReactNode }) => {
  const { chain: currentChain } = useConnection();
  const { castoraAddress, poolsManagerAddress, readContract, writeContract } = useContract();
  const { firestore, recordEvent } = useFirebase();
  const { toastSuccess } = useToast();

  const [isFetchingLiveStocks, setIsFetchingLiveStocks] = useState(true);
  const [isFetchingLiveCrypto, setIsFetchingLiveCrypto] = useState(true);
  const [isFetchingLiveCommunity, setIsFetchingLiveCommunity] = useState(true);
  const [liveCryptoPools, setLiveCryptoPools] = useState<Pool[]>([]);
  const [liveCryptoPoolIds, setLiveCryptoPoolIds] = useState<number[]>([]);
  const [liveStocksPools, setLiveStocksPools] = useState<Pool[]>([]);
  const [liveStocksPoolIds, setLiveStocksPoolIds] = useState<number[]>([]);
  const [liveCommunityPools, setLiveCommunityPools] = useState<Pool[]>([]);
  const [liveCommunityPoolIds, setLiveCommunityPoolIds] = useState<number[]>([]);


  const getCreateFormArgs = (form: CreatePoolForm) => {
    if (!allowedCreatorPredTokens.includes(form.predictionToken)) throw 'Invalid predictionToken';
    if (form.stakeToken != 'MON') throw 'Invalid stakeToken';
    if (!form.windowCloseTime) throw 'Invalid windowCloseTime';
    if (!form.snapshotTime) throw 'Invalid snapshotTime';

    return [
      {
        predictionToken: tokens.find((t) => t.name == form.predictionToken)?.address,
        stakeToken: castoraAddress,
        stakeAmount: +form.stakeAmount * 1e18,
        windowCloseTime: Math.trunc(form.windowCloseTime.getTime() / 1000),
        snapshotTime: Math.trunc(form.snapshotTime.getTime() / 1000),
        feesPercent: 500, // 5% fees
        multiplier: +form.multiplier.substring(1) * 100,
        isUnlisted: form.visibility == 'unlisted'
      },
      poolsManagerAddress
    ];
  };

  const create = (form: CreatePoolForm, onSuccessCallBack?: (explorerUrl: string, createdPoolId: number) => void) => {
    return new Observable<WriteContractPoolStatus>((subscriber) => {
      let poolId: number;
      let txHash: string;
      writeContract({
        contract: 'pools-manager',
        functionName: 'createPool',
        args: getCreateFormArgs(form),
        value: 100e18,
        onSuccessCallback: (hash, rawPoolId) => {
          txHash = hash;
          poolId = Number(rawPoolId);
        }
      }).subscribe({
        next: subscriber.next.bind(subscriber),
        error: subscriber.error.bind(subscriber),
        complete: async () => {
          if (!txHash) {
            subscriber.error('Transaction Failed');
            return;
          }

          subscriber.next('finalizing');
          recordEvent('created_pool', { poolId });
          const explorerUrl = `${currentChain?.blockExplorers?.default.url}/tx/${txHash}`;
          toastSuccess('Creation Successful', 'View Transaction on Explorer', explorerUrl);
          onSuccessCallBack && onSuccessCallBack(explorerUrl, poolId);
          subscriber.complete();
        }
      });
    });
  };

  const claimPoolCompletionFees = (poolId: number, onSuccessCallback?: (explorerUrl: string) => void) => {
    return new Observable<WriteContractPoolStatus>((subscriber) => {
      let txHash: string;
      writeContract({
        contract: 'pools-manager',
        functionName: 'claimPoolCompletionFees',
        args: [BigInt(poolId)],
        onSuccessCallback: (hash) => (txHash = hash)
      }).subscribe({
        next: subscriber.next.bind(subscriber),
        error: subscriber.error.bind(subscriber),
        complete: async () => {
          if (!txHash) {
            subscriber.error('Transaction Failed');
            return;
          }

          subscriber.next('finalizing');
          recordEvent('claimed_pool_completion_fees', { poolId });
          const explorerUrl = `${currentChain?.blockExplorers?.default.url}/tx/${txHash}`;
          toastSuccess('Withdrawal Successful', 'View Transaction on Explorer', explorerUrl);
          onSuccessCallback && onSuccessCallback(explorerUrl);
          subscriber.complete();
        }
      });
    });
  };

  const claimPoolCompletionFeesBulk = (poolIds: number[], onSuccessCallback?: (explorerUrl: string) => void) => {
    return new Observable<WriteContractPoolStatus>((subscriber) => {
      let txHash: string;
      writeContract({
        contract: 'pools-manager',
        functionName: 'claimPoolCompletionFeesBulk',
        args: [poolIds.map((i) => BigInt(i))],
        onSuccessCallback: (hash) => (txHash = hash)
      }).subscribe({
        next: subscriber.next.bind(subscriber),
        error: subscriber.error.bind(subscriber),
        complete: async () => {
          if (!txHash) {
            subscriber.error('Transaction Failed');
            return;
          }

          subscriber.next('finalizing');
          recordEvent('claimed_winnings_bulk', { poolIds });
          const explorerUrl = `${currentChain?.blockExplorers?.default.url}/tx/${txHash}`;
          toastSuccess('Bulk Withdrawals Successful', 'View Transaction on Explorer', explorerUrl);
          onSuccessCallback && onSuccessCallback(explorerUrl);
          subscriber.complete();
        }
      });
    });
  };

  /**
   * Claims the winnings of a winner from a pool.
   * @param poolId The poolId of the pool from which to claim winnings.
   * @param predictionId The predictionId of the winning prediction to claim.
   * @param onSuccessCallback Callback with txHash as argument
   */
  const claimWinnings = (poolId: number, predictionId: number, onSuccessCallback?: (explorerUrl: string) => void) => {
    return new Observable<WriteContractPoolStatus>((subscriber) => {
      let txHash: string;
      writeContract({
        contract: 'castora',
        functionName: 'claimWinnings',
        args: [BigInt(poolId), BigInt(predictionId)],
        onSuccessCallback: (hash) => (txHash = hash)
      }).subscribe({
        next: subscriber.next.bind(subscriber),
        error: subscriber.error.bind(subscriber),
        complete: async () => {
          if (!txHash) {
            subscriber.error('Transaction Failed');
            return;
          }

          subscriber.next('finalizing');
          recordEvent('claimed_winnings', { poolId, predictionId });
          const explorerUrl = `${currentChain?.blockExplorers?.default.url}/tx/${txHash}`;
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
      writeContract({
        contract: 'castora',
        functionName: 'claimWinningsBulk',
        args: [poolIds.map((i) => BigInt(i)), predictionIds.map((i) => BigInt(i))],
        onSuccessCallback: (hash) => (txHash = hash)
      }).subscribe({
        next: subscriber.next.bind(subscriber),
        error: subscriber.error.bind(subscriber),
        complete: async () => {
          if (!txHash) {
            subscriber.error('Transaction Failed');
            return;
          }

          subscriber.next('finalizing');
          recordEvent('claimed_winnings_bulk', { poolIds, predictionIds });
          const explorerUrl = `${currentChain?.blockExplorers?.default.url}/tx/${txHash}`;
          toastSuccess('Bulk Withdrawals Successful', 'View Transaction on Explorer', explorerUrl);
          onSuccessCallback && onSuccessCallback(explorerUrl);
          subscriber.complete();
        }
      });
    });
  };

  const fetchOne = async (poolId: number) => {
    if (!(await isValidPoolId(poolId))) return null;
    const raw1 = await readContract({ contract: 'castora', functionName: 'getPool', args: [BigInt(poolId)] });
    if (!raw1) return null;

    let raw2: any;
    const isUserCreated = await readContract({
      contract: 'pools-manager',
      functionName: 'doesUserCreatedPoolExist',
      args: [BigInt(poolId)]
    });
    if (isUserCreated) {
      raw2 = await readContract({
        contract: 'pools-manager',
        functionName: 'getUserCreatedPool',
        args: [BigInt(poolId)]
      });
      if (!raw2) raw2 = {};
    }

    return new Pool({ ...raw1, userCreated: raw2 });
  };

  const fetchMany = async (poolIds: number[], includeUserCreateds = false) => {
    const raw1 = await readContract({ contract: 'getters', functionName: 'pools', args: [poolIds] });
    if (!raw1) return [];

    let raw2;
    if (includeUserCreateds) {
      raw2 = await readContract({ contract: 'pools-manager', functionName: 'getUserCreatedPools', args: [poolIds] });
      if (!raw2) return [];
    }

    const fetched = [];
    for (let i = 0; i < raw1.length; i++) {
      fetched.push(new Pool({ ...raw1[i], ...(includeUserCreateds ? { userCreated: raw2[i] } : {}) }));
    }
    return fetched;
  };

  const fetchLiveCryptoPools = async () => {
    setIsFetchingLiveCrypto(true);
    const fetched = await fetchMany(liveCryptoPoolIds);
    setLiveCryptoPools(fetched);
    // Some how the extra 1 seconds prevents a UI blink of empty state
    // probably setting the pools above takes a lot and setState is usually async
    setTimeout(() => setIsFetchingLiveCrypto(false), 1000);
  };

  const fetchLiveStocksPools = async () => {
    setIsFetchingLiveStocks(true);
    const fetched = await fetchMany(liveStocksPoolIds);
    setLiveStocksPools(fetched);
    // Some how the extra 1 seconds prevents a UI blink of empty state
    // probably setting the pools above takes a lot and setState is usually async
    setTimeout(() => setIsFetchingLiveStocks(false), 1000);
  };

  const fetchLiveCommunityPools = async () => {
    setIsFetchingLiveCommunity(true);
    const fetched = await fetchMany(liveCommunityPoolIds, true);
    setLiveCommunityPools(fetched);
    // Some how the extra 1 seconds prevents a UI blink of empty state
    // probably setting the pools above takes a lot and setState is usually async
    setTimeout(() => setIsFetchingLiveCommunity(false), 1000);
  };

  const isValidPoolId = async (poolId: any) => {
    if (Number.isNaN(poolId) || +poolId <= 0 || !Number.isInteger(+poolId)) {
      return false;
    } else {
      const stats = await readContract({ contract: 'getters', functionName: 'allStats' });
      if (!stats) return false;
      const noOfPools = Number(stats.noOfPools);
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
      writeContract({
        contract: 'castora',
        functionName: bulkCount ? 'bulkPredict' : 'predict',
        args: [BigInt(poolId), BigInt(price), ...(bulkCount ? [BigInt(bulkCount)] : [])],
        ...(stakeToken.toLowerCase() == castoraAddress.toLowerCase() ? { value: stakeAmount } : {}),
        onSuccessCallback: (hash, result) => {
          txHash = hash;
          predictionIds = Array.isArray(result) ? result.map(Number) : [Number(result)];
          console.log(predictionIds);
        }
      }).subscribe({
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
          const explorerUrl = `${currentChain?.blockExplorers?.default.url}/tx/${txHash}`;
          toastSuccess('Prediction Successful', 'View Transaction on Explorer', explorerUrl);
          onSuccessCallback && onSuccessCallback(explorerUrl);
          subscriber.complete();
        }
      });
    });
  };

  useEffect(() => {
    fetchLiveCryptoPools();
  }, [liveCryptoPoolIds]);

  useEffect(() => {
    fetchLiveStocksPools();
  }, [liveStocksPoolIds]);

  useEffect(() => {
    fetchLiveCommunityPools();
  }, [liveCommunityPoolIds]);

  useEffect(() => {
    return onSnapshot(doc(firestore, `/chains/${currentChain?.name}/live/crypto`), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if ('poolIds' in data && Array.isArray(data.poolIds)) {
          setLiveCryptoPoolIds(data.poolIds);
        }
      }
    });
  }, [currentChain]);

  useEffect(() => {
    return onSnapshot(doc(firestore, `/chains/${currentChain?.name}/live/stocks`), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if ('poolIds' in data && Array.isArray(data.poolIds)) {
          setLiveStocksPoolIds(data.poolIds);
        }
      }
    });
  }, [currentChain]);

  useEffect(() => {
    return onSnapshot(doc(firestore, `/chains/${currentChain?.name}/live/community`), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if ('poolIds' in data && Array.isArray(data.poolIds)) {
          setLiveCommunityPoolIds(data.poolIds);
        }
      }
    });
  }, [currentChain]);

  return (
    <PoolsContext.Provider
      value={{
        claimPoolCompletionFees,
        claimPoolCompletionFeesBulk,
        claimWinnings,
        claimWinningsBulk,
        create,
        liveStocksPools,
        liveCryptoPools,
        liveCommunityPools,
        isFetchingLiveStocks,
        isFetchingLiveCrypto,
        isFetchingLiveCommunity,
        isValidPoolId,
        fetchOne,
        predict
      }}
    >
      {children}
    </PoolsContext.Provider>
  );
};
