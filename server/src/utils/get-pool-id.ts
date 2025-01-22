import { Pool, PoolSeeds } from '../schemas';
import { readContract } from './contract';
import { Chain } from './validate-chain';

/**
 * Returns the poolId of the {@link Pool} with provided {@link PoolSeeds}
 *
 * @param chain The chain to create the Pool on.
 * @param seeds The PoolSeeds of the Pool to be created.
 * @returns The poolId of the pool with seeds or null if it doesn't exist.
 */
export const getPoolId = async (
  chain: Chain,
  seeds: PoolSeeds
): Promise<number | null> => {
  console.log('GetPoolId => Got PoolSeeds');
  const seedsHash = await readContract(chain, 'hashPoolSeeds', [
    seeds.bigIntified()
  ]);
  console.log('Hashed PoolSeeds: ', seedsHash);

  console.log('Checking if Pool Exists ...');
  let poolId = Number(
    await readContract(chain, 'poolIdsBySeedsHashes', [seedsHash])
  );
  if (!Number.isNaN(poolId) && poolId !== 0) {
    console.log('Pool exists. poolId: ', poolId);
    return poolId;
  } else {
    console.log("Pool doesn't exist");
    return null;
  }
};
