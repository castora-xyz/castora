import 'dotenv/config';

import { fetchPredictionsFromArchive } from '../../controllers';
import { Pool, SplitPredictionResult } from '../../schemas';
import { writeContract } from '../contract';
import { Chain } from '../validate-chain';
import { getNoOfWinners } from './get-no-of-winners';
import { getSplittedPredictions } from './get-splitted-predictions';

/**
 * Computes the winner predictions in the provided pool.
 *
 * Specifically, this method does the following:
 *  * Calculates the winner predictions.
 *  * Sets the winners by calling completePool in the contract.
 *
 * @param chain The chain to fetch the pool from.
 * @param pool The pool in which to compute its winners
 */
export const setWinners = async (
  chain: Chain,
  pool: Pool,
  snapshotPrice: number
): Promise<SplitPredictionResult> => {
  console.log('\nFetching Predictions from Archive ... ');
  const predictions = await fetchPredictionsFromArchive(chain, pool.poolId);
  console.log(`Fetched all ${predictions.length} predictions.`);

  if (predictions.length != pool.noOfPredictions) {
    console.log(
      `Fatal: pool.noOfPredictions (${pool.noOfPredictions}) `,
      `doesn't equal all fetched predictions.length (${predictions.length});`
    );
    // TODO: Alert developers
    throw 'Fatal: unmatching predictions length';
  }

  const noOfWinners = getNoOfWinners(
    pool.noOfPredictions,
    pool.poolId == 3000 ? 10 : 2
  );
  console.log('\nnoOfWinners: ', noOfWinners);

  console.log('\nComputing Winners ... ');
  const splitted = getSplittedPredictions(
    snapshotPrice,
    predictions,
    noOfWinners
  );
  console.log(
    `Computed ${splitted.winnerPredictionIdsBigInts.length} winners.`
  );

  // Divide 95% of the total pool's money by the number of winners
  // (half of pool.noOfPredictions) and set the result as the
  // winAmount. The other 5% goes into gas fees and maintenance.
  //
  // Remember that these are onchain numbers, so we can't have decimals.
  // and hence have to use 95 and 100.
  //
  // Truncating is to ensure that the winAmount is a whole number.
  const winAmount = Math.trunc(
    (pool.seeds.stakeAmount * pool.noOfPredictions * 95) / (noOfWinners * 100)
  );
  console.log('\nwinAmount: ', winAmount);

  console.log('\nCalling Complete Pool in Contract ... ');
  await writeContract(chain, 'completePool', [
    BigInt(pool.poolId),
    BigInt(snapshotPrice),
    BigInt(noOfWinners),
    BigInt(winAmount),
    splitted.winnerPredictionIdsBigInts
  ]);
  console.log('Called Complete Pool for poolId: ', pool.poolId);

  return splitted;
};
