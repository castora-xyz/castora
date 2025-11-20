import {
  firestore,
  getTestnetLeaderboardLastUpdatedTime,
  LDB_TESTNET_TOP100_KEY,
  LDB_TESTNET_USER_PREFIX,
  logger,
  REDIS_CACHE_TTL_SECONDS,
  redisClient
} from '@castora/shared';

export const getTestnetLeaderboard = async () => {
  logger.info('Getting Testnet Leaderboard ... ');

  // Try to get from cache
  const cached = await redisClient.get(LDB_TESTNET_TOP100_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    const parsedLastUpdatedTime = new Date(parsed.lastUpdatedTime);

    // if cached data time is equal to or greater than last updated time, return cached
    const lastUpdatedTime = await getTestnetLeaderboardLastUpdatedTime();
    if (parsedLastUpdatedTime >= lastUpdatedTime) {
      logger.info('Returning cached leaderboard');
      return parsed;
    }
  }

  // Otherwise cache a new leaderboard and return it
  logger.info('Fetching Testnet Leaderboard from Firestore ... ');
  const {
    leaderboard: {
      lastUpdatedTime: { testnet: lastUpdatedTimestamp }
    },
    monadTestnetUsersCount
  } = (await firestore.doc('/counts/counts').get()).data() as any;

  const snapshot = await firestore.collection('users').orderBy('leaderboard.xp.testnet', 'desc').limit(100).get();
  const entries = snapshot.docs.map((doc) => {
    const { leaderboard, monadTestnetStats } = doc.data();
    return { address: doc.id, xp: leaderboard?.xp?.testnet || 0, ...monadTestnetStats };
  });

  const result = { entries, lastUpdatedTime: lastUpdatedTimestamp.toDate(), totalUsersCount: monadTestnetUsersCount };

  // Cache the result
  try {
    await redisClient.set(LDB_TESTNET_TOP100_KEY, JSON.stringify(result), 'EX', REDIS_CACHE_TTL_SECONDS);
  } catch (e) {
    logger.error(e, 'Failed to cache testnet leaderboard');
  }

  return result;
};

export const getMyTestnetLeaderboard = async (userWalletAddress: string) => {
  logger.info('Getting My Testnet Leaderboard ... ');
  logger.info(`User Wallet Address: ${userWalletAddress}`);
  const cacheKey = `${LDB_TESTNET_USER_PREFIX}${userWalletAddress}`;

  // Try to get from cache
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    logger.info('Returning cached leaderboard');
    return parsed;
  }

  // Otherwise cache a new leaderboard and return it
  logger.info('Fetching User Testnet Leaderboard from Firestore ... ');
  const { monadTestnetUsersCount } = (await firestore.doc('/counts/counts').get()).data() as any;
  const snapshot = await firestore.doc(`/users/${userWalletAddress}`).get();

  let result;
  if (snapshot.exists) {
    const { leaderboard, monadTestnetStats } = snapshot.data() as any;
    const xp = leaderboard?.xp?.testnet || 0;
    let rank = monadTestnetUsersCount;
    if (xp > 0) {
      const totalSnap = await firestore.collection('users').where('leaderboard.xp.testnet', '>', xp).count().get();
      rank = totalSnap.data().count + 1;
    }

    result = {
      lastUpdatedTime: leaderboard?.lastUpdatedTime?.toDate() ?? new Date(),
      xp,
      rank,
      ...monadTestnetStats
    };
  } else {
    result = {
      lastUpdatedTime: new Date(),
      rank: monadTestnetUsersCount + 1,
      xp: 0,
      pools: 0,
      predictions: 0,
      predictionsVolume: 0,
      winnings: 0,
      winningsVolume: 0
    };
  }

  // Cache the result
  try {
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', REDIS_CACHE_TTL_SECONDS);
  } catch (e) {
    logger.error(e, 'Failed to cache user testnet leaderboard');
  }

  return result;
};
