import {
  Chain,
  fetchPool,
  generateExperimentalsSeeds,
  generateLiveSeeds,
  getPoolId,
  getSnapshotPrice,
  logger,
  notifyWinners,
  setWinners
} from '../../utils';
// import { updateLeaderboardOnCompletePool } from '../../utils/update-leaderboard';

/**
 * Completes all live pools on the provided chain.
 *
 * @param chain The chain to complete all live pools on.
 */
export const completePools = async (chain: Chain) => {
  const prevs = [
    ...generateLiveSeeds(chain),
    ...generateExperimentalsSeeds(chain)
  ];
  for (const seed of prevs) {
    const poolId = await getPoolId(chain, seed);
    try {
      if (poolId) await completePool(chain, poolId);
    } catch (e: any) {
      if (['Not yet snapshotTime', 'Nobody joined this pool'].includes(e)) {
        logger.info(e);
      } else {
        throw e;
      }
    } finally {
      logger.info('\n\n');
    }
  }
};

/**
 * Completes a pool by taking its snapshot and computing its winners.
 *
 * @param chain The chain to complete the pool on.
 * @param poolId The poolId in which to compute its winners
 */
export const completePool = async (
  chain: Chain,
  poolId: any
): Promise<void> => {
  let pool = await fetchPool(chain, poolId);
  const { noOfPredictions, completionTime, seeds } = pool;

  logger.info('pool.seeds.snapshotTime: ', seeds.snapshotTime);
  logger.info(
    'pool.seeds.snapshotTime (display): ',
    new Date(seeds.snapshotTime * 1000)
  );
  if (Math.round(Date.now() / 1000) < seeds.snapshotTime) {
    throw 'Not yet snapshotTime';
  }

  logger.info('\npool.noOfPredictions: ', noOfPredictions);
  if (noOfPredictions === 0) {
    throw 'Nobody joined this pool';
  }

  if (completionTime !== 0) {
    logger.info('\npool.completionTime: ', completionTime);
    logger.info(
      'pool.completionTime (display): ',
      new Date(completionTime * 1000)
    );
    logger.info('Pool has been completed. Ending Process.');
  } else {
    logger.info('Getting Snapshot Price ...');
    const snapshotPrice = await getSnapshotPrice(pool);
    logger.info('Got Snapshot Price: ', snapshotPrice);

    const setWinnersResults = await setWinners(chain, pool, snapshotPrice);

    // refetching the pool here so that the winAmount will now be valid
    pool = await fetchPool(chain, poolId);

    // await updateLeaderboardOnCompletePool(chain, {
    //   pool,
    //   ...setWinnersResults
    // });

    await notifyWinners(setWinnersResults.splitted.winnerAddresses, pool);
  }
};
