import { Prediction, SplitPredictionResult } from '../../schemas';
import { getNoOfWinners } from './get-no-of-winners';

/**
 * Calculates and returns the predictionIds and their predicters
 * whose predictionPrices where closest to the snapshotPrice and
 * those that were away from it. That is both winners and losers.
 *
 * The winners are the first half of the predictions with the closest
 * predictionPrices to the snapshotPrice. The losers are the others.
 *
 * @param snapshotPrice The price of the predictionToken at the snapshotTime.
 * @param predictions Array of Predictions from which to calculate the winners.
 * @returns The predictionIds and their predicters of the winners.
 */
export const getSplittedPredictions = (
  snapshotPrice: number,
  predictions: Prediction[]
): SplitPredictionResult => {
  // 1. Calculate the absolute differences between the predictionPrices
  // against the snapshotPrice.
  const extracted = [];
  for (let i = 0; i < predictions.length; i++) {
    const { id, predicter, price } = predictions[i];
    const diff = Math.abs(price - snapshotPrice);
    extracted.push({ id, price, diff, predicter });
  }

  // 2. Compare these differences and rank them from lowest to highest.
  // In case of ties or draws or equal differences, rank them by
  // the earlier-made predictions (first predicter wins).
  const sorted = extracted.sort((a, b) => {
    if (a.diff - b.diff != 0) return a.diff - b.diff;
    else return a.id - b.id;
  });

  // 3. Set the winners as the first half of predicters with the lowest
  // differences (closest predictionPrices to the snapshotPrice) as the
  // winnerPredictions.
  const noOfWinners = getNoOfWinners(predictions.length);
  const winners = sorted.slice(0, noOfWinners);
  const winnerAddresses = [];
  const winnerPredictionIds = [];
  for (let i = 0; i < winners.length; i++) {
    winnerPredictionIds.push(BigInt(winners[i].id));
    winnerAddresses.push(winners[i].predicter);
  }

  // 4. Set the losers as the other half.
  const losers = sorted.slice(noOfWinners, predictions.length);
  const loserAddresses = [];
  const loserPredictionIds = [];
  for (let i = 0; i < losers.length; i++) {
    loserAddresses.push(losers[i].predicter);
    loserPredictionIds.push(BigInt(losers[i].id));
  }

  // 5. Return the splitted results
  return {
    loserAddresses,
    loserPredictionIds,
    winnerAddresses,
    winnerPredictionIds
  };
};
