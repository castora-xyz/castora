import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { createPublicClient, parseEventLogs, TransactionReceipt } from 'viem';
import { ActivityType, PoolActivity, UserActivity } from '../../schemas';
import { abi, Chain, firestore, getConfig } from '../../utils';
import { updateLeaderboardOnPrediction } from '../../utils/update-leaderboard';

/**
 * Looks up the chain for the activity of the provided transaction hash.
 *
 * @param txHash The transaction hash of the activity to be recorded.
 * @param chain The chain to look up the activity on.
 */
export const recordActivity = async (
  chain: Chain,
  txHash: string
): Promise<any> => {
  console.log('Got Record Activity ... ');
  console.log('txHash: ', txHash);

  const publicClient = createPublicClient({ ...getConfig(chain) });
  let receipt: TransactionReceipt;
  try {
    const raw = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`
    });
    if (raw) receipt = raw;
    else throw 'Transaction not found';
  } catch (e) {
    throw 'Invalid txHash';
  }

  const events = parseEventLogs({
    abi,
    logs: receipt.logs,
    eventName: ['Predicted', 'ClaimedWinnings']
  });

  if (events.length === 0) throw 'Invalid txHash';
  const { args, eventName, blockNumber } = events[0];
  const block = await publicClient.getBlock({ blockNumber });
  const timestamp = Timestamp.fromMillis(Number(block.timestamp) * 1000);

  let type: ActivityType;
  if (eventName == 'Predicted') type = 'predict';
  else if (eventName == 'ClaimedWinnings') type = 'claim';
  else throw 'Invalid txHash';

  const { poolId, predictionId } = args;
  const user = eventName == 'Predicted' ? args.predicter : args.winner;

  console.log('Parsed Activity ... ');
  console.log({ poolId, type, user, predictionId, timestamp: block.timestamp });

  const db = firestore(chain);

  let isPoolActivityRecorded = false;
  const poolRef = db.doc(`/pools/${poolId}`);
  const poolSnap = await poolRef.get();
  if (poolSnap.exists) {
    const { activities } = poolSnap.data()!;
    isPoolActivityRecorded =
      activities && activities.some((a: any) => a.txHash == txHash);
  }

  let isUserActivityRecorded = false;
  const userRef = db.doc(`/users/${user}`);
  const userSnap = await userRef.get();
  if (userSnap.exists) {
    const { activities } = userSnap.data()!;
    isUserActivityRecorded =
      activities && activities.some((a: any) => a.txHash == txHash);
  }

  if (isPoolActivityRecorded) console.log('Pool Activity Already Recorded.');
  if (!isPoolActivityRecorded) {
    const activity: PoolActivity = { type, user, predictionId, timestamp, txHash };
    await poolRef.set(
      { poolId, activities: FieldValue.arrayUnion(activity) },
      { merge: true }
    );
    console.log('Pool Activity Saved Successfully.');
  }

  if (isUserActivityRecorded) console.log('User Activity Already Recorded.');
  if (!isUserActivityRecorded) {
    const activity: UserActivity = { type, poolId, predictionId, timestamp, txHash };
    await userRef.set(
      { address: user, activities: FieldValue.arrayUnion(activity) },
      { merge: true }
    );
    console.log('User Activity Saved Successfully.');

    if (activity.type == 'predict') {
      await updateLeaderboardOnPrediction(chain, user, activity);
    }
  }
};
