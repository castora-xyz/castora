import { Chain, logger, Pool, PoolSeeds, readCastoraContract } from '@castora/shared';

/**
 * Returns the poolId of the {@link Pool} with provided {@link PoolSeeds}
 *
 * @param chain The chain to create the Pool on.
 * @param seeds The PoolSeeds of the Pool to be created.
 * @returns The poolId of the pool with seeds or null if it doesn't exist.
 */
export const getPoolId = async (chain: Chain, seeds: PoolSeeds): Promise<number | null> => {
  if (chain === 'monadtestnet') return null; // not getting pools in testnet anymore

  logger.info('GetPoolId => Got PoolSeeds');
  const seedsHash = await readCastoraContract(chain, 'hashPoolSeeds', [seeds.bigIntified()]);
  logger.info(`Hashed PoolSeeds: ${seedsHash}`);

  logger.info('Checking if Pool Exists ...');
  let poolId = Number(await readCastoraContract(chain, 'poolIdsBySeedsHashes', [seedsHash]));
  if (!Number.isNaN(poolId) && poolId !== 0) {
    logger.info(`Pool exists. poolId: ${poolId}`);
    return poolId;
  } else {
    logger.info("Pool doesn't exist");
    return null;
  }
};
