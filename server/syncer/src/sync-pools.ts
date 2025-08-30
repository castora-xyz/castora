import { firestore, Job, logger } from '@castora/shared';
import { createPool } from './create-pool.js';
import { getPoolId } from './get-pool-id.js';
import { getCryptoSeeds, getStocksSeeds } from './get-pool-seeds.js';

/**
 * Synchronizes the live pools of the provided chain.
 *
 * @param job The job containing the chain to sync its pools.
 */
export const syncPools = async (job: Job): Promise<void> => {
  const { chain } = job.data;
  logger.info(`Starting Sync for Live Crypto Pools on chain: ${chain}`);
  const cryptoSeeds = getCryptoSeeds(chain);
  const cryptoPoolIds: number[] = [];
  for (const seed of cryptoSeeds) {
    const poolId =
      seed.windowCloseTime <= Math.trunc(Date.now() / 1000)
        ? await getPoolId(chain, seed)
        : await createPool(chain, seed);
    if (poolId) cryptoPoolIds.push(poolId);
    logger.info('\n');
  }
  logger.info(cryptoPoolIds, 'Live Crypto PoolIds');
  await firestore(chain).doc('/live/crypto').set({ poolIds: cryptoPoolIds }, { merge: true });

  logger.info(`\n\nStarting Sync for Live Stock Pools on chain: ${chain}`);
  const stocksSeeds = getStocksSeeds(chain);
  const stocksPoolIds: number[] = [];
  for (const seed of stocksSeeds) {
    const poolId =
      seed.windowCloseTime <= Math.trunc(Date.now() / 1000)
        ? await getPoolId(chain, seed)
        : await createPool(chain, seed);
    if (poolId) stocksPoolIds.push(poolId);
    logger.info('\n');
  }
  logger.info(stocksPoolIds, 'Live Stocks PoolIds');
  await firestore(chain).doc('/live/stocks').set({ poolIds: stocksPoolIds }, { merge: true });
};
