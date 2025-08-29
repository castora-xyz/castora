import { Response, Router } from 'express';
import poolRoutes from './pools';
import authRoutes from './auth';
import { logger } from '../utils';

const router = Router();

export const wrapper = async (
  action: Function,
  desc: string,
  response: Response
): Promise<Response> => {
  try {
    const data = await action();
    return response.json({
      success: true,
      ...(data ? { data } : {})
    });
  } catch (e: any) {
    let message = e['message'] ?? `${e}`;
    if (message.includes('requests limited')) message = 'RPC Limit Reached';
    logger.info(`Error at ${desc} ... `);
    logger.info(e);
    return response.status(400).json({ success: false, message });
  }
};

router.use('/', poolRoutes);
router.use('/', authRoutes);
router.use('/', (_, res) => res.json({ success: true }));
router.use('**', (_, res) => res.status(404).json({ success: false, message: 'Not Found' }));

export default router;
