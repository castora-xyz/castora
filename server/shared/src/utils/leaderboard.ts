import { redisClient } from './jobs.js';

const LDB_POOLS_KEY = 'pools-for-leaderboard-update';

/**
 * Adds a pool to be used to update the leaderboard later on
 *
 * @param poolId - The ID of the pool to add
 * @param chain - The blockchain network identifier
 */
export const addPoolForLeaderboardUpdate = async (poolId: number, chain: string) => {
  await redisClient.sadd(LDB_POOLS_KEY, JSON.stringify({ poolId, chain }));
};

/**
 * Returns all pools that were previously added for leaderboard update
 *
 * @returns Array of objects containing pool IDs and chains
 */
export const getPoolsForLeaderboardUpdate = async (): Promise<Array<{ poolId: number; chain: string }>> => {
  return (await redisClient.smembers(LDB_POOLS_KEY)).map((data) => JSON.parse(data));
};

/**
 * Clears the added pools for leaderboard updates
 */
export const clearPoolsForLeaderboardUpdate = async () => {
  await redisClient.del(LDB_POOLS_KEY);
};
