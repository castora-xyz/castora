import { FieldValue, Timestamp, firestore, logger } from '@castora/shared';
import { CommandContext, Context } from 'grammy';

export const completeTelegramAuth = async (ctx: CommandContext<Context>) => {
  // Check if the message contains a valid auth token
  if (!ctx.message) return ctx.reply('⚠️ Error. Please restart linking.');

  const token = ctx.message.text.split(' ')[1];
  if (!token) return ctx.reply('⚠️ Error. Please restart linking.');

  // Verify the token against the user's wallet address. If the token is valid,
  // it will be found in the user's document.
  let pendingsSnap = await firestore.collection('users').where('pendingTelegramAuthToken', '==', token).get();
  if (pendingsSnap.empty) {
    pendingsSnap = await firestore.collection('users').where('telegram.pendingAuthToken', '==', token).get();
    if (pendingsSnap.empty) return ctx.reply('⚠️ Error. Please restart linking.');
  }

  const userSnap = pendingsSnap.docs[0];
  let {
    address: userWalletAddress,
    pendingTelegramAuthTime,
    telegram
  } = userSnap.data() as {
    address: string;
    pendingTelegramAuthTime: Timestamp;
    telegram: {
      firstAuthTime?: Timestamp;
      pendingAuthToken: string;
      pendingAuthTime: Timestamp;
    };
  };

  pendingTelegramAuthTime = pendingTelegramAuthTime || telegram?.pendingAuthTime;
  if (!userWalletAddress || !pendingTelegramAuthTime) {
    logger.error(`FATAL: Invalid user data in pending auth token: ${userSnap.id}`);
    return ctx.reply('⁉️ Invalid user data. Please try again.');
  }

  // Check that the token is not older than 10 minutes otherwise return.
  // No need of removing the token here, as it will be removed after a successful re-auth.
  const now = Math.floor(Date.now() / 1000);
  if (now - pendingTelegramAuthTime.seconds > 600) {
    return ctx.reply('⚠️ Authentication expired. Please restart linking.');
  }

  // Save the Telegram ID to the user's document and remove the pending auth details
  await userSnap.ref.set(
    {
      telegramId: FieldValue.delete(),
      telegramAuthTime: FieldValue.delete(),
      pendingTelegramAuthToken: FieldValue.delete(),
      pendingTelegramAuthTime: FieldValue.delete(),
      telegram: {
        id: ctx.from.id,
        ...(!telegram?.firstAuthTime && { firstAuthTime: FieldValue.serverTimestamp() }),
        lastAuthTime: FieldValue.serverTimestamp(),
        pendingAuthToken: FieldValue.delete(),
        pendingAuthTime: FieldValue.delete()
      }
    },
    { merge: true }
  );

  // Globally increment telegram auth counts
  await firestore.doc('/counts/counts').set(
    {
      telegram: {
        auth: FieldValue.increment(1),
        lastAuthTime: FieldValue.serverTimestamp(),
        ...(!telegram?.firstAuthTime && { uniqueAuth: FieldValue.increment(1) })
      }
    },
    { merge: true }
  );

  logger.info(`🎉 User ${userWalletAddress} linked Telegram ID ${ctx.from.id}`);

  return ctx.reply(
    `✅ You have successfully linked your Telegram account with address ${userWalletAddress}.` +
      `\n\nYou will now receive notifications for your pool winnings here!`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: 'Predict Now!', url: `https://castora.xyz` }]]
      }
    }
  );
};
