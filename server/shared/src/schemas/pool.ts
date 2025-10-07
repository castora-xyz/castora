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
    this.poolId = Number(input[0]);
    this.seeds = new PoolSeeds(input[1]);
    this.seedsHash = input[2];
    this.creationTime = Number(input[3]);
    this.noOfPredictions = Number(input[4]);
    this.snapshotPrice = Number(input[5]);
    this.completionTime = Number(input[6]);
    this.winAmount = Number(input[7]);
    this.noOfWinners = Number(input[8]);
    this.noOfClaimedWinnings = Number(input[9]);
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
      ...(this.creator ? { creatorCompletionFees: this.creatorCompletionFees } : {})
    };
  }
}
