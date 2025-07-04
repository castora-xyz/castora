import { Router } from 'express';
import { registerUser } from '../controllers';
import { wrapper } from './index';

const router = Router();

router.post('/user/register', async (req, res) => {
  await wrapper(
    async () => await registerUser(req.headers, req.body),
    'registering user',
    res
  );
});

export default router;
