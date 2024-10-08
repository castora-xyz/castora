import { FieldValue } from 'firebase-admin/firestore';
import { parseEventLogs, TransactionReceipt } from 'viem';
import { abi, firestore, publicClient } from '../../utils';

/**
 * Looks up the chain for the activity of the provided transaction hash.
 *
 * @param txHash The transaction hash of the activity to be recorded.
 */
export const recordActivity = async (txHash: string): Promise<any> => {
  console.log('Got Record Activity ... ');
  console.log('txHash: ', txHash);

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
  const { args, eventName } = events[0];

  let type: string;
  if (eventName == 'Predicted') type = 'predict';
  else if (eventName == 'ClaimedWinnings') type = 'claim';
  else throw 'Invalid txHash';

  const { poolId, predictionId } = args;
  const user = eventName == 'Predicted' ? args.predicter : args.winner;

  console.log('Parsed Activity ... ');
  console.log({ poolId, type, user, predictionId });

  let isPoolActivityRecorded = false;
  const poolRef = firestore.doc(`/pools/${poolId}`);
  const poolSnap = await poolRef.get();
  if (poolSnap.exists) {
    const { activities } = poolSnap.data()!;
    isPoolActivityRecorded =
      activities && activities.some((a: any) => a.txHash == txHash);
  }

  let isUserActivityRecorded = false;
  const userRef = firestore.doc(`/users/${user}`);
  const userSnap = await userRef.get();
  if (userSnap.exists) {
    const { activities } = userSnap.data()!;
    isUserActivityRecorded =
      activities && activities.some((a: any) => a.txHash == txHash);
  }

  if (isPoolActivityRecorded) console.log('Pool Activity Already Recorded.');
  if (!isPoolActivityRecorded) {
    await firestore.doc(`/pools/${poolId}`).set(
      {
        poolId,
        activities: FieldValue.arrayUnion({ type, user, predictionId, txHash })
      },
      { merge: true }
    );
    console.log('Pool Activity Saved Successfully.');
  }

  if (isUserActivityRecorded) console.log('User Activity Already Recorded.');
  if (!isUserActivityRecorded) {
    await firestore.doc(`/users/${user}`).set(
      {
        address: user,
        activities: FieldValue.arrayUnion({
          type,
          poolId,
          predictionId,
          txHash
        })
      },
      { merge: true }
    );
    console.log('User Activity Saved Successfully.');
  }
};
