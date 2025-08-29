import { AUTH_MESSAGE, getAddress, logger, verifyMessage } from '@castora/shared';
import { NextFunction, Request, Response } from 'express';

const fail = (res: Response, message: string) => {
  logger.info('Error at validating auth ...');
  logger.info(message);
  res.status(400).json({ success: false, message });
};

export const validateAuth = async ({ headers }: Request, res: Response, next: NextFunction) => {
  const { authorization, 'user-wallet-address': userWalletAddress } = headers;

  if (!authorization) {
    fail(res, 'Missing required authorization header');
    return;
  }

  const signature = authorization.split(' ')[1] as `0x${string}`;
  if (!signature) {
    fail(res, 'Missing required signature in authorization header');
    return;
  }

  if (!/^(0x)[a-f0-9]{1,}$/i.test(signature)) {
    fail(res, 'Invalid provided signature');
    return;
  }

  if (!userWalletAddress) {
    fail(res, 'Missing required user-wallet-address in headers');
    return;
  }

  if (!/^(0x)[0-9a-f]{40}$/i.test(`${userWalletAddress}`)) {
    fail(res, 'Invalid provided user-wallet-address');
    return;
  }

  let isVerified = false;
  try {
    isVerified = await verifyMessage({
      address: userWalletAddress as `0x${string}`,
      message: AUTH_MESSAGE,
      signature
    });
  } catch (e) {
    logger.info(e);
    fail(res, `Couldn't verify signature: ${e}`);
    return;
  }
  if (!isVerified) {
    fail(res, 'Unauthorized Signature');
    return;
  }

  // Use the EIP-55 CheckSummed Address
  res.locals.userWalletAddress = getAddress(userWalletAddress as string);
  next();
};
