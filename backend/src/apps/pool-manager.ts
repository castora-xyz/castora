import * as cors from 'cors';
import * as express from 'express';
import * as morgan from 'morgan';
import { completePool, completePools, syncPools } from '../controllers';
import { logger, validateChain, wrapper } from '../utils';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('combined', { stream: { write: (s) => logger.info(s) } }));
app.use(cors());

app.get('/pools/complete', validateChain, async (_, res) => {
  await wrapper(
    async () => await completePools(res.locals.chain),
    'completing pools',
    res
  );
});

app.get('/pools/sync', validateChain, async (_, res) => {
  await wrapper(
    async () => await syncPools(res.locals.chain),
    'syncing pools',
    res
  );
});

app.get('/pool/:id/complete', validateChain, async (req, res) => {
  await wrapper(
    async () => await completePool(res.locals.chain, req.params.id),
    'completing pool',
    res
  );
});

app.use('**', (_, res) => res.json({ success: true }));

const PORT = process.env.PORT || 3001;

export default app.listen(PORT, () =>
  logger.info(`Pool Manager App is running on port ${PORT}`)
);
