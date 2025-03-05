import * as express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import * as morgan from 'morgan';

import { recordActivity } from './controllers';
import router, { wrapper } from './router';
import { validateChain } from './utils';

const mainApp = express();

mainApp.use(express.json());
mainApp.use(express.urlencoded({ extended: false }));
mainApp.use(morgan('combined'));
mainApp.use(router);

export const server = onRequest({ cors: true, timeoutSeconds: 1200 }, mainApp);

const recorderApp = express();
recorderApp.use(express.json());
recorderApp.use(express.urlencoded({ extended: false }));
recorderApp.use(morgan('combined'));
recorderApp.get('/record/:txHash', validateChain, async (req, res) => {
  await wrapper(
    async () => await recordActivity(res.locals.chain, req.params.txHash),
    'recording activity',
    res
  );
});

recorderApp.use('**', (_, res) => res.json({ success: true }));

export const recorder = onRequest(
  { cors: true, timeoutSeconds: 1200 },
  recorderApp
);
