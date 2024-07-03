import { createPool, firestore, generateSeeds, getPoolId } from '../../utils';

export const getLivePools = async () => {
  const snap = await firestore.doc('/live/live').get();
  if (snap.exists) {
    const { poolIds } = snap.data()!;
    return poolIds ?? [];
  } else {
    return [];
  }
};

export const syncLivePools = async () => {
  const seeds = generateSeeds();
  const poolIds: number[] = [];
  for (const seed of seeds) {
    const poolId =
      seed.windowCloseTime <= Math.trunc(Date.now() / 1000)
        ? await getPoolId(seed)
        : await createPool(seed);
    if (poolId) poolIds.push(poolId);
    console.log('\n');
  }
  console.log('PoolIds: ', poolIds);

  await firestore.doc('/live/live').set({ poolIds }, { merge: true });
};
