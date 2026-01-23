import { Chain, logger, normalizeChain } from '@castora/shared';
import { NextFunction, Request, Response } from 'express';

const isChain = (chain: any): chain is Chain => {
  const normalized = normalizeChain(String(chain).toLowerCase());
  return normalized === 'monad' || normalized === 'megaethtestnet';
};

export const validateChain = async ({ headers }: Request, res: Response, next: NextFunction) => {
  let { chain } = headers;
  let message = '';
  if (!chain) message = 'Provide valid chain in headers.';
  const normalizedChain = chain ? normalizeChain(String(chain).toLowerCase()) : null;
  if (!normalizedChain || !isChain(normalizedChain)) {
    message = `Unsupported chain: ${chain}`;
  }
  if (message) {
    logger.info('Error at validating chain ...');
    logger.info(message);
    res.status(400).json({ success: false, message });
  } else {
    res.locals.chain = normalizedChain;
    next();
  }
};
