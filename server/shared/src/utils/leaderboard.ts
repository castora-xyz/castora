import { redisClient } from './jobs.js';

const LDB_POOLS_KEY = 'pools-for-leaderboard-update';
const LDB_LAST_UPDATED_TIME_KEY_PREFIX = 'leaderboard:lastUpdatedTime:chain:';
export const LDB_TOP100_KEY_PREFIX = 'leaderboard:top100:chain:';
export const REDIS_LDB_CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours
export const getLdbUserPrefix = (user: string, chain: string) => `leaderboard:user:${user}:chain:${chain}:`;

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

/**
 * Updates the last updated time for a specific chain leaderboard.
 *
 * @param chain - The blockchain network identifier
 * @param lastUpdatedTime - The Date object representing the last updated time.
 */
export const updateLeaderboardLastUpdatedTime = async (chain: string, lastUpdatedTime: Date) => {
  await redisClient.set(`${LDB_LAST_UPDATED_TIME_KEY_PREFIX}${chain}`, lastUpdatedTime.toISOString());
};

/**
 * Retrieves the last updated time for a specific chain leaderboard.
 * If no time is set, it returns the current date.
 *
 * @param chain - The blockchain network identifier
 * @returns A Promise that resolves to a Date object representing the last updated time.
 */
export const getLeaderboardLastUpdatedTime = async (chain: string): Promise<Date> => {
  const lastUpdatedTime = await redisClient.get(`${LDB_LAST_UPDATED_TIME_KEY_PREFIX}${chain}`);
  if (!lastUpdatedTime) return new Date();
  return new Date(lastUpdatedTime as string);
};
