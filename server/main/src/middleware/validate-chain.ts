import { NextFunction, Request, Response } from 'express';
import { Chain, logger } from '../utils';

const isChain = (chain: any): chain is Chain =>
  chain === 'monaddevnet' || chain === 'monadtestnet' || chain === 'sepolia';

export const validateChain = async ({ headers }: Request, res: Response, next: NextFunction) => {
  let { chain } = headers;
  let message = '';
  if (!chain) message = 'Provide valid chain in headers.';
  if (!isChain(chain)) message = `Unsupported chain: ${chain}`;
  if (message) {
    logger.info('Error at validating chain ...');
    logger.info(message);
    res.status(400).json({ success: false, message });
  } else {
    res.locals.chain = chain;
    next();
  }
};
