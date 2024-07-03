import 'dotenv/config';
import {
  fetchPool,
  generateSeeds,
  getPoolId,
  getSnapshotPrice,
  notifyWinners,
  setWinners
} from '../../utils';

export const completePools = async () => {
  const prevs = generateSeeds();
  for (const seed of prevs) {
    const poolId = await getPoolId(seed);
    try {
      if (poolId) await completePool(poolId);
    } finally {
      console.log('\n\n');
    }
  }
};

/**
 * Completes a pool by taking its snapshot and computing its winners.
 *
 * @param poolId The poolId in which to compute its winners
 */
export const completePool = async (poolId: any): Promise<void> => {
  const pool = await fetchPool(poolId);
  const { noOfPredictions, completionTime, seeds } = pool;

  console.log('pool.seeds.snapshotTime: ', seeds.snapshotTime);
  console.log(
    'pool.seeds.snapshotTime (display): ',
    new Date(seeds.snapshotTime * 1000)
  );
  if (Math.round(Date.now() / 1000) < seeds.snapshotTime) {
    throw 'Not yet snapshotTime.';
  }

  console.log('\npool.noOfPredictions: ', noOfPredictions);
  if (noOfPredictions === 0) {
    console.log('Nobody joined this pool');
    return;
  }

  if (completionTime !== 0) {
    console.log('\npool.completionTime: ', completionTime);
    console.log(
      'pool.completionTime (display): ',
      new Date(completionTime * 1000)
    );
    console.log('Pool has been completed. Ending Process.');
  } else {
    console.log('Getting Snapshot Price ...');
    const snapshotPrice = await getSnapshotPrice(pool);
    console.log('Got Snapshot Price: ', snapshotPrice);

    const winnerAddresses = await setWinners(pool, snapshotPrice);

    await notifyWinners(winnerAddresses, pool);
  }
};
