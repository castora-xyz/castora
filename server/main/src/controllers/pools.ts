import { Chain, firestore, logger, queueJob } from '@castora/shared';

/**
 * Returns the live crypto poolIds of the provided chain.
 *
 * @param {Chain} chain The chain to get the live pools from.
 * @returns {Array} The live crypto poolIds of the chain.
 */
export const getCryptoPoolIds = async (chain: Chain): Promise<number[]> => {
  const snap = await firestore.doc(`/chains/${chain}/live/crypto`).get();
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
  const snap = await firestore.doc(`/chains/${chain}/live/stocks`).get();
  if (snap.exists) {
    const { poolIds } = snap.data()!;
    return poolIds ?? [];
  } else {
    return [];
  }
};

/**
 * Settles a pool by posting archive job with shouldComplete flag.
 * If pool is archived, then complete, otherwise, after archiving, complete it.
 * Useful for failed archival & completion, post pool times.
 *
 * @param chain The chain to settle the pool on.
 * @param poolId The poolId in which to settle
 */
export const settlePool = async (chain: Chain, poolId: any): Promise<void> => {
  await queueJob({
    queueName: 'pool-archiver',
    jobName: 'archive-pool',
    jobData: { poolId, chain, shouldComplete: true }
  });
  logger.info(`Posted job to settle (archive with shouldComplete flag) Pool ` + `${poolId} on chain ${chain}`);
};

/**
 * Syncs pools by posting the job to the pool syncer queue.
 *
 * @param chain The chain to sync the pools on.
 */
export const syncPools = async (chain: Chain): Promise<void> => {
  await queueJob({ queueName: 'pool-syncer', jobName: 'sync-pools', jobData: { chain } });
  logger.info(`Posted job to sync Pools on chain ${chain}`);
};
