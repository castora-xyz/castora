import 'dotenv/config';
import fetch from 'node-fetch';
import { logger } from '..';
import { Pool } from '../../schemas';
import { tokens } from '../tokens';

/**
 * Obtains and returns the price of the predictionToken as at the
 * snapshotTime of the provided pool from Pyth.
 *
 * @param pool The poolId in which to take the snapshot price.
 * @returns The obtained snapshotPrice
 */
export const getSnapshotPrice = async (pool: Pool): Promise<number> => {
  const {
    seeds: { predictionToken, snapshotTime }
  } = pool;

  const found = tokens.find(
    (t) => t.address.toLowerCase() === predictionToken.toLowerCase()
  );
  if (!found) throw `Token not found in tokens.ts: ${predictionToken}`;
  const { pythPriceId } = found;

  logger.info(
    `Obtained Pyth ID for predictionToken (${predictionToken}) : `,
    pythPriceId
  );

  logger.info(
    `\nObtaining Price Update Data from Pyth for pool.poolSeeds.snapshotTime:` +
      ` ${snapshotTime}`
  );

  let pythResponse;
  let pythResponseCloned; // for logging if response wasn't not JSON
  let priceUpdateData;

  try {
    pythResponse = await fetch(
      `https://benchmarks.pyth.network/v1/updates/price/${snapshotTime}?ids=${pythPriceId}&parsed=true`
    );
    pythResponseCloned = pythResponse.clone();
  } catch (e) {
    logger.error(
      "Couldn't FETCH Price Info from Pyth. ",
      ` pool ID: ${pool.poolId}, error: ${e} `
    );
    throw 'Something went wrong, try again later.';
  }

  try {
    priceUpdateData = (await pythResponse.json()) as any;
  } catch (e) {
    logger.error(
      "Couldn't PARSE Price Info from Pyth. ",
      ` pool ID: ${pool.poolId} `,
      `Pyth Response: ${await pythResponseCloned.text()}`
    );
    throw 'Something went wrong, try again later.';
  }

  logger.info('Obtained Price Update Data: ', priceUpdateData);
  console.log('Obtained Price Update Data: ', priceUpdateData);

  if (
    'parsed' in priceUpdateData &&
    Array.isArray(priceUpdateData.parsed) &&
    priceUpdateData.parsed.length > 0 &&
    'price' in priceUpdateData.parsed[0].price &&
    'expo' in priceUpdateData.parsed[0].price
  ) {
    logger.info(priceUpdateData.parsed[0].price);
    let { price, expo } = priceUpdateData.parsed[0].price;
    if (+expo > 0) throw 'Expected expo in pyth data to be negative';
    expo = Math.abs(+expo);
    const power = 8 >= expo ? 8 - expo : expo - 8;
    return +price * 10 ** power;
  } else {
    logger.error('Expected Price Info not found in Pyth Data.');
    throw 'Something went wrong, try again later.';
  }
};
