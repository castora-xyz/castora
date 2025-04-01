import { Timestamp } from 'firebase-admin/firestore';

/**
 * Whether 'claim' or 'predict'
 */
export type ActivityType = 'claim' | 'predict';

/**
 * Record of a user's activity
 */
export interface UserActivity {
  type: ActivityType;
  poolId: number;
  predictionId: number;
  timestamp: Timestamp;
  txHash: string;
}

/**
 * Record of a pool's activity
 */
export interface PoolActivity {
  type: ActivityType;
  user: string;
  predictionId: number;
  timestamp: Timestamp;
  txHash: string;
}
