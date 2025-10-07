import { ArchivedPool, Chain, Pool, SplitPredictionResult, storage } from '@castora/shared';

/**
 * Re-archive a pool after completion to take into account its completion results
 *
 * @param chain The chain to archive the pool on.
 * @param pool The updated pool to re-archive with its completion results
 * @param splitResults The results from setting winners.
 * @param creatorDetails If this is a user created pool
 */
export const rearchivePool = async (
  chain: Chain,
  pool: Pool,
  splitResults: SplitPredictionResult,
  creator?: string,
  creatorCompletionFees?: string
): Promise<void> => {
  const { predictions, winnerAddressesUniqued, winnerPredictionIds } = splitResults;

  const archivalRef = storage.bucket().file(`archives/${chain}/pool-${pool.poolId}.json`);

  if (creator) pool.creator = creator;
  if (creatorCompletionFees) pool.creatorCompletionFees = creatorCompletionFees;
  await archivalRef.save(
    JSON.stringify(
      new ArchivedPool({
        chain,
        pool,
        predictions,
        results: { winnerAddressesUniqued, winnerPredictionIds }
      }).toJSON()
    )
  );
};
