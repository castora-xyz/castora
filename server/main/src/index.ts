import * as cors from 'cors';
import * as express from 'express';
import * as morgan from 'morgan';

import router from './router';
import { logger } from './utils';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  morgan('combined', {
    stream: { write: (log: string) => logger.info(log.trim()) }
  })
);
app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
