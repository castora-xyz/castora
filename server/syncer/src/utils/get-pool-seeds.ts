import { Chain } from '.';
import { PoolSeeds } from '../schemas';
import { CONTRACT_ADDRESS_SEPOLIA, getContractAddress } from './contract';
import { AAPL, aprMON, CRCL, gMON, HYPE, PUMP, SOL, TSLA } from './tokens';

interface PoolTimes {
  windowCloseTime: number;
  snapshotTime: number;
}

/**
 * Generates and returns the windowClose and snapshot times as UTC seconds timestamps
 * for the previous, current, and next "hour duration"s (6h or 24h).
 *
 * @param {number} [dxHrs] - The duration in hours for each pool.
 * @param {number} [waitHrs] - The number of hours to wait between windowClose and snapshot.
 * @return {Array} An array of objects containing the windowCloseTime and snapshotTime
 * for each of the three periods.
 */
const getCryptoTimes = (dxHrs: number, waitHrs: number): PoolTimes[] => {
  const now = new Date();
  const utcNow = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours()
  );
  const dxSecs = dxHrs * 3600;

  const start = Math.floor(utcNow / 1000 / dxSecs) * dxSecs;
  const prev = start;
  const current = start + dxSecs;
  const next = start + dxSecs * 2;

  return [
    { windowCloseTime: next - waitHrs * 3600, snapshotTime: next },
    { windowCloseTime: current - waitHrs * 3600, snapshotTime: current },
    { windowCloseTime: prev - waitHrs * 3600, snapshotTime: prev }
  ];
};

export const getCryptoSeeds = (chain: Chain) => {
  const sixHTimes = getCryptoTimes(6, 1);
  const twenty4HTimes = getCryptoTimes(12, 12);
  const seeds: PoolSeeds[] = [];

  for (const { windowCloseTime, snapshotTime } of twenty4HTimes) {
    for (const predictionToken of [CONTRACT_ADDRESS_SEPOLIA, SOL, PUMP, HYPE]) {
      seeds.push(
        new PoolSeeds({
          predictionToken,
          stakeToken: getContractAddress(chain),
          stakeAmount: 2e17,
          snapshotTime,
          windowCloseTime
        })
      );
    }
  }

  for (const { windowCloseTime, snapshotTime } of sixHTimes) {
    for (const predictionToken of [CONTRACT_ADDRESS_SEPOLIA, SOL, HYPE]) {
      seeds.push(
        new PoolSeeds({
          predictionToken,
          stakeToken: getContractAddress(chain),
          stakeAmount: 2e17,
          snapshotTime,
          windowCloseTime
        })
      );
    }
  }

  for (const { windowCloseTime, snapshotTime } of twenty4HTimes) {
    seeds.push(
      new PoolSeeds({
        predictionToken: CONTRACT_ADDRESS_SEPOLIA,
        stakeToken: aprMON,
        stakeAmount: 2e17,
        snapshotTime,
        windowCloseTime
      })
    );

    seeds.push(
      new PoolSeeds({
        predictionToken: CONTRACT_ADDRESS_SEPOLIA,
        stakeToken: gMON,
        stakeAmount: 2e17,
        snapshotTime,
        windowCloseTime
      })
    );
  }

  return seeds;
};

/**
 * Generates and returns the windowClose and snapshot times as UTC seconds timestamps
 * for the previous, current, and next "hour duration"s (6h or 24h) with context of
 * Stock Markets.
 *
 * There are 2 difference between this and {@link getCryptoTimes}:
 * 1. Stock markets are not naturally active in weekends. So the generated times, if
 *    including weekends, will be a pool whose snapshot is on the next Monday. That is
 *    the weekend days are joined to one long pool.
 * 2. Stock markets open and close at different times of the day. So the generated times,
 *    don't go round the clock as crypto markets.
 *
 * @return {Array} An array of objects containing the windowCloseTime and snapshotTime
 * for each of the three periods.
 */
const getStocksTimes = (): PoolTimes[] => {
  // Get preparatory values
  const now = new Date();
  const yrs = now.getUTCFullYear();
  const months = now.getUTCMonth();
  const date = now.getUTCDate();
  const day = now.getUTCDay();
  const hrs = now.getUTCHours();

  // Number of days to add to dates for weekend adjustment
  let toAdd = 0;

  type Context = 'prev' | 'current' | 'next';
  // Get Date with context ('prev', 'current', & 'next') and weekend factored in.
  const dt = (context: Context) => {
    // 'prev', 'current', or 'next' context for -1, 0, or +1 day step
    let step = context === 'prev' ? -1 : context === 'next' ? 1 : 0;

    // If current hour is after 2 PM, we move forward, that is,
    // we consider the current day as the next day.
    if (hrs >= 14) step += 1;

    // If we've not yet added "weekend days", check if we need to.
    if (toAdd == 0) {
      // If target is Saturday and was computed from a Sunday,
      // Or target is Sunday and was computed from a Monday, we go back to Friday,
      // that's the previous open market. This results only happen when step is -1
      // that is we actually for the previous period and it is we are at the week start.
      // But we don't want to update toAdd here, so we return.
      if (day + step == -1) return date - 2; // Sunday back to Friday
      if (step == -1 && day + step == 0) return date - 3; // Monday back to Friday

      // If target day is Saturday, add 2 days (till Monday)
      if (day + step == 6) toAdd = 2;

      // If target day is Sunday, add 1 day (till Monday)
      if (day + step == 7 || day + step == 0) toAdd = 1;
    }
    // Return the date (not day) to be applied
    return date + step + toAdd;
  };

  // Get the snapshot time using 8 PM UTC as reference while factoring in the weekend above
  const prev = Math.trunc(Date.UTC(yrs, months, dt('prev'), 20) / 1000);
  const current = Math.trunc(Date.UTC(yrs, months, dt('current'), 20) / 1000);
  const next = Math.trunc(Date.UTC(yrs, months, dt('next'), 20) / 1000);

  // waitHrs is 6 for now (21600 = 6 * 3600 seconds)
  return [
    { windowCloseTime: next - 21600, snapshotTime: next },
    { windowCloseTime: current - 21600, snapshotTime: current },
    { windowCloseTime: prev - 21600, snapshotTime: prev }
  ];
};

export const getStocksSeeds = (chain: Chain) => {
  const seeds: PoolSeeds[] = [];
  for (const { windowCloseTime, snapshotTime } of getStocksTimes()) {
    for (const predictionToken of [AAPL, TSLA, CRCL]) {
      seeds.push(
        new PoolSeeds({
          predictionToken,
          stakeToken: getContractAddress(chain),
          stakeAmount: 5e17,
          snapshotTime,
          windowCloseTime
        })
      );
    }
  }
  return seeds;
};
