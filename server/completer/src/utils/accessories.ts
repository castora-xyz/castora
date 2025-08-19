import { Chain, logger, readContract, storage } from '.';
import { ArchivedPool, Pool, Prediction, SplitPredictionResult } from '../schemas';

/**
 * Fetches and returns a pool from the provided Castora contract.
 *
 * @param chain The chain to fetch the pool from.
 * @param poolId The poolId of the pool to get its details.
 * @returns An instance of the pool that was fetched.
 */
export const fetchPool = async (chain: Chain, poolId: any): Promise<Pool> => {
  if (Number.isNaN(poolId)) throw 'Got a non-numeric poolId';
  if (Number(poolId) == 0) throw 'poolId cannot be zero';
  if (Number(poolId) < 0) throw 'poolId cannot be negative';
  if (!Number.isInteger(Number(poolId))) throw 'poolId must be an integer';

  const noOfPools = Number(await readContract(chain, 'noOfPools'));
  if (Number.isNaN(noOfPools)) throw 'Got a non-numeric noOfPools';
  logger.info('Current noOfPools is: ', noOfPools);
  if (poolId > noOfPools) throw `Invalid poolId: ${poolId}`;
  poolId = Number(poolId);

  logger.info('\nFetching Pool Details ... ');
  const raw = await readContract(chain, 'pools', [BigInt(poolId)]);
  if (!raw) {
    throw 'Could not fetch pool';
  } else {
    logger.info('Fetched Pool Details.');
    const pool = new Pool(raw);
    logger.info(pool);
    console.log(pool);
    return pool;
  }
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
  const archivalRef = storage.bucket().file(`archives/${chain}/pool-${poolId}.json`);

  const fetched = JSON.parse((await archivalRef.download())[0].toString()).predictions;

  return fetched.map((f: any) => new Prediction({ poolId, claimedWinningsTime: 0, ...f }));
};
