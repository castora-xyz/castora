import cors from 'cors';
import express from 'express';
import pinoHttp, { startTime } from 'pino-http';

import { logger } from '@castora/shared';
import router from './router';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  pinoHttp({
    logger,
    customSuccessMessage: (req, res) =>
      `HTTP ${req.method} ${req.originalUrl} ${res.statusCode} - ${new Date().getTime() - res[startTime]}ms` +
      ` :: ${req.headers['user-agent']}`,
    customErrorMessage: (req, res, err) =>
      `HTTP ${req.method} ${req.originalUrl} ${res.statusCode} - ${new Date().getTime() - res[startTime]}ms` +
      ` :: ${req.headers['user-agent']} - Error: ${err.message}`
  })
);
app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
