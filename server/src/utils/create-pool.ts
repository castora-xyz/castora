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
  console.log('Created Pool => Got PoolSeeds');
  const seedsHash = await readContract(chain, 'hashPoolSeeds', [
    seeds.bigIntified()
  ]);
  console.log('Hashed PoolSeeds: ', seedsHash);

  console.log('Checking if Pool Exists ...');
  let poolId = Number(
    await readContract(chain, 'poolIdsBySeedsHashes', [seedsHash])
  );
  if (!Number.isNaN(poolId)) {
    if (poolId == 0) {
      console.log('Pool does not exist.');

      if (seeds.windowCloseTime <= Math.trunc(Date.now() / 1000)) {
        console.log('WindowCloseTime is in the past. Ending Process.');
        return null;
      }

      console.log('\nCreating Pool ... ');
      poolId = Number(
        await writeContract(chain, 'createPool', [seeds.bigIntified()])
      );
      console.log('Created new pool with poolId: ', poolId);

      return poolId;
    } else {
      console.log('Pool exists already. poolId: ', poolId);
      return poolId;
    }
  } else {
    throw 'Could not check if pool exists';
  }
};
