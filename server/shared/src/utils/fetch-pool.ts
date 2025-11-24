import { Pool } from '../schemas/pool.js';
import { readCastoraContract, readGettersContract } from './contract.js';
import { Chain } from './index.js';
import { logger } from './logger.js';

/**
 * Fetches and returns a pool from the provided Castora contract.
 *
 * @param chain The chain to fetch the pool from.
 * @param poolId The poolId of the pool to get its details.
 * @returns An instance of the pool that was fetched.
 */
export const fetchPool = async (chain: Chain, poolId: any): Promise<Pool> => {
  logger.info(`Got poolId: ${poolId}`);
  if (Number.isNaN(poolId)) throw 'Got a non-numeric poolId';
  if (Number(poolId) == 0) throw 'poolId cannot be zero';
  if (Number(poolId) < 0) throw 'poolId cannot be negative';
  if (!Number.isInteger(Number(poolId))) throw 'poolId must be an integer';

  const noOfPools =
    chain === 'monadtestnet'
      ? Number(await readCastoraContract(chain, 'noOfPools'))
      : Number(((await readGettersContract(chain, 'allStats')) as any).noOfPools);
  if (Number.isNaN(noOfPools)) throw 'Got a non-numeric noOfPools';
  logger.info(`Current noOfPools is: ${noOfPools}`);
  if (poolId > noOfPools) throw `Invalid poolId: ${poolId}`;
  poolId = Number(poolId);

  logger.info('\nFetching Pool Details ... ');
  const raw = await readCastoraContract(chain, 'getPool', [BigInt(poolId)]);
  if (!raw) {
    throw 'Could not fetch pool';
  } else {
    const pool = new Pool(raw);
    logger.info(pool, 'Fetched Pool Details');
    return pool;
  }
};
