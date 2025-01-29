import { tokens } from '../utils';

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

  constructor(input: any) {
    this.predictionToken = input['predictionToken'];
    this.stakeToken = input['stakeToken'];
    this.stakeAmount = Number(input['stakeAmount']);
    this.snapshotTime = Number(input['snapshotTime']);
    this.windowCloseTime = Number(input['windowCloseTime']);
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
      snapshotTime: BigInt(this.snapshotTime)
    };
  }

  /**
   * The display of winAmount with token name in notifications
   */
  formatWinAmount(amount: number) {
    const stakeTokenDetails = tokens.find(
      (t) => t.address.toLowerCase() === this.stakeToken.toLowerCase()
    );
    if (stakeTokenDetails) {
      const { decimals, name } = stakeTokenDetails;
      return `${amount / 10 ** decimals} ${name}`;
    } else {
      console.error(`Token not found in tokens list: ${this.stakeToken}`);
      // TODO: Alert Developers in some way
      return '';
    }
  }
}
