import { logger } from '.';
import { Pool } from '../schemas';
import { readContract } from './contract';
import { Chain } from './validate-chain';

/**
 * Fetches and returns a pool from the provided Castora contract.
 *
 * @param chain The chain to fetch the pool from.
 * @param poolId The poolId of the pool to get its details.
 * @returns An instance of the pool that was fetched.
 */
export const fetchPool = async (chain: Chain, poolId: any): Promise<Pool> => {
  logger.info('Got poolId: ', poolId);
  if (Number.isNaN(poolId)) throw 'Got a non-numeric poolId';
  if (Number(poolId) == 0) throw 'poolId cannot be zero';
  if (Number(poolId) < 0) throw 'poolId cannot be negative';
  if (!Number.isInteger(Number(poolId))) throw 'poolId must be an integer';

  const noOfPools = Number(await readContract(chain, 'noOfPools'));
  if (Number.isNaN(noOfPools)) throw 'Got a non-numeric noOfPools';
  logger.info('Current noOfPools is: ', noOfPools);
  if (poolId > noOfPools) throw `Invalid poolId: ${poolId}`;
  poolId = Number(poolId);

  logger.info('\nFetching Pool Details ... ');
  const raw = await readContract(chain, 'pools', [BigInt(poolId)]);
  if (!raw) {
    throw 'Could not fetch pool';
  } else {
    logger.info('Fetched Pool Details.');
    const pool = new Pool(raw);
    logger.info(pool);
    return pool;
  }
};
