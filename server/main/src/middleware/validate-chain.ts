import { Chain, logger, normalizeChain, CHAIN_CONFIG } from '@castora/shared';
import { NextFunction, Request, Response } from 'express';

const isChain = (chain: any): chain is Chain => {
  try {
    const normalized = normalizeChain(String(chain).toLowerCase().replace(/\s/g, ''));
    return normalized in CHAIN_CONFIG;
  } catch {
    return false;
  }
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
