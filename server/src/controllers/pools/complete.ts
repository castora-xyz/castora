import 'dotenv/config';
import {
  Chain,
  fetchPool,
  getCryptoSeeds,
  getPoolId,
  getSnapshotPrice,
  getStocksSeeds,
  notifyWinners,
  setWinners
} from '../../utils';
import { rearchivePool } from './archive';

/**
 * Completes all live pools on the provided chain.
 *
 * @param chain The chain to complete all live pools on.
 */
export const completePools = async (chain: Chain) => {
  const prevs = [...getCryptoSeeds(chain), ...getStocksSeeds(chain)];
  for (const seed of prevs) {
    const poolId = await getPoolId(chain, seed);
    try {
      if (poolId) await completePool(chain, poolId);
    } catch (e: any) {
      if (['Not yet snapshotTime', 'Nobody joined this pool'].includes(e)) {
        console.log(e);
      } else {
        throw e;
      }
    } finally {
      console.log('\n\n');
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

  console.log('pool.seeds.snapshotTime: ', seeds.snapshotTime);
  console.log(
    'pool.seeds.snapshotTime (display): ',
    new Date(seeds.snapshotTime * 1000)
  );
  if (Math.round(Date.now() / 1000) < seeds.snapshotTime) {
    throw 'Not yet snapshotTime';
  }

  console.log('\npool.noOfPredictions: ', noOfPredictions);
  if (noOfPredictions === 0) {
    throw 'Nobody joined this pool';
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

    const splitResult = await setWinners(chain, pool, snapshotPrice);

    // refetching the pool here so that the winAmount and completionTime will now be valid
    pool = await fetchPool(chain, poolId);

    // re-archiving to store the updated winner predictions off-chain for leaderboard updates.
    await rearchivePool(chain, pool, splitResult);

    // send notifications to winners to go and claim
    await notifyWinners(splitResult.winnerAddressesUniqued, pool);
  }
};
