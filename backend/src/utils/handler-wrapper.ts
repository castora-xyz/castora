import { Response } from 'express';
import { logger } from '.';

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
    logger.error(`Error at ${desc} ... `);
    logger.error(e);
    return response.status(400).json({ success: false, message });
  }
};
