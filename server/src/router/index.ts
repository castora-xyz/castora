import { Response, Router } from 'express';
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
    let message = e['message'] ?? `${e}`;
    if (message.includes('requests limited')) message = 'RPC Limit Reached';
    console.error(`Error at ${desc} ... `);
    console.error(e);
    return response.status(400).json({ success: false, message });
  }
};

router.use('/', poolRoutes);
router.use('/', userRoutes);

router.use('**', (_, res) => res.json({ success: true }));

export default router;
