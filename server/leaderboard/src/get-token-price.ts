import { logger, tokens } from '@castora/shared';
import fetch from 'node-fetch';

/**
 * Obtains and returns the price of the provided tokenSymbol at the provided snapshotTime from Pyth.
 *
 * @param tokenSymbol The symbol of the token to get the price for.
 * @returns The obtained token price
 */
export const getTokenPrice = async (tokenSymbol: string, snapshotTime: number): Promise<number> => {
  const found = tokens.find((t) => t.name.toLowerCase() === tokenSymbol.toLowerCase());
  if (!found) throw `Token not found in tokens.ts: ${tokenSymbol}`;
  const { pythPriceId } = found;

  logger.info(`Obtained Pyth ID for token (${tokenSymbol}): ${pythPriceId}`);
  logger.info(`\nObtaining Price Update Data from Pyth for snapshotTime:` + ` ${snapshotTime}`);

  let pythResponse;
  let pythResponseCloned; // for logging if response wasn't not JSON
  let priceUpdateData;

  try {
    pythResponse = await fetch(
      `https://benchmarks.pyth.network/v1/updates/price/${snapshotTime}?ids=${pythPriceId}&parsed=true`
    );
    pythResponseCloned = pythResponse.clone();
  } catch (e) {
    throw `Couldn't FETCH Price Info for token ${tokenSymbol} snapshotTime ${snapshotTime}, error: ${e}`;
  }

  try {
    priceUpdateData = (await pythResponse.json()) as any;
  } catch (e) {
    throw (
      "Couldn't PARSE Price Info from Pyth. " +
      ` token: ${tokenSymbol} snapshotTime ${snapshotTime} ` +
      `Pyth Response: ${await pythResponseCloned.text()}`
    );
  }

  logger.info(priceUpdateData, 'Obtained Price Update Data');

  if (
    'parsed' in priceUpdateData &&
    Array.isArray(priceUpdateData.parsed) &&
    priceUpdateData.parsed.length > 0 &&
    'price' in priceUpdateData.parsed[0].price &&
    'expo' in priceUpdateData.parsed[0].price
  ) {
    logger.info(priceUpdateData.parsed[0].price);
    let { price, expo } = priceUpdateData.parsed[0].price;
    if (+expo > 0) {
      throw `Expected **expo** in pyth data to be negative for token: ${tokenSymbol} snapshotTime ${snapshotTime}`;
    }
    return +price * 10 ** expo;
  } else {
    if (typeof priceUpdateData === 'object') priceUpdateData = JSON.stringify(priceUpdateData);
    throw `Expected Price Info not found in Pyth Data for token: ${tokenSymbol} snapshotTime ${snapshotTime}. Pyth Data: ${priceUpdateData}`;
  }
};
