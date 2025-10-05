import { tokens } from './tokens';

/**
 * Tracks created pool information
 */
export class UserCreatedPool {
  creator: string;
  completionFeesToken: string;
  completionFeesTokenDetails: (typeof tokens)[number];
  creationFeesToken: string;
  nthPoolCount: number;
  creationTime: number;
  creationFeesAmount: number;
  completionTime: number;
  creatorClaimTime: number;
  completionFeesAmountOnChain: number;
  completionFeesAmount: number;
  completionFeesPercent: number;
  multiplier: number;
  isUnlisted: boolean;

  constructor(input: any) {
    this.creator = input.creator;
    this.completionFeesToken = input.completionFeesToken;

    const foundCF = tokens.find((t) => t.address.toLowerCase() === this.completionFeesToken.toLowerCase());
    if (!foundCF) {
      throw `Token not found in tokens list: ${this.completionFeesToken}`;
    }
    this.completionFeesTokenDetails = foundCF;
    this.creationFeesToken = input.creationFeesToken;
    this.nthPoolCount = Number(input.nthPoolCount);
    this.creationTime = Number(input.creationTime);
    this.creationFeesAmount = Number(input.creationFeesAmount);
    this.completionTime = Number(input.completionTime);
    this.creatorClaimTime = Number(input.creatorClaimTime);
    this.completionFeesAmountOnChain = Number(input.completionFeesAmount);
    this.completionFeesAmount = parseFloat(
      (Math.floor(this.completionFeesAmountOnChain) / 10 ** this.completionFeesTokenDetails.decimals).toFixed(5)
    );
    this.completionFeesPercent = Number(input.completionFeesPercent) / 100; // in 2 decimal places in the contract
    this.multiplier = Number(input.multiplier) / 100; // in 2 decimal places in the contract
    this.isUnlisted = input.isUnlisted;
  }

  getGainedDisplay() {
    return `${this.completionFeesAmount} ${this.completionFeesTokenDetails.name}`;
  }
}
