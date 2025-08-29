import { Chain, firestore, logger, queueJob } from '@castora/shared';

/**
 * Archives a pool by saving its predictions to use for completion later on
 *
 * @param chain The chain to archive the pool on.
 * @param poolId The poolId to archive its predictions
 */
export const archivePool = async (chain: Chain, poolId: any): Promise<void> => {
  await queueJob({ queueName: 'pool-archiver', jobName: 'archive-pool', jobData: { poolId, chain } });
  logger.info(`Posted job to archive Pool ${poolId} on chain ${chain}`);
};

/**
 * Completes a pool by posting the job to the completer
 *
 * @param chain The chain to complete the pool on.
 * @param poolId The poolId in which to compute its winners
 */
export const completePool = async (chain: Chain, poolId: any): Promise<void> => {
  await queueJob({ queueName: 'pool-completer', jobName: 'complete-pool', jobData: { poolId, chain } });
  logger.info(`Posted job to complete Pool ${poolId} on chain ${chain}`);
};

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
 * Syncs pools by posting the job to the pool syncer queue.
 *
 * @param chain The chain to sync the pools on.
 */
export const syncPools = async (chain: Chain): Promise<void> => {
  await queueJob({ queueName: 'pool-syncer', jobName: 'sync-pools', jobData: { chain } });
  logger.info(`Posted job to sync Pools on chain ${chain}`);
};
