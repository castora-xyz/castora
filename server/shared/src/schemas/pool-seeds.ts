import { logger, Token, tokens } from '../utils/index.js';

/**
 * Holds information about the properties of a given pool.
 * Uniquely identifies a pool alongside the pool's unique numeric poolId.
 * Imitates what is defined in the contract code.
 */
export class PoolSeeds {
  predictionToken: string;
  stakeToken: string;
  stakeAmount: number;
  windowCloseTime: number;
  snapshotTime: number;
  feesPercent?: number;
  multiplier?: number;
  isUnlisted?: boolean;

  constructor(input: any) {
    this.predictionToken = input['predictionToken'];
    this.stakeToken = input['stakeToken'];
    this.stakeAmount = Number(input['stakeAmount']);
    this.snapshotTime = Number(input['snapshotTime']);
    this.windowCloseTime = Number(input['windowCloseTime']);
    if (input['feesPercent']) this.feesPercent = Number(input['feesPercent']);
    if (input['multiplier']) this.multiplier = Number(input['multiplier']);
    if (input['isUnlisted'] !== undefined) this.isUnlisted = input['isUnlisted'];
  }

  /**
   * Convert for contract call.
   */
  bigIntified(): any {
    return {
      predictionToken: this.predictionToken,
      stakeToken: this.stakeToken,
      stakeAmount: BigInt(this.stakeAmount),
      windowCloseTime: BigInt(this.windowCloseTime),
      snapshotTime: BigInt(this.snapshotTime),
      ...(this.feesPercent ? { feesPercent: BigInt(this.feesPercent) } : {}),
      ...(this.multiplier ? { multiplier: BigInt(this.multiplier) } : {}),
      ...(this.isUnlisted !== undefined ? { isUnlisted: this.isUnlisted } : {})
    };
  }

  /**
   * Returns info about the prediction token
   */
  getPredictionTokenDetails(): Token {
    const details = tokens.find((t) => t.address.toLowerCase() === this.predictionToken.toLowerCase());
    if (!details) {
      const message = `Prediction Token not found in tokens list: ${this.predictionToken}`;
      logger.error(message);
      throw message;
    }
    return details;
  }

  /**
   * Returns info about the stake token
   */
  getStakeTokenDetails(): Token {
    const details = tokens.find((t) => t.address.toLowerCase() === this.stakeToken.toLowerCase());
    if (!details) {
      const message = `Stake Token not found in tokens list: ${this.stakeToken}`;
      logger.error(message);
      throw message;
    }
    return details;
  }

  toJSON(): any {
    const { name: predictionToken } = this.getPredictionTokenDetails();
    const { decimals, name: stakeToken } = this.getStakeTokenDetails();
    return {
      predictionToken,
      stakeToken,
      stakeAmount: this.stakeAmount / 10 ** decimals,
      windowCloseTime: this.windowCloseTime,
      snapshotTime: this.snapshotTime,
      // fees percent and multiplier are in 2 decimals on chain so we divide here
      ...(this.feesPercent ? { feesPercent: this.feesPercent / 100 } : {}),
      ...(this.multiplier ? { multiplier: this.multiplier / 100 } : {}),
      ...(this.isUnlisted !== undefined ? { isUnlisted: this.isUnlisted } : {})
    };
  }
}
