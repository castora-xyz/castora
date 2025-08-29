import { Pool } from './pool';

/**
 * The activity of a participant in a {@link Pool}.
 */
export class Prediction {
  predicter: string;
  poolId: number;
  id: number;
  price: number;
  time: number;
  claimedWinningsTime: number;
  isAWinner: boolean;

  constructor(input: any) {
    this.predicter = input['predicter'];
    this.poolId = Number(input['poolId']);
    this.id = Number(input['predictionId'] || input['id']);
    this.price = Number(input['predictionPrice'] || input['price']);
    this.time = Number(input['predictionTime'] || input['time']);
    this.claimedWinningsTime = Number(input['claimedWinningsTime']);
    this.isAWinner = input['isAWinner'];
  }

  toJson(): any {
    return {
      predicter: this.predicter,
      id: this.id,
      price: this.price,
      time: this.time,
      isAWinner: this.isAWinner
    };
  }
}
