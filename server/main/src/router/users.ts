import { Router } from 'express';
import { hasUserTelegram, removeUserTelegram, startTelegramAuth } from '../controllers';
import { validateAuth } from '../middleware';
import { wrapper } from './index';

const router = Router();

router.get('/user/telegram', validateAuth, async (_, res) => {
  await wrapper(async () => await hasUserTelegram(res.locals.userWalletAddress), 'getting user telegram', res);
});

router.delete('/user/telegram', validateAuth, async (_, res) => {
  await wrapper(async () => await removeUserTelegram(res.locals.userWalletAddress), 'removing user telegram', res);
});

router.get('/user/telegram/auth', validateAuth, async (_, res) => {
  await wrapper(async () => await startTelegramAuth(res.locals.userWalletAddress), 'starting telegram auth', res);
});

export default router;
