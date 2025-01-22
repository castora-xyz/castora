import { Router } from 'express';
import {
  completePool,
  completePools,
  fetchActivity,
  getLivePools,
  syncLivePools
} from '../controllers';
import { validateChain } from '../utils';
import { wrapper } from './index';

const router = Router();

router.use(validateChain);

router.get('/pools/complete', async (_, res) => {
  await wrapper(
    async () => await completePools(res.locals.chain),
    'completing pools',
    res
  );
});

router.get('/pools/live', async (req, res) => {
  await wrapper(
    async () => await getLivePools(res.locals.chain),
    'fetching live poolIds',
    res
  );
});

router.get('/pools/sync', async (_, res) => {
  await wrapper(
    async () => await syncLivePools(res.locals.chain),
    'syncing live pools',
    res
  );
});

router.get('/pool/:id/activities', async (req, res) => {
  await wrapper(
    async () => fetchActivity(res.locals.chain, 'pool', req.params.id),
    'fetching pool activities',
    res
  );
});

router.get('/pool/:id/complete', async (req, res) => {
  await wrapper(
    async () => await completePool(res.locals.chain, req.params.id),
    'completing pool',
    res
  );
});

export default router;
