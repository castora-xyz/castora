/**
 * The x times of stake that winners go with.
 */
export type PoolMultiplier = 2 | 3 | 4 | 5 | 10;

/**
 * Calculates the noOfWinners for the pool as a quotient of noOfPredictions
 * against the poolMultiplier.
 *
 * So if a poolMultiplier is **2**, the noOfWinners will be **half** of the noOfPredictions.
 * If a poolMultiplier is **3**, the noOfWinners will be a **third** of the noOfPredictions.
 * If a poolMultiplier is **4**, the noOfWinners will be a **quarter** of the noOfPredictions.
 * If a poolMultiplier is **5**, the noOfWinners will be a **fifth** of the noOfPredictions.
 * And If a poolMultiplier is **10**, the noOfWinners will be a **tenth** of the noOfPredictions.
 *
 * Always returns the lower bound (whole number) of the quotient in case of decimals.
 *
 * For example, when there are 10 predictions and the poolMultiplier is 2,
 * there will be 5 winners but when there are 11 predictions, there will still be 5 winners.
 *
 * However, if only one person joined the pool, that person becomes the only
 * winner.
 *
 * @param noOfPredictions The noOfPredictions from which to calculate the
 * noOfWinners.
 * @param poolMultiplier How much of stake winners go with, that's x2, x3, x4, x5, or x10
 * @returns The calculated noOfWinners.
 */
export const getNoOfWinners = (
  noOfPredictions: number,
  poolMultiplier: PoolMultiplier
): number => {
  if (noOfPredictions == 1) return 1;

  let computed = Math.floor(noOfPredictions / poolMultiplier);

  // Ensure at least one winner when predictions are less than poolMultiplier
  if (computed < 1) computed = 1;
  
  return computed;
};
