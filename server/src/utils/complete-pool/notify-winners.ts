import { FieldValue } from 'firebase-admin/firestore';
import { firestore, messaging } from '..';
import { Pool } from '../../schemas/pool';

/**
 * Notify winners of the pool
 *
 * @param string[] winnerAddresses The addresses of the winners
 * @param Pool pool The pool in which to notify the winners
 */
export const notifyWinners = async (
  winnerAddresses: string[],
  pool: Pool
): Promise<void> => {
  console.log('\nNotifying Winners ... ');

  const { poolId, winAmount, seeds } = pool;

  const notif = (won: number) => ({
    title: `You just won ${seeds.formatWinAmount(won)} in Pool ${poolId}!`,
    body: 'Click to Claim your Winnings now!'
  });
  const webpush = {
    fcmOptions: {
      link: `https://castora.xyz/pool/${poolId}`
    }
  };

  const uniqued: { [key: string]: number } = {};
  for (const address of winnerAddresses) {
    // the division by 0.95 below is to display the amount without fees applied
    uniqued[address] = (uniqued[address] ?? 0) + winAmount / 0.95;
  }

  const notifStats = {
    total: Object.keys(uniqued).length,
    success: 0,
    failed: 0
  };

  for (const winner of Object.keys(uniqued)) {
    // using the default Firestore here as that's where fcmTokens are stored
    const winnerRef = firestore().doc(`/users/${winner}`);
    const winnerSnap = await winnerRef.get();

    if (winnerSnap.exists) {
      const staleTokens = [];
      const { fcmTokens } = winnerSnap.data()!;
      if (fcmTokens && fcmTokens.length > 0) {
        for (const token of fcmTokens) {
          try {
            await messaging.send({
              data: { poolId: poolId.toString() },
              token,
              notification: notif(uniqued[winner]),
              webpush
            });
          } catch (e) {
            staleTokens.push(token);
          }
        }
        notifStats.success++;
      }
      if (staleTokens.length > 0) {
        await winnerRef.update({
          fcmTokens: FieldValue.arrayRemove(...staleTokens)
        });
        if (staleTokens.length == fcmTokens.length) notifStats.failed++;
      }
    } else {
      notifStats.failed++;
    }
  }
  console.log('Notified Winners.');
  console.dir('Notification Statistics: ', notifStats);
};
