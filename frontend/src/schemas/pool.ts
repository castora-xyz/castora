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
    if (input.userCreated) this.userCreated = new UserCreatedPool(input.userCreated);
    this.creationTime = Number(input.creationTime);
    this.seeds =
      input.seeds instanceof PoolSeeds
        ? input.seeds
        : new PoolSeeds(input.seeds, this.creationTime, !!input.userCreated);
    this.seedsHash = input.seedsHash;
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
  }

  /**
   *
   */
  percentWinners() {
    return Math.trunc(10000 / this.seeds.multiplier) / 100;
  }
}
