import {
  fetchPool,
  FieldValue,
  firestore,
  getLdbUserPrefix,
  Job,
  logger,
  normalizeChain,
  redisClient,
  storage,
  updateLeaderboardLastUpdatedTime
} from '@castora/shared';
import { getTokenPrice } from './get-token-price.js';
import { Pool, Prediction } from './schemas.js';

/**
 * Handler to update leaderboard from a specific pool.
 *
 * @param job The job containing the pool to use for leaderboard update
 */
export const updateLeaderboardFromPool = async (job: Job): Promise<void> => {
  const { chain: rawChain, poolId } = job.data;
  const chain = normalizeChain(rawChain);
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

  // Get the USD price of the stake token at snapshot time for volume calculations
  const stakeTokenSymbol = pool.json?.pool?.seeds?.stakeToken;
  if (!stakeTokenSymbol) {
    throw `FATAL: could not get stake token symbol for price conversion from archived pool ${poolId} on ${chain}`;
  }

  const snapshotTime = pool.json?.pool?.seeds?.snapshotTime;
  if (!snapshotTime) {
    throw `FATAL: could not get snapshotTime for price conversion from archived pool ${poolId} on ${chain}`;
  }

  // TODO: Reconcile other tokens when added for staking
  if (stakeTokenSymbol !== 'MON') {
    throw `FATAL: handle price conversion of stake token ${stakeTokenSymbol} in pool ${poolId} on ${chain}`;
  }

  const price = await getTokenPrice(stakeTokenSymbol, snapshotTime);
  logger.info(`Obtained stake token price for ${stakeTokenSymbol} at snapshotTime ${snapshotTime}: ${price} USD`);

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

    // on mainnets OVERALL, we've never updated leaderboard stats for this user so we increment global count
    if (!userSnap.exists || !userSnap.data()?.leaderboard || !userSnap.data()?.leaderboard?.xp.mainnet) {
      await firestore.doc('/counts/counts').set({ mainnetUsersCount: FieldValue.increment(1) }, { merge: true });
      logger.info(`\n📝 Incremented global mainnetUsersCount by 1 for user: ${address}`);
    }

    // apply prediction volume points with price conversion and leftover from before
    xp += Math.trunc(predictions.length * pool.stakeAmount * price + leftover);

    // keep new leftover for next time
    leftover = (predictions.length * pool.stakeAmount * price + leftover) % 1;

    // filter out winner predictions and apply points
    const winnings = predictions.filter(({ isAWinner }) => isAWinner);
    xp += winnings.length; // Using 1 winning for 1 XP

    let predictionsVolume = predictions.length * pool.stakeAmount * price;
    // mainnet fees percent from pool seeds, subtract from 1
    const feesPercent = pool.json?.pool?.seeds?.feesPercent;
    if (feesPercent === undefined) {
      throw `FATAL: could not get feesPercent from archived pool ${poolId} on ${chain} for winnings volume calculation`;
    }
    const dividedBy = 1 - feesPercent / 100;

    let winningsVolume = (winnings.length * pool.winAmount * price) / dividedBy; // winnings volume without fees

    // save user to firestore
    await userRef.set(
      {
        stats: {
          [chain]: {
            predictionsVolume: FieldValue.increment(predictionsVolume),
            winningsVolume: FieldValue.increment(winningsVolume)
          },
          mainnet: {
            predictionsVolume: FieldValue.increment(predictionsVolume),
            winningsVolume: FieldValue.increment(winningsVolume)
          }
        },
        leaderboard: {
          leftoverStakeAmounts: { [chain]: leftover },
          lastUpdatedTime: FieldValue.serverTimestamp(),
          xp: {
            chains: { [chain]: FieldValue.increment(xp) },
            mainnet: FieldValue.increment(xp),
            total: FieldValue.increment(xp)
          }
        }
      },
      { merge: true }
    );

    // Remove the user leaderboard data in Redis cache only if it exists already
    // as it was easier to invalidate the cache individually from here.
    // When the user requests their leaderboard data next time, it will be re-cached.
    const userKey = getLdbUserPrefix(address, chain);
    const userCached = await redisClient.get(userKey);
    if (userCached) {
      await redisClient.del(userKey);
      logger.info(`User ${address} had cached ${chain} leaderboard info in Redis and have deleted it.`);
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
        leaderboard: {
          lastUpdatedTime: FieldValue.serverTimestamp(),
          xp: {
            chains: { [chain]: FieldValue.increment(3) }, // Using x3 XP for creators
            mainnet: FieldValue.increment(3), // Using x3 XP for creators
            total: FieldValue.increment(3) // Using x3 XP for creators
          }
        }
      },
      { merge: true }
    );
    logger.info(`✨ Has Incremented createdPools count and XP for Pool Creator ${pool.creator}`);
  }

  // Note the last updated time of the pool as now
  await updateLeaderboardLastUpdatedTime(chain, new Date());
  logger.info(`Updated last update time for mainnet ${chain} leaderboard in Redis`);

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
          mainnet: FieldValue.serverTimestamp(),
          total: FieldValue.serverTimestamp()
        },
        processedPools: {
          chains: { [chain]: FieldValue.increment(1) },
          mainnet: FieldValue.increment(1),
          total: FieldValue.increment(1)
        }
      }
    },
    { merge: true }
  );
  logger.info(`📝 Incremented global total and perChain leaderboard processed count for pool ${poolId} on ${chain}`);
};
