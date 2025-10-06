import { Chain, logger, Pool, SplitPredictionResult, writeContract } from '@castora/shared';
import { fetchArchivedPredictions } from './fetch-archived-predictions.js';
import { getNoOfWinners, PoolMultiplier } from './get-no-of-winners.js';
import { getSplittedPredictions } from './get-splitted-predictions.js';

/**
 * Computes the winner predictions in the provided pool.
 *
 * Specifically, this method does the following:
 *  * Fetches archived predictions for the pool.
 *  * Validates the number of predictions.
 *  * Calculates the number of winners based on the multiplier.
 *  * Determines the winning predictions.
 *  * Calculates the win amount for each winner.
 *  * Sets the winners by calling completePool in the contract.
 *
 * @param chain The chain to fetch the pool from.
 * @param pool The pool in which to compute its winners.
 * @param snapshotPrice The price snapshot used for winner calculation.
 * @param multiplier The multiplier used to determine number of winners.
 * @returns The result containing winner prediction IDs.
 */
export const setWinners = async (
  chain: Chain,
  pool: Pool,
  snapshotPrice: number,
  multiplier: PoolMultiplier
): Promise<SplitPredictionResult> => {
  logger.info('\nFetching Predictions from Archive ... ');
  const predictions = await fetchArchivedPredictions(chain, pool.poolId);
  logger.info(`Fetched all ${predictions.length} predictions.`);

  if (predictions.length != pool.noOfPredictions) {
    throw (
      'FATAL: unmatching predictions length.' +
      ` pool ID: ${pool.poolId} pool.noOfPredictions (${pool.noOfPredictions}) ` +
      `doesn't equal all fetched predictions.length (${predictions.length});`
    );
  }

  const noOfWinners = getNoOfWinners(pool.noOfPredictions, multiplier);
  logger.info(`\nnoOfWinners: ${noOfWinners}`);

  logger.info('\nComputing Winners ... ');
  const splitted = getSplittedPredictions(snapshotPrice, predictions, noOfWinners);
  logger.info(`Computed ${splitted.winnerPredictionIdsBigInts.length} winners.`);

  // Divide 95% of the total pool's money by the number of winners
  // (half of pool.noOfPredictions) and set the result as the
  // winAmount. The other 5% goes into gas fees and maintenance.
  //
  // Remember that these are onchain numbers, so we can't have decimals.
  // and hence have to use 95 and 100.
  //
  // Truncating is to ensure that the winAmount is a whole number.
  const winAmount = Math.trunc((pool.seeds.stakeAmount * pool.noOfPredictions * 95) / (noOfWinners * 100));
  logger.info(`\nwinAmount: ${winAmount}`);

  logger.info('\nCalling Complete Pool in Contract ... ');
  await writeContract(
    chain,
    'completePool',
    [
      BigInt(pool.poolId),
      BigInt(snapshotPrice),
      BigInt(noOfWinners),
      BigInt(winAmount),
      splitted.winnerPredictionIdsBigInts
    ],
    `Complete Pool ${pool.poolId} on chain ${chain}`,
    true
  );
  logger.info(`Called Complete Pool for poolId: ${pool.poolId}`);

  return splitted;
};
