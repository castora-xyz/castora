/**
 * Whether 'claim' or 'predict'
 */
export type ActivityType = 'claim' | 'predict';

/**
 * Record of a user's activity
 */
export interface UserActivity {
  type: ActivityType;
  poolId: bigint;
  predictionId: bigint;
  txHash: string;
}

/**
 * Record of a pool's activity
 */
export interface PoolActivity {
  type: ActivityType;
  user: string;
  predictionId: bigint;
  txHash: string;
}
