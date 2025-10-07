import { PoolSeeds } from './pool-seeds';
import { UserCreatedPool } from './user-created-pool';

/**
 * Where participants make predictions.
 *
 * Is uniquely identified by its numeric poolId and its PoolSeeds.
 * At the point when a pool is created, the poolId corresponds to the total
 * noOfPools in the smart contract.
 */
export class Pool {
  poolId: number;
  seeds: PoolSeeds;
  seedsHash: string;
  creationTime: number;
  noOfPredictions: number;
  snapshotPrice: number;
  snapshotPriceOnChain: number;
  completionTime: number;
  winAmount: number;
  winAmountOnChain: number;
  noOfWinners: number;
  noOfClaimedWinnings: number;
  userCreated: UserCreatedPool | undefined;

  constructor(input: any) {
    this.poolId = Number(input.poolId);
    this.seeds = input.seeds instanceof PoolSeeds ? input.seeds : new PoolSeeds(input.seeds);
    this.seedsHash = input.seedsHash;
    this.creationTime = Number(input.creationTime);
    this.noOfPredictions = Number(input.noOfPredictions);
    this.snapshotPriceOnChain = Number(input.snapshotPrice);
    this.snapshotPrice = parseFloat((this.snapshotPriceOnChain / 10 ** 8).toFixed(8));
    this.completionTime = Number(input.completionTime);
    this.winAmountOnChain = Number(input.winAmount);
    this.winAmount = parseFloat(
      (Math.floor(this.winAmountOnChain / 0.95) / 10 ** this.seeds.stakeTokenDetails.decimals).toFixed(3)
    );
    this.noOfWinners = Number(input.noOfWinners);
    this.noOfClaimedWinnings = Number(input.noOfClaimedWinnings);
    if (input.userCreated) this.userCreated = new UserCreatedPool(input.userCreated);
  }

  /**
   * Whether it is a special pool.
   */
  isFlash() {
    return this.poolId === 3000 || this.poolId === 5000;
  }

  /**
   * The units of stake that winners go with.
   */
  multiplier() {
    if (this.poolId === 3000) return 10;
    if (this.poolId === 5000) return 5;
    if (this.userCreated) return this.userCreated.multiplier;
    return 2;
  }

  /**
   *
   */
  percentWinners() {
    return Math.trunc(10000 / this.multiplier()) / 100;
  }
}
