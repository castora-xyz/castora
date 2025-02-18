import { NextFunction, Request, Response } from 'express';

export type Chain = 'monaddevnet' | 'monadtestnet' | 'sepolia';
const isChain = (chain: any): chain is Chain =>
  chain === 'monaddevnet' || chain === 'monadtestnet' || chain === 'sepolia';

export const validateChain = async (
  { headers }: Request,
  res: Response,
  next: NextFunction
) => {
  let { chain } = headers;
  let message = '';
  // TODO: Remove the following default chain after updating main website
  if (!chain) chain = 'monaddevnet';
  // if (!chain) message = 'Provide valid chain in headers.';
  if (!isChain(chain)) message = `Unsupported chain: ${chain}`;
  if (message) {
    console.error('Error at validating chain ...');
    console.error(message);
    res.status(400).json({ success: false, message });
  } else {
    res.locals.chain = chain;
    next();
  }
};
