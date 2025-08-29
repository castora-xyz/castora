import { Chain, logger, Pool, PoolSeeds, queueJob, readContract, writeContract } from '@castora/shared';

/**
 * Creates a new {@link Pool} whose {@link PoolSeeds} match the provided seeds
 * parameter. Returns the poolId of the newly created Pool.
 *
 * @param chain The chain to create the Pool on.
 * @param seeds The PoolSeeds of the Pool to be created.
 * @returns The poolId of the newly created pool or null if the windowCloseTime
 * is in the past.
 */
export const createPool = async (chain: Chain, seeds: PoolSeeds): Promise<number | null> => {
  logger.info('Create Pool => Got PoolSeeds');
  const seedsHash = await readContract(chain, 'hashPoolSeeds', [seeds.bigIntified()]);
  logger.info('Hashed PoolSeeds: ', seedsHash);

  logger.info('Checking if Pool Exists ...');
  let poolId = Number(await readContract(chain, 'poolIdsBySeedsHashes', [seedsHash]));
  if (!Number.isNaN(poolId)) {
    if (poolId == 0) {
      logger.info('Pool does not exist.');

      const now = Math.trunc(Date.now() / 1000);
      if (seeds.windowCloseTime <= now) {
        logger.info('WindowCloseTime is in the past. Ending Process.');
        return null;
      }

      logger.info('\nCreating Pool ... ');
      poolId = Number(await writeContract(chain, 'createPool', [seeds.bigIntified()], `Create Pool on chain ${chain}`));
      logger.info('Created new pool with poolId: ', poolId);

      await queueJob({
        queueName: 'pool-archiver',
        jobName: 'archive-pool',
        jobData: { poolId, chain },
        delay: (seeds.windowCloseTime - now) * 1000
      });
      logger.info(`Posted job to archive Pool ${poolId} on chain ${chain} at windowCloseTime`);

      await queueJob({
        queueName: 'pool-completer',
        jobName: 'complete-pool',
        jobData: { poolId, chain },
        // 20 seconds after snapshotTime for price availability
        delay: (seeds.snapshotTime - now) * 1000 + 20000
      });
      logger.info(`Posted job to complete Pool ${poolId} on chain ${chain} after snapshotTime`);

      return poolId;
    } else {
      logger.info('Pool exists already. poolId: ', poolId);
      return poolId;
    }
  } else {
    throw 'Could not check if pool exists';
  }
};
