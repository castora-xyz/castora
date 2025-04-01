import * as cors from 'cors';
import * as express from 'express';
import * as morgan from 'morgan';
import {
  completePool,
  fetchActivity,
  getLivePools,
  registerUser
} from '../controllers';
import { logger, validateChain, wrapper } from '../utils';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('combined', { stream: { write: (s) => logger.info(s) } }));
app.use(cors());

app.get('/pools/live', validateChain, async (_, res) => {
  await wrapper(
    async () => await getLivePools(res.locals.chain),
    'fetching live poolIds',
    res
  );
});

app.get('/pool/:id/activities', validateChain, async (req, res) => {
  await wrapper(
    async () => fetchActivity(res.locals.chain, 'pool', req.params.id),
    'fetching pool activities',
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

app.post('/user/register', async (req, res) => {
  await wrapper(
    async () => await registerUser(req.headers, req.body),
    'registering user',
    res
  );
});

app.get('/user/:address/activities', validateChain, async (req, res) => {
  await wrapper(
    async () => fetchActivity(res.locals.chain, 'user', req.params.address),
    'fetching user activities',
    res
  );
});

app.use('**', (_, res) => res.json({ success: true }));

const PORT = process.env.PORT || 3000;

export default app.listen(PORT, () =>
  logger.info(`Main App is running on port ${PORT}`)
);
