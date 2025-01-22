import { PoolSeeds } from '../schemas';
import { getContractAddress } from './contract';
import { USDC } from './tokens';
import { Chain } from './validate-chain';

const nextNthHour = (current: number, n: number) =>
  current % n == 0 ? current + n : Math.ceil(current / n) * n;

const next2NthHour = (current: number, n: number) =>
  current % n == 0 ? current + 2 * n : Math.ceil(current / n) * 2 * n;

const prevNthHour = (current: number, n: number) =>
  current % n == 0 ? current - n : Math.floor(current / n) * n;

export const generateSeeds = (chain: Chain) => {
  const now = new Date();
  const yrs = now.getFullYear();
  const months = now.getMonth();
  const date = now.getDate();
  const hrs = new Date().getHours();

  const hourlyPrev = Math.trunc(
    new Date(yrs, months, date, hrs, 0, 0).getTime() / 1000
  );
  const closeHPrev = hourlyPrev - 15 * 60;
  const threeHPrev = Math.trunc(
    new Date(yrs, months, date, prevNthHour(hrs, 3), 0, 0).getTime() / 1000
  );
  const close3HPrev = threeHPrev - 30 * 60;
  const sixHPrev = Math.trunc(
    new Date(yrs, months, date, prevNthHour(hrs, 6), 0, 0).getTime() / 1000
  );
  const close6HPrev = sixHPrev - 60 * 60;

  const hourlyNext = Math.trunc(
    new Date(yrs, months, date, hrs + 1, 0, 0).getTime() / 1000
  );
  const closeHNext = hourlyNext - 15 * 60;
  const threeHNext = Math.trunc(
    new Date(yrs, months, date, nextNthHour(hrs, 3), 0, 0).getTime() / 1000
  );
  const close3HNext = threeHNext - 30 * 60;
  const sixHNext = Math.trunc(
    new Date(yrs, months, date, nextNthHour(hrs, 6), 0, 0).getTime() / 1000
  );
  const close6HNext = sixHNext - 60 * 60;

  const hourlyNext2 = Math.trunc(
    new Date(yrs, months, date, hrs + 2, 0, 0).getTime() / 1000
  );
  const closeHNext2 = hourlyNext2 - 15 * 60;
  const threeHNext2 = Math.trunc(
    new Date(yrs, months, date, next2NthHour(hrs, 3), 0, 0).getTime() / 1000
  );
  const close3HNext2 = threeHNext2 - 30 * 60;
  const sixHNext2 = Math.trunc(
    new Date(yrs, months, date, next2NthHour(hrs, 6), 0, 0).getTime() / 1000
  );
  const close6HNext2 = sixHNext2 - 60 * 60;

  return [
    { windowCloseTime: closeHPrev, snapshotTime: hourlyPrev },
    { windowCloseTime: close3HPrev, snapshotTime: threeHPrev },
    { windowCloseTime: close6HPrev, snapshotTime: sixHPrev },
    { windowCloseTime: closeHNext, snapshotTime: hourlyNext },
    { windowCloseTime: close3HNext, snapshotTime: threeHNext },
    { windowCloseTime: close6HNext, snapshotTime: sixHNext },
    { windowCloseTime: closeHNext2, snapshotTime: hourlyNext2 },
    { windowCloseTime: close3HNext2, snapshotTime: threeHNext2 },
    { windowCloseTime: close6HNext2, snapshotTime: sixHNext2 }
  ].map(
    ({ windowCloseTime, snapshotTime }) =>
      new PoolSeeds({
        // using contract address as native token representative
        predictionToken: getContractAddress(chain),
        stakeToken: USDC,
        stakeAmount: 10000000,
        snapshotTime,
        windowCloseTime
      })
  );
};
