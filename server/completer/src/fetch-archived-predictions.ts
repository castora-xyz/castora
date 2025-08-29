import { Chain, Prediction, storage } from '@castora/shared';

/**
 * Returns the archived predictions for the provided chain and poolId
 *
 * @param chain The chain to fetch the archived pool from.
 * @param poolId The poolId to fetch its archive.
 */
export const fetchArchivedPredictions = async (chain: Chain, poolId: number): Promise<Prediction[]> => {
  const archivalRef = storage.bucket().file(`archives/${chain}/pool-${poolId}.json`);

  const fetched = JSON.parse((await archivalRef.download())[0].toString()).predictions;

  return fetched.map((f: any) => new Prediction({ poolId, claimedWinningsTime: 0, ...f }));
};
