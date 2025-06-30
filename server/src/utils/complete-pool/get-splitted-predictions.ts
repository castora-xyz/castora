import { Prediction, SplitPredictionResult } from '../../schemas';

/**
 * Calculates and returns the first "noOfWinners" predictionIds and their predicters
 * whose predictionPrices where closest to the snapshotPrice, that's the winners.
 *
 * @param snapshotPrice The price of the predictionToken at the snapshotTime.
 * @param predictions Array of Predictions from which to calculate the winners.
 * @param noOfWinners The number of winners to compute based on the pool multiplier
 * @returns The predictionIds and their predicters of the winners.
 */
export const getSplittedPredictions = (
  snapshotPrice: number,
  predictions: Prediction[],
  noOfWinners: number
): SplitPredictionResult => {
  // 1. Calculate the absolute differences between the predictionPrices
  // against the snapshotPrice.
  const extracted = [];
  for (let i = 0; i < predictions.length; i++) {
    const { id, predicter, price } = predictions[i];
    const diff = Math.abs(price - snapshotPrice);
    extracted.push({ id, price, diff, predicter, index: i });
  }

  // 2. Compare these differences and rank them from lowest to highest.
  // In case of ties or draws or equal differences, rank them by
  // the earlier-made predictions (first predicter wins).
  const sorted = extracted.sort((a, b) => {
    if (a.diff - b.diff != 0) return a.diff - b.diff;
    else return a.id - b.id;
  });

  // 3. Set the winners as the first "noOfWinners" of predicters with the lowest
  // differences (closest predictionPrices to the snapshotPrice) as the
  // winnerPredictions.
  const winners = sorted.slice(0, noOfWinners);
  const winnerAddresses = [];
  const winnerPredictionIds = [];
  const winnerPredictionIdsBigInts = [];
  for (let i = 0; i < winners.length; i++) {
    predictions[winners[i].index].isAWinner = true;
    winnerAddresses.push(winners[i].predicter);
    winnerPredictionIds.push(winners[i].id);
    winnerPredictionIdsBigInts.push(BigInt(winners[i].id));
  }
  const winnerAddressesUniqued = [...new Set(winnerAddresses)];

  // 5. Return the splitted results
  return {
    predictions,
    winnerAddressesUniqued,
    winnerPredictionIds,
    winnerPredictionIdsBigInts
  };
};
