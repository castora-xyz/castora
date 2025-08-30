import { setWorker } from '@castora/shared';
import { completePool } from './complete-pool.js';

setWorker({ workerName: 'pool-completer', handler: completePool });
