import {
  Chain,
  createPool,
  firestore,
  getCryptoSeeds,
  getPoolId,
  getStocksSeeds
} from '../../utils';

/**
 * Returns the live crypto poolIds of the provided chain.
 *
 * @param {Chain} chain The chain to get the live pools from.
 * @returns {Array} The live crypto poolIds of the chain.
 */
export const getCryptoPoolIds = async (chain: Chain): Promise<number[]> => {
  const snap = await firestore(chain).doc('/live/crypto').get();
  if (snap.exists) {
    const { poolIds } = snap.data()!;
    return poolIds ?? [];
  } else {
    return [];
  }
};

/**
 * Returns the live stock poolIds of the provided chain.
 *
 * @param {Chain} chain The chain to get the live pools from.
 * @returns {Array} The live stock poolIds of the chain.
 */
export const getStocksPoolIds = async (chain: Chain): Promise<number[]> => {
  const snap = await firestore(chain).doc('/live/stocks').get();
  if (snap.exists) {
    const { poolIds } = snap.data()!;
    return poolIds ?? [];
  } else {
    return [];
  }
};

/**
 * Synchronizes the live pools of the provided chain.
 *
 * @param chain The chain to synchronize its live pools.
 */
export const syncPools = async (chain: Chain) => {
  console.log('Starting Sync for Live Crypto Pools');
  const cryptoSeeds = getCryptoSeeds(chain);
  const cryptoPoolIds: number[] = [];
  for (const seed of cryptoSeeds) {
    const poolId =
      seed.windowCloseTime <= Math.trunc(Date.now() / 1000)
        ? await getPoolId(chain, seed)
        : await createPool(chain, seed);
    if (poolId) cryptoPoolIds.push(poolId);
    console.log('\n');
  }
  console.log('Live Crypto PoolIds: ', cryptoPoolIds);
  await firestore(chain)
    .doc('/live/crypto')
    .set({ poolIds: cryptoPoolIds }, { merge: true });

  console.log('\n\nStating Sync for Live Stock Pools');
  const stocksSeeds = getStocksSeeds(chain);
  const stocksPoolIds: number[] = [];
  for (const seed of stocksSeeds) {
    const poolId =
      seed.windowCloseTime <= Math.trunc(Date.now() / 1000)
        ? await getPoolId(chain, seed)
        : await createPool(chain, seed);
    if (poolId) stocksPoolIds.push(poolId);
    console.log('\n');
  }
  console.log('Live Stocks PoolIds: ', stocksPoolIds);
  await firestore(chain)
    .doc('/live/stocks')
    .set({ poolIds: stocksPoolIds }, { merge: true });
};
