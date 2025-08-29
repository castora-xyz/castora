import { setWorker } from '@castora/shared';
import { archivePool } from './archive-pool';

setWorker({ workerName: 'pool-archiver', handler: archivePool });
