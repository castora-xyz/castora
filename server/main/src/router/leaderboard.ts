import { Router } from 'express';
import { getLeaderboard, getMyLeaderboard } from '../controllers/leaderboard.js';
import { validateAuth } from '../middleware/validate-auth.js';
import { validateChain } from '../middleware/validate-chain.js';
import { wrapper } from './index.js';

const router = Router();

router.get('/leaderboard/top', validateChain, async (_, res) => {
  await wrapper(async () => await getLeaderboard(res.locals.chain), 'getting mainnet leaderboard', res);
});

router.get('/leaderboard/mine', validateAuth, validateChain, async (_, res) => {
  await wrapper(
    async () => await getMyLeaderboard(res.locals.userWalletAddress, res.locals.chain),
    'getting my mainnet leaderboard',
    res
  );
});

export default router;
