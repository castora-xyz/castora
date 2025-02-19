import { Router } from 'express';
import { fetchActivity, registerUser } from '../controllers';
import { validateChain } from '../utils';
import { wrapper } from './index';

const router = Router();

router.post('/user/register', async (req, res) => {
  await wrapper(
    async () => await registerUser(req.headers, req.body),
    'registering user',
    res
  );
});

router.get('/user/:address/activities', validateChain, async (req, res) => {
  await wrapper(
    async () => fetchActivity(res.locals.chain, 'user', req.params.address),
    'fetching user activities',
    res
  );
});

export default router;
