import {
  Chain,
  createPool,
  firestore,
  generateSeeds,
  getPoolId
} from '../../utils';

/**
 * Returns the live poolIds of the provided chain.
 *
 * @param chain The chain to get the live pools from.
 * @returns The live poolIds of the chain.
 */
export const getLivePools = async (chain: Chain) => {
  const snap = await firestore(chain).doc('/live/live').get();
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
export const syncLivePools = async (chain: Chain) => {
  const seeds = generateSeeds(chain);
  const poolIds: number[] = [];
  for (const seed of seeds) {
    const poolId =
      seed.windowCloseTime <= Math.trunc(Date.now() / 1000)
        ? await getPoolId(chain, seed)
        : await createPool(chain, seed);
    if (poolId) poolIds.push(poolId);
    console.log('\n');
  }
  console.log('PoolIds: ', poolIds);

  await firestore(chain).doc('/live/live').set({ poolIds }, { merge: true });
};
