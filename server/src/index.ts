import * as express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import * as morgan from 'morgan';

import {
  completePool,
  completePools,
  recordActivity,
  syncPools
} from './controllers';
import router, { wrapper } from './router';
import { validateChain } from './utils';

const mainApp = express();

mainApp.use(express.json());
mainApp.use(express.urlencoded({ extended: false }));
mainApp.use(morgan('combined'));
mainApp.use(router);

export const server = onRequest({ cors: true, timeoutSeconds: 1800 }, mainApp);

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
  { cors: true, timeoutSeconds: 1800 },
  recorderApp
);

const syncerApp = express();
syncerApp.use(express.json());
syncerApp.use(express.urlencoded({ extended: false }));
syncerApp.use(morgan('combined'));
syncerApp.get('/pools/sync', validateChain, async (_, res) => {
  await wrapper(
    async () => await syncPools(res.locals.chain),
    'syncing pools',
    res
  );
});
syncerApp.use('**', (_, res) => res.json({ success: true }));

export const syncer = onRequest(
  { cors: true, timeoutSeconds: 1800 },
  syncerApp
);

const completerApp = express();
completerApp.use(express.json());
completerApp.use(express.urlencoded({ extended: false }));
completerApp.use(morgan('combined'));
completerApp.get('/pool/:id/complete', validateChain, async (req, res) => {
  await wrapper(
    async () => await completePool(res.locals.chain, req.params.id),
    'completing pool',
    res
  );
});
completerApp.get('/pools/complete', validateChain, async (_, res) => {
  await wrapper(
    async () => await completePools(res.locals.chain),
    'completing pools',
    res
  );
});
completerApp.use('**', (_, res) => res.json({ success: true }));

export const completer = onRequest(
  { cors: true, timeoutSeconds: 1800 },
  completerApp
);
