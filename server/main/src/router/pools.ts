import { Router } from 'express';
import { getCommunityPoolIds, getCryptoPoolIds, getStocksPoolIds, settlePool, syncPools } from '../controllers/pools.js';
import { validateChain } from '../middleware/validate-chain.js';
import { wrapper } from './index.js';

const router = Router();

router.get('/pool/:id/settle', validateChain, async (req, res) => {
  await wrapper(async () => await settlePool(res.locals.chain, req.params.id), 'settling pool', res);
});

router.get('/pools/ids', validateChain, async (_, res) => {
  await wrapper(
    async () => {
      const crypto = await getCryptoPoolIds(res.locals.chain);
      const stocks = await getStocksPoolIds(res.locals.chain);
      const community = await getCommunityPoolIds(res.locals.chain);
      return { crypto, stocks, community };
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

router.get('/pools/ids/community', validateChain, async (_, res) => {
  await wrapper(async () => await getCommunityPoolIds(res.locals.chain), 'fetching live community poolIds', res);
});

router.get('/pools/sync', validateChain, async (_, res) => {
  await wrapper(async () => await syncPools(res.locals.chain), 'syncing live pools', res);
});

export default router;
