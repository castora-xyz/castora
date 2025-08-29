import { ArchivedPool, Chain, Pool, SplitPredictionResult, storage } from '@castora/shared';

/**
 * Re-archive a pool after completion to take into account its completion results
 *
 * @param chain The chain to archive the pool on.
 * @param pool The updated pool to re-archive with its completion results
 * @param splitResults The results from setting winners.
 */
export const rearchivePool = async (chain: Chain, pool: Pool, splitResults: SplitPredictionResult): Promise<void> => {
  const { predictions, winnerAddressesUniqued, winnerPredictionIds } = splitResults;

  const archivalRef = storage.bucket().file(`archives/${chain}/pool-${pool.poolId}.json`);

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
