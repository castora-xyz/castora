import { FilterPoolsProps } from '@/contexts';
import ms from 'ms';
import { tokens } from './tokens';

/**
 * Holds information about the properties of a given pool.
 * Uniquely identifies a pool alongside the pool's unique numeric poolId.
 * Imitates what is defined in the contract code.
 */
export class PoolSeeds {
  predictionToken: string;
  predictionTokenDetails: (typeof tokens)[number];
  stakeToken: string;
  stakeTokenDetails: (typeof tokens)[number];
  stakeAmount: number;
  windowCloseTime: number;
  snapshotTime: number;

  constructor(input: any) {
    this.predictionToken = input['predictionToken'];
    this.stakeToken = input['stakeToken'];
    this.stakeAmount = Number(input['stakeAmount']);
    this.snapshotTime = Number(input['snapshotTime']);
    this.windowCloseTime = Number(input['windowCloseTime']);

    const foundP = tokens.find(
      (t) => t.address.toLowerCase() === this.predictionToken.toLowerCase()
    );
    if (!foundP) {
      throw `Token not found in tokens list: ${this.predictionToken}`;
    }
    this.predictionTokenDetails = foundP;

    const foundS = tokens.find(
      (t) => t.address.toLowerCase() === this.stakeToken.toLowerCase()
    );
    if (!foundS) throw `Token not found in tokens list: ${this.stakeToken}`;
    this.stakeTokenDetails = foundS;
  }

  /**
   * Convert for contract call.
   */
  bigIntified() {
    return {
      predictionToken: this.predictionToken,
      stakeToken: this.stakeToken,
      stakeAmount: BigInt(this.stakeAmount),
      snapshotTime: BigInt(this.snapshotTime),
      windowCloseTime: BigInt(this.windowCloseTime)
    };
  }

  /**
   * The pair name given to the trading view widget for the chart
   */
  chartPairName() {
    const { name } = this.predictionTokenDetails;
    if (name == 'AAPL') return 'PYTH:AAPL';
    if (name == 'MOODENG') return 'BITGET:MOODENGUSDT';
    if (name == 'PENGU') return 'BITGET:PENGUUSDT';
    if (name == 'SUI') return 'COINBASE:SUIUSD';
    if (name == 'TRUMP') return 'KCEX:TRUMPUSDT';
    return `PYTH:${name}USD`;
  }

  /**
   * Formats and returns time and date parts of snapshot time.
   */
  formattedSnapshotTime() {
    const snapshot = new Date(this.snapshotTime * 1000);
    const time = snapshot.toTimeString().split(':').slice(0, 2).join(':');
    const now = new Date();

    if (
      now.getMonth() == snapshot.getMonth() &&
      now.getFullYear() == snapshot.getFullYear()
    ) {
      if (now.getDate() == snapshot.getDate()) return [time];
      if (now.getDate() - 1 == snapshot.getDate()) return [time, 'Yesterday'];
      if (now.getDate() + 1 == snapshot.getDate()) return [time, 'Tomorrow'];
      if (Math.abs(now.getDate() - snapshot.getDate()) < 7) {
        const days = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday'
        ];
        return [time, days[snapshot.getDay()]];
      }
    }

    const parts = snapshot.toDateString().split(' ');
    const date = [parts[2], parts[1], parts[3]].join(' ');
    return [time, date];
  }

  /**
   * Display the stake amount and stake token for frontend.
   * @param [multiplied=1] multiplier to apply on stake being displayed
   */
  displayStake(multiplied: number = 1) {
    const { decimals, name } = this.stakeTokenDetails;
    return `${(this.stakeAmount * multiplied) / 10 ** decimals} ${name}`;
  }

  /**
   * Whether the pool is no longer accepting predictions and
   * it is not yet snapshot time.
   */
  isAwaitingSnapshot() {
    const now = Math.round(Date.now() / 1000);
    return this.windowCloseTime <= now && now < this.snapshotTime;
  }

  /**
   * When the pool will start accepting predictions.
   */
  openTime() {
    if (this.status() === 'Upcoming') {
      const diff = this.snapshotTime - this.windowCloseTime;
      if (diff === 15 * 60) return this.windowCloseTime - 45 * 60;
      if (diff === 30 * 60) return this.windowCloseTime - 5 * 30 * 60;
      if (diff === 60 * 60) return this.windowCloseTime - 5 * 60 * 60;
      if (diff === 12 * 60 * 60) return this.windowCloseTime - 12 * 60 * 60;
      return null;
    } else return null;
  }

  /**
   * Display the prediction token for frontend as a pair.
   */
  pairName() {
    return `${this.predictionTokenDetails.name}/USD`;
  }

  /**
   * Display the prediction token for frontend as a pair in full name.
   */
  pairNameFull() {
    return `${this.predictionTokenDetails.fullName} / US Dollar`;
  }

  /**
   * Display the prediction token for frontend as a pair on past pools.
   */
  pairNameSpaced() {
    return `${this.predictionTokenDetails.name} / USD`;
  }

  /**
   * The number of hours (in seconds) of the pool's life.
   * That is from when it opens till snapshotTime.
   */
  poolLife() {
    const diff = this.snapshotTime - this.windowCloseTime;
    if (diff === 15 * 60) return 60 * 60; // hourly pool
    if (diff === 30 * 60) return 3 * 60 * 60; // 3-hoorly pool
    if (diff === 60 * 60) return 6 * 60 * 60; // 6-hourly pool
    if (diff === 12 * 60 * 60) return 12 * 60 * 60; // 12-hourly pool
    // TODO: Handle newer pool types when the time comes
    return 60 * 60;
  }

  /**
   * Returns the pool life as a string to display in frontend
   * @returns 24h or 6h or corresponding pool life
   */
  displayPoolLife() {
    return this.poolLife() == 12 * 60 * 60 ? '24h' : ms(this.poolLife() * 1000);
  }

  /**
   * Whether the pool is still accepting predictions (open),
   * or its window has closed (closed), or its snapshot time
   * has passed (completed).
   */
  status() {
    const now = Math.floor(Date.now() / 1000);
    const diff = this.snapshotTime - this.windowCloseTime;
    if (
      (diff === 15 * 60 && now < this.windowCloseTime - 45 * 60) ||
      (diff === 30 * 60 && now < this.windowCloseTime - 5 * 30 * 60) ||
      (diff === 60 * 60 && now < this.windowCloseTime - 5 * 60 * 60)
    ) {
      return 'Upcoming';
    }
    if (now < this.windowCloseTime) return 'Open';
    if (now < this.snapshotTime) return 'Closed';
    return 'Completed';
  }

  /**
   * Determines whether the pool matches the current filter criteria.
   * The filter criteria include pool statuses, pool life durations,
   * prediction tokens, and stake tokens.
   *
   * @returns {boolean} `true` if the pool matches all filter criteria; otherwise, `false`.
   */
  matchesFilter({
    poolLifes,
    predictionTokens,
    stakeTokens,
    statuses
  }: FilterPoolsProps): boolean {
    if (!statuses.includes(this.status())) return false;
    if (!poolLifes.includes(this.displayPoolLife())) return false;

    const { name: prdToken } = this.predictionTokenDetails;
    const { name: stkToken } = this.stakeTokenDetails;
    if (!predictionTokens.includes(prdToken)) return false;
    if (!stakeTokens.includes(stkToken)) return false;

    return true;
  }
}
