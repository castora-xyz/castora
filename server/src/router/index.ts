import { Response, Router } from 'express';
import { recordActivity } from '../controllers';
import poolRoutes from './pools';
import userRoutes from './users';

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
    console.error(`Error at ${desc} ... `);
    console.error(e);
    return response.status(400).json({
      success: false,
      message: e['message'] ?? `${e}`
    });
  }
};

router.use('/', poolRoutes);
router.use('/', userRoutes);

router.get('/record/:txHash', async (req, res) => {
  await wrapper(
    async () => await recordActivity(req.params.txHash),
    'recording activity',
    res
  );
});

router.use('**', (_, res) => res.json({ success: true }));

export default router;
