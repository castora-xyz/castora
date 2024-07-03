import * as express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import * as morgan from 'morgan';

import router from './router';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('combined'));
app.use(router);

export const server = onRequest({ cors: true, timeoutSeconds: 1200 }, app);
