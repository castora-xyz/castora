import { Router } from 'express';
import {
  getMainnetLeaderboard,
  getMyMainnetLeaderboard,
  getMyTestnetLeaderboard,
  getTestnetLeaderboard
} from '../controllers/leaderboard.js';
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

router.get('/leaderboard/testnet/top', async (_, res) => {
  await wrapper(async () => await getTestnetLeaderboard(), 'getting testnet leaderboard', res);
});

router.get('/leaderboard/testnet/mine', validateAuth, async (_, res) => {
  await wrapper(
    async () => await getMyTestnetLeaderboard(res.locals.userWalletAddress),
    'getting my testnet leaderboard',
    res
  );
});

export default router;
