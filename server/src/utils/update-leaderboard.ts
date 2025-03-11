import { Chain, fetchPool, readContract, storage } from '.';
import {
  CompletedPoolLeaderboardInfo,
  getNewLeaderboardEntry,
  LeaderboardEntry,
  UserActivity
} from '../schemas';

const getDateString = (date: Date) => {
  const [, month, day, year] = date.toDateString().split(' ');
  return `${day}-${month}-${year}`;
};

const sortLeaderboard = (
  token: string,
  a: LeaderboardEntry,
  b: LeaderboardEntry
): number => {
  // TODO: Use totalStakedUsd for sorting when USD value is added

  // Currently sorting based on currently used staked token. Change this soon
  const { amount: aStkdAmt } = a.stakedAmounts.find(
    ({ token: tk }) => tk == token
  ) ?? { token, amount: 0 };
  const { amount: bStkdAmt } = b.stakedAmounts.find(
    ({ token: tk }) => tk == token
  ) ?? { token, amount: 0 };
  if (bStkdAmt != aStkdAmt) return bStkdAmt - aStkdAmt;

  // TODO: Use totalWonUsd for sorting when USD value is added

  // Currently sorting based on currently used won token. Change this soon
  const { amount: aWonAmt } = a.wonAmounts.find(
    ({ token: tk }) => tk == token
  ) ?? { token, amount: 0 };
  const { amount: bWonAmt } = b.wonAmounts.find(
    ({ token: tk }) => tk == token
  ) ?? { token, amount: 0 };
  if (bWonAmt != aWonAmt) return bWonAmt - aWonAmt;

  // If stakes are equal, rank based on number of predictions
  if (a.predictionsCount != b.predictionsCount) {
    return b.predictionsCount - a.predictionsCount;
  }

  // If predictions are equal, compare using number of joined pools
  if (b.poolsCount != a.poolsCount) return b.poolsCount - a.poolsCount;

  // Rank alphabetically based on address
  return b.address.localeCompare(a.address);
};

/**
 * Updates the leaderboard with the incoming user prediction activity
 *
 * @param chain The chain on which to update its leaderboard
 * @param address The wallet address of the user that owns the incoming activity
 * @param activity The UserActivity record to take into account for
 */
export const updateLeaderboardOnPrediction = async (
  chain: Chain,
  address: string,
  activity: UserActivity
): Promise<void> => {
  console.log('Beginning Leaderboard Update On Prediction ...');
  // 1. Fetch the pool for the poolId.
  const pool = await fetchPool(chain, activity.poolId);
  console.log(`Fetched Pool with ID: ${activity.poolId}`);

  // 2. Construct the predicted token and amount as stake data from seeds
  const { decimals, name: token } = pool.seeds.getStakeTokenDetails();
  let amount = pool.seeds.stakeAmount / 10 ** decimals;
  amount = Math.trunc(amount * 100) / 100; // round to 2 decimal places
  console.log(`Got predicted token and amount: ${token}, ${amount}`);

  // 3. Fetch the leaderboard data
  const ldbFileRef = storage
    .bucket()
    .file(`leaderboards/${getDateString(activity.timestamp.toDate())}.json`);

  let entries: LeaderboardEntry[] = [];
  const [exists] = await ldbFileRef.exists();
  if (!exists) {
    console.log('No Leaderboard Found. Created One');
  } else {
    entries = JSON.parse((await ldbFileRef.download())[0].toString()).entries;
    console.log('Fetched Leaderboard Successfully');
  }

  // 4. Update the involved user
  console.log('Updating User Details ...');
  address = address.toLowerCase(); // ensure easy comparison
  let entry = entries.find((e) => e.address === address);
  if (!entry) {
    entry = getNewLeaderboardEntry(address);
    entries.push(entry);
  }
  console.log(
    entry.predictionsCount == 0
      ? 'Is First Time User. Created new entry'
      : 'Is Existing User. Found their entry'
  );

  entry.predictionsCount += 1; // increment predictionsCount
  console.log(`Incremented Predictions Count to: ${entry.predictionsCount}`);

  const stakedIndex = entry.stakedAmounts.findIndex(
    ({ token: stakedToken }) => stakedToken == token
  ); // Update stake amount
  if (stakedIndex == -1) entry.stakedAmounts.push({ token, amount });
  else entry.stakedAmounts[stakedIndex].amount += amount;
  console.log(
    stakedIndex == -1
      ? 'Pushed new staked token and amount into user entry'
      : 'Updated existing token for new prediction amount'
  );

  // Update poolsCount
  const noOfJoinedPools = await readContract(
    chain,
    'noOfJoinedPoolsByAddresses',
    [address]
  );
  if (!noOfJoinedPools) throw "Couldn't fetch noOfJoinedPools";
  entry.poolsCount = Number(noOfJoinedPools);
  console.log(`Updated User's Pool's Count: ${entry.poolsCount}`);

  // TODO: also increment totalStakedUsd

  // 5. Re-rank leaderboard entries
  entries = entries.sort((a, b) => sortLeaderboard(address, a, b));
  console.log('Sorted Leaderboard Successfully');

  // 6. Save updated leaderboard
  await ldbFileRef.save(JSON.stringify({ entries, count: entries.length }));
  console.log('Saved Updated Leaderboard Successfully');
  console.log('Completed Leaderboard Update On Prediction');
};

/**
 * Updates the leaderboard for losses or winnings in bulk
 *
 * @param chain The chain on which to update its leaderboard
 * @param info Data necessary for the bulk update
 */
export const updateLeaderboardOnCompletePool = async (
  chain: Chain,
  info: CompletedPoolLeaderboardInfo
): Promise<void> => {
  // 1. Fetch the leaderboard data
  const ldbFileRef = storage
    .bucket()
    .file(
      `leaderboards/${getDateString(
        new Date(info.pool.seeds.snapshotTime * 1000)
      )}.json`
    );

  let entries: LeaderboardEntry[] = [];
  const [exists] = await ldbFileRef.exists();
  if (!exists) {
    console.log('No Leaderboard Found. Created One');
  } else {
    entries = JSON.parse((await ldbFileRef.download())[0].toString()).entries;
    console.log('Fetched Leaderboard Successfully');
  }

  // 2. Destructure info and construct needed values
  const { pool, predictions, splitted } = info;
  const { loserPredictionIds: losers, winnerPredictionIds: winners } = splitted;
  const { name: token, decimals } = pool.seeds.getStakeTokenDetails();
  // the amount lost is the stake amount that didn't win anything
  let lost = pool.seeds.stakeAmount / 10 ** decimals;
  lost = Math.trunc(lost * 100) / 100; // round to 2 decimal
  // the division below by 0.95 (after applying decimals) is to display the
  // amount without fees applied
  let won = pool.winAmount / 10 ** decimals / 0.95;
  won = Math.trunc(won * 100) / 100; // round to 2 decimal
  console.log(`Got token and won and lost amounts: ${token}, ${won}, ${lost}`);

  // 3. loop through winners and increment wins
  console.log('Looping through Winners and updating');
  for (let id of winners) {
    // certain that a matching prediction will be found as predictions were
    // originally splitted to obtain winners and losers
    let { predicter } = predictions.find(({ id: pId }) => pId == Number(id))!;

    // Update the involved user
    predicter = predicter.toLowerCase(); // ensure easy comparison
    let entry = entries.find((e) => e.address === predicter);
    if (!entry) {
      entry = getNewLeaderboardEntry(predicter);
      entries.push(entry);
    }
    entry.winningsCount += 1; // increment winningsCount
    const index = entry.wonAmounts.findIndex(
      ({ token: wonToken }) => wonToken == token
    ); // Update won amount
    if (index == -1) entry.wonAmounts.push({ token, amount: won });
    else entry.wonAmounts[index].amount += won;
  }
  console.log('Looped through and updated all Winners');

  // 4. Loop through losers and increment losses
  for (let id of losers) {
    // certain that a matching prediction will be found as predictions were
    // originally splitted to obtain losers and losers
    let { predicter } = predictions.find(({ id: pId }) => pId == Number(id))!;

    // Update the involved user
    predicter = predicter.toLowerCase(); // ensure easy comparison
    let entry = entries.find((e) => e.address === predicter);
    if (!entry) {
      entry = getNewLeaderboardEntry(predicter);
      entries.push(entry);
    }
    entry.lostCount += 1; // increment lostCount
    const index = entry.lostAmounts.findIndex(
      ({ token: lostToken }) => lostToken == token
    ); // Update lost amount
    if (index == -1) entry.lostAmounts.push({ token, amount: lost });
    else entry.lostAmounts[index].amount += lost;
  }
  console.log('Looped through and updated all Losers');

  // 5. Re-rank leaderboard entries
  entries = entries.sort((a, b) => sortLeaderboard(token, a, b));
  console.log('Sorted Leaderboard Successfully');

  // 6. Save updated leaderboard
  await ldbFileRef.save(JSON.stringify({ entries, count: entries.length }));
  console.log('Saved Updated Leaderboard Successfully');
  console.log('Completed Leaderboard Update On Prediction');
};
