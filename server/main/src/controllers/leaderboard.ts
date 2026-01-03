import {
  Chain,
  firestore,
  getLdbUserPrefix,
  getLeaderboardLastUpdatedTime,
  LDB_TOP100_KEY_PREFIX,
  logger,
  readGettersContract,
  readPoolsManagerContract,
  REDIS_LDB_CACHE_TTL_SECONDS,
  redisClient
} from '@castora/shared';

export const getLeaderboard = async (chain: Chain) => {
  logger.info(`Getting Leaderboard for chain: ${chain} ... `);

  // Try to get from cache
  const cached = await redisClient.get(`${LDB_TOP100_KEY_PREFIX}${chain}`);
  if (cached) {
    const parsed = JSON.parse(cached);
    const parsedLastUpdatedTime = new Date(parsed.lastUpdatedTime);

    // if cached data time is equal to or greater than last updated time, return cached
    const lastUpdatedTime = await getLeaderboardLastUpdatedTime(chain);
    if (parsedLastUpdatedTime >= lastUpdatedTime) {
      logger.info('Returning cached leaderboard');
      return parsed;
    }
  }

  // Otherwise cache a new leaderboard and return it
  logger.info('Fetching Leaderboard from Firestore ... ');
  const {
    leaderboard: {
      lastUpdatedTime: {
        chains: { [chain]: lastUpdatedTimestamp }
      }
    }
  } = (await firestore.doc('/counts/counts').get()).data() as any;

  const snapshot = await firestore
    .collection('users')
    .orderBy(`leaderboard.xp.chains.${chain}`, 'desc')
    .limit(100)
    .get();
  const entries = snapshot.docs.map((doc, index) => {
    const { leaderboard, stats } = doc.data();
    return {
      address: doc.id,
      xp: leaderboard?.xp?.chains?.[chain] || 0,
      ...(stats?.[chain] ?? { predictionsVolume: 0, winningsVolume: 0 }),
      rank: index + 1
    };
  });
  const addresses = entries.map((e) => e.address);
  const totalUsersCount = Number((await readGettersContract(chain, 'allStats')).noOfUsers);
  const statsCastora = await readGettersContract(chain, 'usersStatsBulk', [addresses]);
  const statsPoolsManager = await readPoolsManagerContract(chain, 'getUserStatsBulk', [addresses]);
  entries.forEach((entry, index) => {
    entry.joinedPools = Number(statsCastora[index].noOfJoinedPools);
    entry.predictions = Number(statsCastora[index].noOfPredictions);
    entry.winnings = Number(statsCastora[index].noOfWinnings);
    entry.createdPools = Number(statsPoolsManager[index].noOfPoolsCreated);
  });

  const result = {
    entries,
    lastUpdatedTime: lastUpdatedTimestamp?.toDate() ?? new Date(),
    totalUsersCount
  };

  // Cache the result
  try {
    await redisClient.set(
      `${LDB_TOP100_KEY_PREFIX}${chain}`,
      JSON.stringify(result),
      'EX',
      REDIS_LDB_CACHE_TTL_SECONDS
    );
  } catch (e) {
    logger.error(e, `Failed to cache leaderboard for chain: ${chain}`);
  }

  return result;
};

export const getMyLeaderboard = async (userWalletAddress: string, chain: Chain) => {
  logger.info(`Getting My Leaderboard for chain: ${chain} ... `);
  logger.info(`User Wallet Address: ${userWalletAddress}`);
  const cacheKey = getLdbUserPrefix(userWalletAddress, chain);

  // Try to get from cache
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    logger.info('Returning cached leaderboard');
    return parsed;
  }

  // Otherwise cache a new leaderboard and return it
  logger.info(`Fetching User Leaderboard for chain: ${chain}, from Firestore ... `);
  const totalUsersCount = Number((await readGettersContract(chain, 'allStats')).noOfUsers);
  const snapshot = await firestore.doc(`/users/${userWalletAddress}`).get();

  let result;
  if (snapshot.exists) {
    const { leaderboard, stats } = snapshot.data() as any;
    const xp = leaderboard?.xp?.chains?.[chain] || 0;
    let rank = totalUsersCount + 1;
    let joinedPools = 0;
    let predictions = 0;
    let winnings = 0;
    let createdPools = 0;
    if (xp > 0) {
      const totalSnap = await firestore
        .collection('users')
        .where(`leaderboard.xp.chains.${chain}`, '>', xp)
        .count()
        .get();
      rank = totalSnap.data().count + 1;
      const statsCastora = await readGettersContract(chain, 'userStats', [userWalletAddress]);
      const statsPoolsManager = await readPoolsManagerContract(chain, 'getUserStats', [userWalletAddress]);
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
      ...(stats?.[chain] ?? { winningsVolume: 0, predictionsVolume: 0 })
    };
  } else {
    result = {
      address: userWalletAddress,
      lastUpdatedTime: new Date(),
      rank: totalUsersCount + 1,
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
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', REDIS_LDB_CACHE_TTL_SECONDS);
  } catch (e) {
    logger.error(e, `Failed to cache user leaderboard for chain: ${chain}`);
  }

  return result;
};
