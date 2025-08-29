import { Router } from 'express';
import { removeUserTelegram, signInWithFirebase, startTelegramAuth } from '../controllers/auth';
import { validateAuth } from '../middleware';
import { wrapper } from './index';

const router = Router();

router.get('/auth/firebase', validateAuth, async (_, res) => {
  await wrapper(async () => await signInWithFirebase(res.locals.userWalletAddress), 'signing in with firebase', res);
});

router.delete('/auth/telegram', validateAuth, async (_, res) => {
  await wrapper(async () => await removeUserTelegram(res.locals.userWalletAddress), 'removing user telegram', res);
});

router.get('/auth/telegram', validateAuth, async (_, res) => {
  await wrapper(async () => await startTelegramAuth(res.locals.userWalletAddress), 'starting telegram auth', res);
});

export default router;
