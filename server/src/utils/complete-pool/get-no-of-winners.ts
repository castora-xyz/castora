/**
 * Calculates the noOfWinners for the pool as half of noOfPredictions.
 *
 * When noOfPredictions is an odd number, the number of winners
 * will be the lower bound of the half decimal. For example, when there are
 * 10 predictions, there will be 5 winners but when there are 11 predictions,
 * there will still be 5 winners.
 * 
 * However, if only one person joined the pool, that person becomes the only 
 * winner.
 *
 * @param noOfPredictions The noOfPredictions from which to calculate the
 * noOfWinners.
 * @returns The calculated noOfWinners.
 */
export const getNoOfWinners = (noOfPredictions: number): number =>
  noOfPredictions == 1 ? 1 : Math.floor(noOfPredictions / 2);
