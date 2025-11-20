import { Router } from 'express';
import { validateAuth } from '../middleware/validate-auth.js';
import { wrapper } from './index.js';
import { getMyTestnetLeaderboard, getTestnetLeaderboard } from '../controllers/leaderboard.js';

const router = Router();

router.get('/leaderboard/testnet/top', async (_, res) => {
  await wrapper(async () => await getTestnetLeaderboard(), 'getting leaderboard', res);
});

router.get('/leaderboard/testnet/mine', validateAuth, async (_, res) => {
  await wrapper(async () => await getMyTestnetLeaderboard(res.locals.userWalletAddress), 'getting my leaderboard', res);
});

export default router;
