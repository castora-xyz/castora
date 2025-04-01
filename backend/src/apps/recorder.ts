import * as cors from 'cors';
import * as express from 'express';
import * as morgan from 'morgan';
import { recordActivity } from '../controllers';
import { logger, validateChain, wrapper } from '../utils';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('combined', { stream: { write: (s) => logger.info(s) } }));
app.use(cors());

app.get('/record/:txHash', validateChain, async (req, res) => {
  await wrapper(
    async () => await recordActivity(res.locals.chain, req.params.txHash),
    'recording activity',
    res
  );
});

app.use('**', (_, res) => res.json({ success: true }));

const PORT = process.env.PORT || 3002;

export default app.listen(PORT, () =>
  logger.info(`Recorder App is running on port ${PORT}`)
);
