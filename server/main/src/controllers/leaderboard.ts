import {
  firestore,
  getMainnetLeaderboardLastUpdatedTime,
  getTestnetLeaderboardLastUpdatedTime,
  LDB_MAINNET_TOP100_KEY,
  LDB_MAINNET_USER_PREFIX,
  LDB_TESTNET_TOP100_KEY,
  LDB_TESTNET_USER_PREFIX,
  logger,
  readGettersContract,
  readPoolsManagerContract,
  REDIS_CACHE_TTL_SECONDS,
  redisClient
} from '@castora/shared';

export const getMainnetLeaderboard = async () => {
  logger.info('Getting Mainnet Leaderboard ... ');

  // Try to get from cache
  const cached = await redisClient.get(LDB_MAINNET_TOP100_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    const parsedLastUpdatedTime = new Date(parsed.lastUpdatedTime);

    // if cached data time is equal to or greater than last updated time, return cached
    const lastUpdatedTime = await getMainnetLeaderboardLastUpdatedTime();
    if (parsedLastUpdatedTime >= lastUpdatedTime) {
      logger.info('Returning cached leaderboard');
      return parsed;
    }
  }

  // Otherwise cache a new leaderboard and return it
  logger.info('Fetching Mainnet Leaderboard from Firestore ... ');
  const {
    leaderboard: {
      lastUpdatedTime: { mainnet: lastUpdatedTimestamp }
    },
    mainnetUsersCount
  } = (await firestore.doc('/counts/counts').get()).data() as any;

  const snapshot = await firestore.collection('users').orderBy('leaderboard.xp.mainnet', 'desc').limit(100).get();
  const entries = snapshot.docs.map((doc, index) => {
    const { leaderboard, stats } = doc.data();
    return { address: doc.id, xp: leaderboard?.xp?.mainnet || 0, ...stats.mainnet, rank: index + 1 };
  });
  const addresses = entries.map((e) => e.address);
  const statsCastora = await readGettersContract('monadmainnet', 'usersStatsBulk', [addresses]);
  const statsPoolsManager = await readPoolsManagerContract('monadmainnet', 'getUserStatsBulk', [addresses]);
  entries.forEach((entry, index) => {
    entry.joinedPools = Number(statsCastora[index].noOfJoinedPools);
    entry.predictions = Number(statsCastora[index].noOfPredictions);
    entry.winnings = Number(statsCastora[index].noOfWinnings);
    entry.createdPools = Number(statsPoolsManager[index].noOfPoolsCreated);
  });

  const result = {
    entries,
    lastUpdatedTime: lastUpdatedTimestamp?.toDate() ?? new Date(),
    totalUsersCount: mainnetUsersCount
  };

  // Cache the result
  try {
    await redisClient.set(LDB_MAINNET_TOP100_KEY, JSON.stringify(result), 'EX', REDIS_CACHE_TTL_SECONDS);
  } catch (e) {
    logger.error(e, 'Failed to cache mainnet leaderboard');
  }

  return result;
};

export const getMyMainnetLeaderboard = async (userWalletAddress: string) => {
  logger.info('Getting My Mainnet Leaderboard ... ');
  logger.info(`User Wallet Address: ${userWalletAddress}`);
  const cacheKey = `${LDB_MAINNET_USER_PREFIX}${userWalletAddress}`;

  // Try to get from cache
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    logger.info('Returning cached leaderboard');
    return parsed;
  }

  // Otherwise cache a new leaderboard and return it
  logger.info('Fetching User Mainnet Leaderboard from Firestore ... ');
  const { mainnetUsersCount } = (await firestore.doc('/counts/counts').get()).data() as any;
  const snapshot = await firestore.doc(`/users/${userWalletAddress}`).get();

  let result;
  if (snapshot.exists) {
    const { leaderboard, stats } = snapshot.data() as any;
    const xp = leaderboard?.xp?.mainnet || 0;
    let rank = mainnetUsersCount + 1;
    let joinedPools = 0;
    let predictions = 0;
    let winnings = 0;
    let createdPools = 0;
    if (xp > 0) {
      const totalSnap = await firestore.collection('users').where('leaderboard.xp.mainnet', '>', xp).count().get();
      rank = totalSnap.data().count + 1;
      const statsCastora = await readGettersContract('monadmainnet', 'usersStats', userWalletAddress);
      const statsPoolsManager = await readPoolsManagerContract('monadmainnet', 'getUserStats', userWalletAddress);
      joinedPools = Number(statsCastora.noOfJoinedPools);
      predictions = Number(statsCastora.noOfPredictions);
      winnings = Number(statsCastora.noOfWinnings);
      createdPools = Number(statsPoolsManager.noOfPoolsCreated);
    }

    result = {
      address: userWalletAddress,
      lastUpdatedTime: leaderboard?.lastUpdatedTime?.toDate() ?? new Date(),
      xp,
      rank,
      joinedPools,
      predictions,
      winnings,
      createdPools,
      ...stats.mainnet
    };
  } else {
    result = {
      address: userWalletAddress,
      lastUpdatedTime: new Date(),
      rank: mainnetUsersCount + 1,
      xp: 0,
      joinedPools: 0,
      predictions: 0,
      predictionsVolume: 0,
      winnings: 0,
      createdPools: 0,
      winningsVolume: 0
    };
  }

  // Cache the result
  try {
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', REDIS_CACHE_TTL_SECONDS);
  } catch (e) {
    logger.error(e, 'Failed to cache user mainnet leaderboard');
  }

  return result;
};

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

  const result = {
    entries,
    lastUpdatedTime: lastUpdatedTimestamp.toDate() ?? new Date(),
    totalUsersCount: monadTestnetUsersCount
  };

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
    let rank = monadTestnetUsersCount + 1;
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
