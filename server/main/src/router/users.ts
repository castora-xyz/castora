import { Router } from 'express';
import { hasUserTelegram, registerUser, removeUserTelegram, setUserTelegram } from '../controllers';
import { validateAuth } from '../middleware';
import { wrapper } from './index';

const router = Router();

router.post('/user/register', async (req, res) => {
  await wrapper(async () => await registerUser(req.headers, req.body), 'registering user', res);
});

router.post('/user/telegram', validateAuth, async (req, res) => {
  await wrapper(
    async () => await setUserTelegram(res.locals.userWalletAddress, req.body),
    'setting user telegram',
    res
  );
});

router.get('/user/telegram', validateAuth, async (req, res) => {
  await wrapper(
    async () => await hasUserTelegram(res.locals.userWalletAddress),
    'getting user telegram',
    res
  );
});

router.delete('/user/telegram', validateAuth, async (_, res) => {
  await wrapper(
    async () => await removeUserTelegram(res.locals.userWalletAddress),
    'removing user telegram',
    res
  );
});

export default router;
