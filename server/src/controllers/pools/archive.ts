import {
  ArchivedPool,
  Pool,
  Prediction,
  SplitPredictionResult
} from '../../schemas';
import {
  Chain,
  fetchPool,
  getCryptoSeeds,
  getPoolId,
  getStocksSeeds,
  storage
} from '../../utils';
import { fetchPredictions } from '../../utils/complete-pool/fetch-predictions';

/**
 * Archives the predictions for live pools on the provided chain after
 * window close time but before snapshot time to use the predictions
 * completing the pools.
 *
 * @param chain The chain to archive all live pools on.
 */
export const archivePools = async (chain: Chain) => {
  const prevs = [...getCryptoSeeds(chain), ...getStocksSeeds(chain)];

  for (const seed of prevs) {
    const poolId = await getPoolId(chain, seed);
    try {
      if (poolId) await archivePool(chain, poolId);
    } catch (e: any) {
      if (['Not yet windowCloseTime', 'Nobody joined this pool'].includes(e)) {
        console.log(e);
      } else {
        throw e;
      }
    } finally {
      console.log('\n\n');
    }
  }
};

/**
 * Archives a pool by saving its predictions to use for completion later on
 *
 * @param chain The chain to archive the pool on.
 * @param poolId The poolId to archive its predictions
 */
export const archivePool = async (chain: Chain, poolId: any): Promise<void> => {
  const pool = await fetchPool(chain, poolId);
  const { noOfPredictions, seeds } = pool;

  console.log('pool.seeds.windowCloseTime: ', seeds.windowCloseTime);
  console.log(
    'pool.seeds.windowCloseTime (display): ',
    new Date(seeds.windowCloseTime * 1000)
  );
  if (Math.round(Date.now() / 1000) < seeds.windowCloseTime) {
    throw 'Not yet windowCloseTime';
  }

  console.log('\npool.noOfPredictions: ', noOfPredictions);
  if (noOfPredictions === 0) {
    throw 'Nobody joined this pool';
  }

  const archivalRef = storage
    .bucket()
    .file(`archives/${chain}/pool-${poolId}.json`);
  const [exists] = await archivalRef.exists();

  if (exists) {
    console.log(`Pool ${poolId} already pre-archived.`);
    return;
  }

  console.log('\nFetching Predictions ... ');
  const predictions = await fetchPredictions(chain, pool);
  console.log(`Fetched all ${predictions.length} predictions.`);

  if (predictions.length != pool.noOfPredictions) {
    console.log(
      `Fatal: pool.noOfPredictions (${pool.noOfPredictions}) `,
      `doesn't equal all fetched predictions.length (${predictions.length});`
    );
    // TODO: Alert developers
    throw 'Fatal: unmatching predictions length';
  }

  await archivalRef.save(
    JSON.stringify(new ArchivedPool({ chain, pool, predictions }).toJSON())
  );
  console.log(`Successfully pre-archived predictions in Pool ${poolId}`);
};

/**
 * Re-archive a pool after completion to take into account its completion results
 *
 * @param chain The chain to archive the pool on.
 * @param pool The updated pool to re-archive with its completion results
 * @param splitResults The results from setting winners.
 */
export const rearchivePool = async (
  chain: Chain,
  pool: Pool,
  splitResults: SplitPredictionResult
): Promise<void> => {
  const { predictions, winnerAddressesUniqued, winnerPredictionIds } =
    splitResults;

  const archivalRef = storage
    .bucket()
    .file(`archives/${chain}/pool-${pool.poolId}.json`);

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

/**
 * Returns the archived predictions for the provided chain and poolId
 *
 * @param chain The chain to fetch the archived pool from.
 * @param poolId The poolId to fetch its archive.
 */
export const fetchPredictionsFromArchive = async (
  chain: Chain,
  poolId: number
): Promise<Prediction[]> => {
  const archivalRef = storage
    .bucket()
    .file(`archives/${chain}/pool-${poolId}.json`);

  const fetched = JSON.parse(
    (await archivalRef.download())[0].toString()
  ).predictions;

  return fetched.map(
    (f: any) => new Prediction({ poolId, claimedWinningsTime: 0, ...f })
  );
};
