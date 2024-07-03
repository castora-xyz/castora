import { Pool } from './pool';

/**
 * The activity of a participant in a {@link Pool}.
 */
export class Prediction {
  predicter: string;
  poolId: number;
  id: number;
  price: number;
  priceOnChain: number;
  time: number;
  claimWinningsTime: number;
  isAWinner: boolean;

  constructor(input: any) {
    this.predicter = input['predicter'];
    this.poolId = Number(input['poolId']);
    this.id = Number(input['predictionId']);
    this.priceOnChain = Number(input['predictionPrice']);
    this.price = parseFloat((this.priceOnChain / 10 ** 8).toFixed(8));
    this.time = Number(input['predictionTime']);
    this.claimWinningsTime = Number(input['claimedWinningsTime']);
    this.isAWinner = input['isAWinner'];
  }
}
