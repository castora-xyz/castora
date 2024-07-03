import 'dotenv/config';
import fetch from 'node-fetch';

import { Pool } from '../../models';
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

  console.log(
    `Obtained Pyth ID for predictionToken (${predictionToken}) : `,
    pythPriceId
  );

  console.log(
    `\nObtaining Price Update Data from Pyth for pool.poolSeeds.snapshotTime:` +
      ` ${snapshotTime}`
  );
  const priceUpdateData = (await (
    await fetch(
      `https://benchmarks.pyth.network/v1/updates/price/${snapshotTime}?ids=${pythPriceId}&parsed=true`
    )
  ).json()) as any;
  console.log('Obtained Price Update Data: ', priceUpdateData);

  if (
    'parsed' in priceUpdateData &&
    Array.isArray(priceUpdateData.parsed) &&
    priceUpdateData.parsed.length > 0 &&
    'price' in priceUpdateData.parsed[0].price &&
    'expo' in priceUpdateData.parsed[0].price
  ) {
    console.log(priceUpdateData.parsed[0].price);
    let { price, expo } = priceUpdateData.parsed[0].price;
    if (+expo > 0) throw 'Expected expo in pyth data to be negative';
    expo = Math.abs(+expo);
    const power = 8 >= expo ? 8 - expo : expo - 8;
    return +price * 10 ** power;
  } else {
    throw 'Expected data not found in priceUpdateData';
  }
};
