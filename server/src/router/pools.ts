import { Router } from 'express';
import {
  archivePool,
  archivePools,
  completePool,
  completePools,
  fetchActivity,
  getExperimentalsPools,
  getLivePools,
  syncPools
} from '../controllers';
import { fetchPool, validateChain } from '../utils';
import { wrapper } from './index';

const router = Router();

router.get('/pools/archive', validateChain, async (_, res) => {
  await wrapper(
    async () => await archivePools(res.locals.chain),
    'archiving pools',
    res
  );
});

router.get('/pools/complete', validateChain, async (_, res) => {
  await wrapper(
    async () => await completePools(res.locals.chain),
    'completing pools',
    res
  );
});

router.get('/pools/live', validateChain, async (_, res) => {
  await wrapper(
    async () => await getLivePools(res.locals.chain),
    'fetching live poolIds',
    res
  );
});

router.get('/pools/experimentals', validateChain, async (_, res) => {
  await wrapper(
    async () => await getExperimentalsPools(res.locals.chain),
    'fetching live poolIds',
    res
  );
});

router.get('/pools/sync', validateChain, async (_, res) => {
  await wrapper(
    async () => await syncPools(res.locals.chain),
    'syncing live pools',
    res
  );
});

router.get('/pool/:id/activities', validateChain, async (req, res) => {
  await wrapper(
    async () => fetchActivity(res.locals.chain, 'pool', req.params.id),
    'fetching pool activities',
    res
  );
});

router.get('/pool/:id/archive', validateChain, async (req, res) => {
  await wrapper(
    async () => await archivePool(res.locals.chain, req.params.id),
    'archiving pool',
    res
  );
});

router.get('/pool/:id/complete', validateChain, async (req, res) => {
  await wrapper(
    async () => await completePool(res.locals.chain, req.params.id),
    'completing pool',
    res
  );
});

router.get('/pool/:id', validateChain, async (req, res) => {
  await wrapper(
    async () => fetchPool(res.locals.chain, req.params.id),
    'fetching pool',
    res
  );
});

export default router;
