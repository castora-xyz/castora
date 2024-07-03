import { Prediction } from '../../models';
import { getNoOfWinners } from './get-no-of-winners';

/**
 * Calculates and returns the predictionIds and their predicters
 * whose predictionPrices where closest to the snapshotPrice.
 *
 * The winners are the first half of the predictions with the closest
 * predictionPrices to the snapshotPrice.
 *
 * @param snapshotPrice The price of the predictionToken at the snapshotTime.
 * @param predictions Array of Predictions from which to calculate the winners.
 * @returns The predictionIds and their predicters of the winners.
 */
export const getWinnerPredictions = (
  snapshotPrice: number,
  predictions: Prediction[]
) => {
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
  const winners = sorted.slice(0, getNoOfWinners(predictions.length));
  const predictionIds = [];
  const addresses = [];
  for (let i = 0; i < winners.length; i++) {
    predictionIds.push(BigInt(winners[i].id));
    addresses.push(winners[i].predicter);
  }
  return { predictionIds, addresses };
};
