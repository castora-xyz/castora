import { PoolSeeds } from '../schemas';
import { CONTRACT_ADDRESS_SEPOLIA, getContractAddress } from './contract';
import { /* gMON, */ HYPE, SOL } from './tokens';
import { Chain } from './validate-chain';

const nextNthHour = (current: number, n: number) =>
  current % n == 0 ? current : Math.ceil(current / n) * n;

const next2NthHour = (current: number, n: number) =>
  nextNthHour(current, n) + n;

const prevNthHour = (current: number, n: number) =>
  current % n == 0 ? current - n : Math.floor(current / n) * n;

export const generateExperimentalsSeeds = (chain: Chain) => {
  const now = new Date();
  const yrs = now.getFullYear();
  const months = now.getMonth();
  const date = now.getDate();
  const hrs = new Date().getHours();

  const twenty4HPrev = Math.trunc(
    new Date(yrs, months, date, prevNthHour(hrs, 12), 0, 0).getTime() / 1000
  );
  const close24HPrev = twenty4HPrev - 12 * 60 * 60;

  const twenty4HNext = Math.trunc(
    new Date(yrs, months, date, nextNthHour(hrs, 12), 0, 0).getTime() / 1000
  );
  const close24HNext = twenty4HNext - 12 * 60 * 60;

  const twenty4HNext2 = Math.trunc(
    new Date(yrs, months, date, next2NthHour(hrs, 12), 0, 0).getTime() / 1000
  );
  const close24HNext2 = twenty4HNext2 - 12 * 60 * 60;

  const times = [
    { windowCloseTime: close24HPrev, snapshotTime: twenty4HPrev },
    { windowCloseTime: close24HNext, snapshotTime: twenty4HNext },
    { windowCloseTime: close24HNext2, snapshotTime: twenty4HNext2 }
  ];
  const tokens = [CONTRACT_ADDRESS_SEPOLIA, SOL];

  const seeds: PoolSeeds[] = [];
  for (const { windowCloseTime, snapshotTime } of times) {
    for (const predictionToken of tokens) {
      seeds.push(
        new PoolSeeds({
          predictionToken,
          stakeToken: getContractAddress(chain),
          stakeAmount: 2e18,
          snapshotTime,
          windowCloseTime
        })
      );
    }

    // seeds.push(
    //   new PoolSeeds({
    //     predictionToken: CONTRACT_ADDRESS_SEPOLIA,
    //     stakeToken: gMON,
    //     stakeAmount: 2e17,
    //     snapshotTime,
    //     windowCloseTime
    //   })
    // );
  }
  return seeds;
};

export const generateLiveSeeds = (chain: Chain) => {
  const now = new Date();
  const yrs = now.getFullYear();
  const months = now.getMonth();
  const date = now.getDate();
  const hrs = new Date().getHours();

  // const hourlyPrev = Math.trunc(
  //   new Date(yrs, months, date, hrs, 0, 0).getTime() / 1000
  // );
  // const closeHPrev = hourlyPrev - 15 * 60;
  // const threeHPrev = Math.trunc(
  //   new Date(yrs, months, date, prevNthHour(hrs, 3), 0, 0).getTime() / 1000
  // );
  // const close3HPrev = threeHPrev - 30 * 60;
  const sixHPrev = Math.trunc(
    new Date(yrs, months, date, prevNthHour(hrs, 6), 0, 0).getTime() / 1000
  );
  const close6HPrev = sixHPrev - 60 * 60;
  const twenty4HPrev = Math.trunc(
    new Date(yrs, months, date, prevNthHour(hrs, 12), 0, 0).getTime() / 1000
  );
  const close24HPrev = twenty4HPrev - 12 * 60 * 60;

  // const hourlyNext = Math.trunc(
  //   new Date(yrs, months, date, hrs + 1, 0, 0).getTime() / 1000
  // );
  // const closeHNext = hourlyNext - 15 * 60;
  // const threeHNext = Math.trunc(
  //   new Date(yrs, months, date, nextNthHour(hrs, 3), 0, 0).getTime() / 1000
  // );
  // const close3HNext = threeHNext - 30 * 60;
  const sixHNext = Math.trunc(
    new Date(yrs, months, date, nextNthHour(hrs, 6), 0, 0).getTime() / 1000
  );
  const close6HNext = sixHNext - 60 * 60;
  const twenty4HNext = Math.trunc(
    new Date(yrs, months, date, nextNthHour(hrs, 12), 0, 0).getTime() / 1000
  );
  const close24HNext = twenty4HNext - 12 * 60 * 60;

  // const hourlyNext2 = Math.trunc(
  //   new Date(yrs, months, date, hrs + 2, 0, 0).getTime() / 1000
  // );
  // const closeHNext2 = hourlyNext2 - 15 * 60;
  // const threeHNext2 = Math.trunc(
  //   new Date(yrs, months, date, next2NthHour(hrs, 3), 0, 0).getTime() / 1000
  // );
  // const close3HNext2 = threeHNext2 - 30 * 60;
  const sixHNext2 = Math.trunc(
    new Date(yrs, months, date, next2NthHour(hrs, 6), 0, 0).getTime() / 1000
  );
  const close6HNext2 = sixHNext2 - 60 * 60;
  const twenty4HNext2 = Math.trunc(
    new Date(yrs, months, date, next2NthHour(hrs, 12), 0, 0).getTime() / 1000
  );
  const close24HNext2 = twenty4HNext2 - 12 * 60 * 60;

  const times = [
    // { windowCloseTime: closeHPrev, snapshotTime: hourlyPrev },
    // { windowCloseTime: close3HPrev, snapshotTime: threeHPrev },
    { windowCloseTime: close6HPrev, snapshotTime: sixHPrev },
    { windowCloseTime: close24HPrev, snapshotTime: twenty4HPrev },
    // { windowCloseTime: closeHNext, snapshotTime: hourlyNext },
    // { windowCloseTime: close3HNext, snapshotTime: threeHNext },
    { windowCloseTime: close6HNext, snapshotTime: sixHNext },
    { windowCloseTime: close24HNext, snapshotTime: twenty4HNext },
    // { windowCloseTime: closeHNext2, snapshotTime: hourlyNext2 },
    // { windowCloseTime: close3HNext2, snapshotTime: threeHNext2 },
    { windowCloseTime: close6HNext2, snapshotTime: sixHNext2 },
    { windowCloseTime: close24HNext2, snapshotTime: twenty4HNext2 }
  ];
  const tokens = [HYPE, SOL, CONTRACT_ADDRESS_SEPOLIA];

  const seeds: PoolSeeds[] = [];
  for (const { windowCloseTime, snapshotTime } of times) {
    for (const predictionToken of tokens) {
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
  return seeds;
};
