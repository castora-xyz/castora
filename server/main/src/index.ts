import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { logger } from '@castora/shared';
import router from './router';

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
