import { PoolSeeds } from './pool-seeds.js';

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
  completionTime: number;
  winAmount: number;
  noOfWinners: number;
  noOfClaimedWinnings: number;
  creator: string | undefined;
  creatorCompletionFees: string | undefined;

  constructor(input: any) {
    this.poolId = Number(input.poolId);
    this.seeds = new PoolSeeds(input.seeds);
    this.seedsHash = input.seedsHash;
    this.creationTime = Number(input.creationTime);
    this.noOfPredictions = Number(input.noOfPredictions);
    this.snapshotPrice = Number(input.snapshotPrice);
    this.completionTime = Number(input.completionTime);
    this.winAmount = Number(input.winAmount);
    this.noOfWinners = Number(input.noOfWinners);
    this.noOfClaimedWinnings = Number(input.noOfClaimedWinnings);
  }

  toJSON() {
    const { decimals } = this.seeds.getStakeTokenDetails();
    return {
      poolId: this.poolId,
      seeds: this.seeds.toJSON(),
      seedsHash: this.seedsHash,
      creationTime: this.creationTime,
      noOfPredictions: this.noOfPredictions,
      snapshotPrice: this.snapshotPrice,
      completionTime: this.completionTime,
      winAmount: this.winAmount / 10 ** decimals,
      noOfWinners: this.noOfWinners,
      ...(this.creator ? { creator: this.creator } : {}),
      ...(this.creatorCompletionFees ? { creatorCompletionFees: this.creatorCompletionFees } : {})
    };
  }
}
