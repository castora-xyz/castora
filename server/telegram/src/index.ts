import { logger, setWorker } from '@castora/shared';
import { Bot } from 'grammy';
import { completeTelegramAuth } from './complete-telegram-auth';
import { getNotifyWinnerJob } from './get-notify-winner-job';

if (!process.env.TELEGRAM_BOT_TOKEN) throw 'Set TELEGRAM_BOT_TOKEN';
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
bot.command('start', completeTelegramAuth);
bot.start({ timeout: 0 });
logger.info('😎 Telegram bot started and listening for start commands.');

setWorker({ workerName: 'pool-winners-telegram-notifications', handler: getNotifyWinnerJob(bot) });
