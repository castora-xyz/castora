import { Pool } from '../models';
import { readContract } from './contract';

/**
 * Fetches and returns a pool from the provided Castora contract.
 *
 * @param poolId The poolId of the pool to get its details.
 * @returns An instance of the pool that was fetched.
 */
export const fetchPool = async (poolId: any): Promise<Pool> => {
  console.log('Got poolId: ', poolId);
  if (Number.isNaN(poolId)) throw 'Got a non-numeric poolId';
  if (Number(poolId) == 0) throw 'poolId cannot be zero';
  if (Number(poolId) < 0) throw 'poolId cannot be negative';
  if (!Number.isInteger(+poolId)) throw 'poolId must be an integer';

  const noOfPools = Number(await readContract('noOfPools'));
  if (Number.isNaN(noOfPools)) throw 'Got a non-numeric noOfPools';
  console.log('Current noOfPools is: ', noOfPools);
  if (poolId > noOfPools) throw `Invalid poolId: ${poolId}`;
  poolId = Number(poolId);

  console.log('\nFetching Pool Details ... ');
  const raw = await readContract('pools', [BigInt(poolId)]);
  if (!raw) {
    throw 'Could not fetch pool';
  } else {
    console.log('Fetched Pool Details.');
    const pool = new Pool(raw);
    console.log(pool);
    return pool;
  }
};
