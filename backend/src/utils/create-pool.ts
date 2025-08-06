import { logger } from '.';
import { Pool, PoolSeeds } from '../schemas';
import { readContract, writeContract } from './contract';
import { Chain } from './validate-chain';

/**
 * Creates a new {@link Pool} whose {@link PoolSeeds} match the provided seeds
 * parameter. Returns the poolId of the newly created Pool.
 *
 * @param chain The chain to create the Pool on.
 * @param seeds The PoolSeeds of the Pool to be created.
 * @returns The poolId of the newly created pool or null if the windowCloseTime
 * is in the past.
 */
export const createPool = async (
  chain: Chain,
  seeds: PoolSeeds
): Promise<number | null> => {
  logger.info('Create Pool => Got PoolSeeds');
  const seedsHash = await readContract(chain, 'hashPoolSeeds', [
    seeds.bigIntified()
  ]);
  logger.info('Hashed PoolSeeds: ', seedsHash);

  logger.info('Checking if Pool Exists ...');
  let poolId = Number(
    await readContract(chain, 'poolIdsBySeedsHashes', [seedsHash])
  );
  if (!Number.isNaN(poolId)) {
    if (poolId == 0) {
      logger.info('Pool does not exist.');

      if (seeds.windowCloseTime <= Math.trunc(Date.now() / 1000)) {
        logger.info('WindowCloseTime is in the past. Ending Process.');
        return null;
      }

      logger.info('\nCreating Pool ... ');
      poolId = Number(
        await writeContract(chain, 'createPool', [seeds.bigIntified()])
      );
      logger.info('Created new pool with poolId: ', poolId);

      return poolId;
    } else {
      logger.info('Pool exists already. poolId: ', poolId);
      return poolId;
    }
  } else {
    throw 'Could not check if pool exists';
  }
};
