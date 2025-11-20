import {
  fetchPool,
  FieldValue,
  firestore,
  Job,
  LDB_TESTNET_USER_PREFIX,
  logger,
  REDIS_CACHE_TTL_SECONDS,
  redisClient,
  storage,
  updateTestnetLeaderboardLastUpdatedTime
} from '@castora/shared';
import { Pool, Prediction } from './schemas.js';

/**
 * Handler to update leaderboard from a specific pool.
 *
 * @param job The job containing the pool to use for leaderboard update
 */
export const updateLeaderboardFromPool = async (job: Job): Promise<void> => {
  const { chain, poolId } = job.data;
  logger.info(`\n\n\n Start processing job for poolId: ${poolId}, chain: ${chain}`);

  // Check that the pool has predictions on chain, otherwise end process.
  const onChainPool = await fetchPool(chain, poolId);
  if (onChainPool.noOfPredictions === 0) {
    logger.info(`Pool ${poolId} on ${chain} has no predictions. Ending job...`);
    return;
  }

  // Fetch pool from archive
  let pool: Pool;
  const archivalRef = storage.bucket().file(`archives/${chain}/pool-${poolId}.json`);
  try {
    pool = new Pool(JSON.parse((await archivalRef.download())[0].toString()));
    logger.info(`Fetched pool: ${poolId} on ${chain}`);
  } catch (e) {
    throw `Failed to fetch pool from archive: ${e}`;
  }

  // Check if pool has been processed for leaderboard, if so stop.
  if (pool.hasBeenProcessedInLeaderboard) {
    logger.info(`Pool ${poolId} on ${chain} has already been processed for leaderboard. Ending job...`);
    return;
  }

  // if there is no winAmount, then something is wrong
  if (pool.winAmount === 0) {
    throw `Pool ${poolId} on ${chain} has 0 winAmount in archive but that shouldn't happen.`;
  }

  // if there predictions count in archived pool doesn't match onchain predictions count, fail the process
  if (pool.predictions.length !== onChainPool.noOfPredictions) {
    throw (
      'FATAL: unmatching predictions length.' +
      ` pool ID: ${pool.poolId} onChainPool.noOfPredictions (${onChainPool.noOfPredictions}) ` +
      `doesn't equal all fetched predictions from archive (${pool.predictions.length});`
    );
  }

  // Group predictions by user addresses
  const grouped: Record<string, Prediction[]> = {};
  for (let prediction of pool.predictions) {
    if (!grouped[prediction.predicter]) grouped[prediction.predicter] = [];
    grouped[prediction.predicter].push(prediction);
  }
  logger.info(`Grouped ${Object.keys(grouped).length} addresses`);

  // Loop through grouped addresses
  // Use job.progress for starting index to resume job if need be
  const uniqdCount = Object.keys(grouped).length;
  for (let i = job.progress as number; i < uniqdCount; i++) {
    const address = Object.keys(grouped)[i];
    const predictions = grouped[address];
    const userRef = firestore.doc(`/users/${address}`);
    let xp = 0;

    // apply prediction count points
    xp += predictions.length; // Using 1 prediction for 1 XP

    // check if there were leftover stake amounts to add to volume
    let leftover = 0;
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      const userData = userSnap.data();
      leftover = userData?.leaderboard?.leftoverStakeAmounts?.[chain] ?? 0;
    }

    if (!userSnap.exists || !userSnap.data()?.leaderboard) {
      // we've never updated leaderboard stats for this user so we increment global count
      await firestore.doc('/counts/counts').set({ monadTestnetUsersCount: FieldValue.increment(1) }, { merge: true });
      logger.info(`\n📝 Incremented global monadTestnetUsersCount by 1 for user: ${address}`);
    }

    // apply prediction volume points
    xp += Math.trunc(predictions.length * pool.stakeAmount + leftover); // Using 1 MON for 1 XP

    // keep leftover for next time
    leftover = (predictions.length * pool.stakeAmount + leftover) % 1;

    // filter out winner predictions and apply points
    const winnings = predictions.filter(({ isAWinner }) => isAWinner);
    xp += winnings.length; // Using 1 winning for 1 XP

    // save user to firestore
    await userRef.set(
      {
        monadTestnetStats: {
          pools: FieldValue.increment(1),
          predictions: FieldValue.increment(predictions.length),
          predictionsVolume: FieldValue.increment(predictions.length * pool.stakeAmount),
          winnings: FieldValue.increment(winnings.length),
          winningsVolume: FieldValue.increment((winnings.length * pool.winAmount) / 0.95) // winnings volume without fees
        },
        leaderboard: {
          leftoverStakeAmounts: { [chain]: leftover },
          lastUpdatedTime: FieldValue.serverTimestamp(),
          xp: {
            chains: { [chain]: FieldValue.increment(xp) },
            // TODO: Unhardcode this testnet when in mainnet
            testnet: FieldValue.increment(xp),
            total: FieldValue.increment(xp)
          }
        }
      },
      { merge: true }
    );

    // Update the user leaderboard data in Redis cache only if it exists already
    // as it was easier to invalidate the cache individually from here
    const userKey = `${LDB_TESTNET_USER_PREFIX}${address}`;
    const userCached = await redisClient.get(userKey);
    if (userCached) {
      const newUserSnapshot = await userRef.get();
      const { leaderboard, monadTestnetStats } = newUserSnapshot.data() as any;
      const xp = leaderboard.xp.testnet;
      const totalSnap = await firestore.collection('users').where('leaderboard.xp.testnet', '>', xp).count().get();
      const rank = totalSnap.data().count + 1;

      await redisClient.set(
        userKey,
        JSON.stringify({
          lastUpdatedTime: leaderboard.lastUpdatedTime.toDate(),
          xp,
          rank,
          ...monadTestnetStats
        }),
        'EX',
        REDIS_CACHE_TTL_SECONDS
      );
      logger.info(`User ${address} had cached testnet leaderboard info in Redis and have updated it.`);
    }

    // update job progress
    job.updateProgress(i + 1);
    logger.info(
      `📝 Processed ${i + 1} of ${uniqdCount} addresses ` +
        `:: XP:${xp} :: Address:${address} :: Predictions:${predictions.length}`
    );
  }

  // Check if pool has creator and apply creator points
  if (pool.creator) {
    const creatorRef = firestore.doc(`/users/${pool.creator}`);
    await creatorRef.set(
      {
        monadTestnetStats: {
          createdPools: FieldValue.increment(1)
        },
        leaderboard: {
          lastUpdatedTime: FieldValue.serverTimestamp(),
          xp: {
            chains: { [chain]: FieldValue.increment(3) }, // Using x3 XP for creators
            // TODO: Unhardcode this testnet when in mainnet
            testnet: FieldValue.increment(3), // Using x3 XP for creators
            total: FieldValue.increment(3) // Using x3 XP for creators
          }
        }
      },
      { merge: true }
    );
  }

  // Note the last updated time of the pool as now
  await updateTestnetLeaderboardLastUpdatedTime(new Date());
  logger.info('Updated last update time for testnet leaderboard in Redis');

  // Update the pool to mark the leaderboard processed
  try {
    pool.json.pool.hasBeenProcessedInLeaderboard = true;
    await archivalRef.save(JSON.stringify(pool.json));
    logger.info('Updated pool to mark leaderboard processed');
  } catch (e) {
    logger.error(`Failed to update pool ${poolId} on ${chain} to mark leaderboard processed, error: ${e}`);
  }

  // Increment global stats for leaderboard
  await firestore.doc('/counts/counts').set(
    {
      leaderboard: {
        lastUpdatedTime: {
          chains: { [chain]: FieldValue.serverTimestamp() },
          testnet: FieldValue.serverTimestamp(),
          total: FieldValue.serverTimestamp()
        },
        processedPools: {
          chains: { [chain]: FieldValue.increment(1) },
          testnet: FieldValue.increment(1),
          total: FieldValue.increment(1)
        }
      }
    },
    { merge: true }
  );
  logger.info(`📝 Incremented global total and perChain leaderboard processed count for pool ${poolId} on ${chain}`);
};
