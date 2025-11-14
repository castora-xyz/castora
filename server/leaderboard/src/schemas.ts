export class Prediction {
  predicter: string;
  isAWinner: boolean;

  constructor(input: any) {
    this.predicter = input['predicter'];
    this.isAWinner = input['isAWinner'];
  }
}

export class Pool {
  chain: string;
  creator: string;
  poolId: number;
  stakeToken: string;
  stakeAmount: number;
  hasBeenProcessedInLeaderboard: boolean;
  winAmount: number;
  predictions: Prediction[];
  json: any;

  constructor(input: any) {
    this.json = input;
    this.chain = input['chain'];
    this.creator = input['pool']['creator'] ?? '';
    this.poolId = Number(input['pool']['poolId']);
    this.stakeToken = input['pool']['seeds']['stakeToken'];
    this.stakeAmount = Number(input['pool']['seeds']['stakeAmount']);
    this.hasBeenProcessedInLeaderboard = input['pool']['hasBeenProcessedInLeaderboard'] ?? false;
    this.winAmount = Number(input['pool']['winAmount']);
    this.predictions = (input['predictions'] ?? []).map((p: any) => new Prediction({ poolId: this.poolId, ...p }));
  }
}
