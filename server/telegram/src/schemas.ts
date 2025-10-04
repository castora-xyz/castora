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
  creatorCompletionFees: string;
  poolId: number;
  stakeToken: string;
  hasNotifiedCreatorOnTelegram: boolean;
  hasNotifiedWinnersOnTelegram: boolean;
  winAmount: number;
  predictions: Prediction[];
  winners: string[];
  json: any;

  constructor(input: any) {
    this.json = input;
    this.chain = input['chain'];
    this.creator = input['creator'] ?? '';
    this.creatorCompletionFees = input['creatorCompletionFees'] ?? '';
    this.poolId = Number(input['pool']['poolId']);
    this.stakeToken = input['pool']['seeds']['stakeToken'];
    this.hasNotifiedCreatorOnTelegram = input['pool']['hasNotifiedCreatorOnTelegram'] ?? false;
    this.hasNotifiedWinnersOnTelegram = input['pool']['hasNotifiedWinnersOnTelegram'] ?? false;
    this.winAmount = Number(input['pool']['winAmount']);
    this.predictions = (input['predictions'] ?? []).map((p: any) => new Prediction({ poolId: this.poolId, ...p }));
    this.winners = input['results']['winnerAddressesUniqued'] ?? [];
  }
}
