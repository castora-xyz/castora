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
  const { chain } = headers;
  let message = '';
  if (!chain) {
    message = 'Provide valid chain in headers.';
  } else {
    try {
      const normalizedChain = normalizeChain(String(chain).toLowerCase());
      if (!isChain(normalizedChain)) message = `Unsupported chain: ${chain}`;
      else {
        res.locals.chain = normalizedChain;
        return next();
      }
    } catch {
      message = `Unsupported chain: ${chain}`;
    }
  }
  logger.info('Error at validating chain ...');
  logger.info(message);
  res.status(400).json({ success: false, message });
};
