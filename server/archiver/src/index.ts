import { setWorker } from '@castora/shared';
import { archivePool } from './archive-pool.js';

setWorker({ workerName: 'pool-archiver', handler: archivePool });
