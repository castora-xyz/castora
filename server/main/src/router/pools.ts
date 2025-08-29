import { Router } from 'express';
import { archivePool, completePool, getCryptoPoolIds, getStocksPoolIds, syncPools } from '../controllers/pools';
import { validateChain } from '../middleware';
import { wrapper } from './index';

const router = Router();

router.get('/pool/:id/archive', validateChain, async (req, res) => {
  await wrapper(async () => await archivePool(res.locals.chain, req.params.id), 'archiving pool', res);
});

router.get('/pool/:id/complete', validateChain, async (req, res) => {
  await wrapper(async () => await completePool(res.locals.chain, req.params.id), 'completing pool', res);
});

router.get('/pools/ids', validateChain, async (_, res) => {
  await wrapper(
    async () => {
      const crypto = await getCryptoPoolIds(res.locals.chain);
      const stocks = await getStocksPoolIds(res.locals.chain);
      return { crypto, stocks };
    },
    'fetching all poolIds',
    res
  );
});

router.get('/pools/ids/crypto', validateChain, async (_, res) => {
  await wrapper(async () => await getCryptoPoolIds(res.locals.chain), 'fetching live crypto poolIds', res);
});

router.get('/pools/ids/stocks', validateChain, async (_, res) => {
  await wrapper(async () => await getStocksPoolIds(res.locals.chain), 'fetching live stocks poolIds', res);
});

router.get('/pools/sync', validateChain, async (_, res) => {
  await wrapper(async () => await syncPools(res.locals.chain), 'syncing live pools', res);
});

export default router;
