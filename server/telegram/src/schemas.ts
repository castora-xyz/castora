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
  poolId: number;
  stakeToken: string;
  hasNotifiedWinnersOnTelegram: boolean;
  winAmount: number;
  predictions: Prediction[];
  winners: string[];
  json: any;

  constructor(input: any) {
    this.json = input;
    this.chain = input['chain'];
    this.poolId = Number(input['pool']['poolId']);
    this.stakeToken = input['pool']['seeds']['stakeToken'];
    this.hasNotifiedWinnersOnTelegram = input['pool']['hasNotifiedWinnersOnTelegram'] ?? false;
    this.winAmount = Number(input['pool']['winAmount']);
    this.predictions = (input['predictions'] ?? []).map(
      (p: any) => new Prediction({ poolId: this.poolId, ...p })
    );
    this.winners = input['results']['winnerAddressesUniqued'] ?? [];
  }
}
