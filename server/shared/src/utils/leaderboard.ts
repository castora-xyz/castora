import { redisClient } from './jobs.js';

const LDB_POOLS_KEY = 'pools-for-leaderboard-update';
const LDB_TESTNET_LAST_UPDATED_TIME_KEY = 'leaderboard:testnet:lastUpdatedTime';

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
 * Updates the last updated time for the testnet leaderboard.
 *
 * @param lastUpdatedTime - The Date object representing the last updated time.
 */
export const updateTestnetLeaderboardLastUpdatedTime = async (lastUpdatedTime: Date) => {
  await redisClient.set(LDB_TESTNET_LAST_UPDATED_TIME_KEY, lastUpdatedTime.toISOString());
};

/**
 * Retrieves the last updated time for the testnet leaderboard.
 * If no time is set, it returns the current date.
 *
 * @returns A Promise that resolves to a Date object representing the last updated time.
 */
export const getTestnetLeaderboardLastUpdatedTime = async (): Promise<Date> => {
  const lastUpdatedTime = await redisClient.get(LDB_TESTNET_LAST_UPDATED_TIME_KEY);
  if (!lastUpdatedTime) return new Date();
  return new Date(lastUpdatedTime as string);
};
