import { Router } from 'express';
import { getMainnetLeaderboard, getMyMainnetLeaderboard } from '../controllers/leaderboard.js';
import { validateAuth } from '../middleware/validate-auth.js';
import { wrapper } from './index.js';

const router = Router();

router.get('/leaderboard/mainnet/top', async (_, res) => {
  await wrapper(async () => await getMainnetLeaderboard(), 'getting mainnet leaderboard', res);
});

router.get('/leaderboard/mainnet/mine', validateAuth, async (_, res) => {
  await wrapper(
    async () => await getMyMainnetLeaderboard(res.locals.userWalletAddress),
    'getting my mainnet leaderboard',
    res
  );
});

export default router;
