import { setWorker } from '@castora/shared';
import { completePool } from './complete-pool';

setWorker({ workerName: 'pool-completer', handler: completePool });
