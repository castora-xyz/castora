import { Router } from 'express';
import {
  completePool,
  completePools,
  fetchActivity,
  getLivePools,
  syncLivePools
} from '../controllers';
import { wrapper } from './index';

const router = Router();

router.get('/pools/complete', async (_, res) => {
  await wrapper(async () => await completePools(), 'completing pools', res);
});

router.get('/pools/live', async (req, res) => {
  await wrapper(async () => await getLivePools(), 'fetching live poolIds', res);
});

router.get('/pools/sync', async (_, res) => {
  await wrapper(async () => await syncLivePools(), 'syncing live pools', res);
});

router.get('/pool/:id/activities', async (req, res) => {
  await wrapper(
    async () => fetchActivity('pool', req.params.id),
    'fetching pool activities',
    res
  );
});

router.get('/pool/:id/complete', async (req, res) => {
  await wrapper(
    async () => await completePool(req.params.id),
    'completing pool',
    res
  );
});

export default router;
