import {
  Chain,
  createPool,
  firestore,
  generateExperimentalsSeeds,
  generateLiveSeeds,
  getPoolId,
  logger
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
 * Returns the live poolIds of the provided chain.
 *
 * @param chain The chain to get the live pools from.
 * @returns The live poolIds of the chain.
 */
export const getExperimentalsPools = async (chain: Chain) => {
  const snap = await firestore(chain).doc('/live/experimentals').get();
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
  logger.info('Starting Sync for LIVE Pools');
  const liveSeeds = generateLiveSeeds(chain);
  const livePoolIds: number[] = [];
  for (const seed of liveSeeds) {
    const poolId =
      seed.windowCloseTime <= Math.trunc(Date.now() / 1000)
        ? await getPoolId(chain, seed)
        : await createPool(chain, seed);
    if (poolId) livePoolIds.push(poolId);
    logger.info('\n');
  }
  logger.info('Live PoolIds: ', livePoolIds);
  await firestore(chain)
    .doc('/live/live')
    .set({ poolIds: livePoolIds }, { merge: true });

  logger.info('\n\nStarting Sync for EXPERIMENTAL Pools');
  const exprSeeds = generateExperimentalsSeeds(chain);
  const exprPoolIds: number[] = [];
  for (const seed of exprSeeds) {
    const poolId =
      seed.windowCloseTime <= Math.trunc(Date.now() / 1000)
        ? await getPoolId(chain, seed)
        : await createPool(chain, seed);
    if (poolId) exprPoolIds.push(poolId);
    logger.info('\n');
  }
  logger.info('Experimental PoolIds: ', exprPoolIds);
  await firestore(chain)
    .doc('/live/experimentals')
    .set({ poolIds: exprPoolIds }, { merge: true });
};
