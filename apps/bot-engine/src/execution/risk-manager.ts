// apps/bot-engine/src/execution/risk-manager.ts
import { db } from '../utils/turso-client';
import { redis, CacheKeys } from '../utils/redis-client';
import { logger } from '../utils/logger';
import { PositionManager } from './position-manager';
import type { BotConfig } from '@orbis/shared-types';

const CASCADE_STOP_THRESHOLD = 3; // 3 consecutive losses → pause bot

export class RiskManager {
  private positionManager: PositionManager;

  constructor(private readonly userId: string) {
    this.positionManager = new PositionManager(userId);
  }

  /**
   * Check per-token stop loss and take profit.
   * Called on each price update for open positions.
   * Returns action to take: 'stop_loss' | 'take_profit_1' | 'take_profit_2' | null
   */
  checkExitConditions(
    currentPrice: number,
    entryPrice: number,
    config: BotConfig
  ): 'stop_loss' | 'take_profit_1' | 'take_profit_2' | null {
    const pnlPct = (currentPrice - entryPrice) / entryPrice;

    if (pnlPct <= -config.stopLossPct) {
      return 'stop_loss';
    }
    if (pnlPct >= config.takeProfitPct * 2) {
      return 'take_profit_2';
    }
    if (pnlPct >= config.takeProfitPct) {
      return 'take_profit_1';
    }
    return null;
  }

  /**
   * Cascade stop check: if bot has had >= CASCADE_STOP_THRESHOLD
   * losses in a row, return false (should pause bot).
   */
  async checkCascadeStop(): Promise<boolean> {
    const cascadeCount = await redis.get<number>(CacheKeys.cascadeCount(this.userId)) ?? 0;
    if (cascadeCount >= CASCADE_STOP_THRESHOLD) {
      logger.warn({ userId: this.userId, cascadeCount }, 'Cascade stop triggered');
      return false; // not safe to continue
    }
    return true; // safe
  }

  /**
   * Record a loss outcome — increments cascade counter.
   * Counter resets on a win.
   */
  async recordOutcome(isWin: boolean): Promise<void> {
    if (isWin) {
      await redis.del(CacheKeys.cascadeCount(this.userId));
    } else {
      await redis.incr(CacheKeys.cascadeCount(this.userId));
      await redis.expire(CacheKeys.cascadeCount(this.userId), 24 * 60 * 60); // 24h TTL
    }
  }

  /**
   * Daily loss limit: checks total realized loss today vs drawdown_limit_pct of balance.
   * Returns false if limit exceeded.
   */
  async checkDailyLossLimit(currentBalance: number): Promise<boolean> {
    // Check cascade stop first
    if (!(await this.checkCascadeStop())) return false;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    try {
      const result = await db.execute(
        `SELECT COALESCE(SUM(realized_pnl * entry_amount_sol), 0) AS total_loss
         FROM portfolio_state
         WHERE user_id = ? AND status = 'closed' AND realized_pnl < 0
           AND closed_at >= ?`,
        [this.userId, todayStart.getTime()]
      );
      const totalLoss = Math.abs(Number((result.rows[0] as any).total_loss));

      // Get config for drawdown limit
      const cfgResult = await db.execute(
        `SELECT max_exposure_sol, drawdown_limit_pct FROM bot_config WHERE user_id = ?`,
        [this.userId]
      );
      if (cfgResult.rows.length === 0) return true;
      const { drawdown_limit_pct } = cfgResult.rows[0] as any;

      const limit = currentBalance * drawdown_limit_pct;
      if (totalLoss >= limit) {
        logger.warn({ userId: this.userId, totalLoss, limit }, 'Daily loss limit exceeded');
        return false;
      }
      return true;
    } catch (err) {
      logger.error({ err }, 'Daily loss check failed — allowing trade');
      return true;
    }
  }

  /**
   * Time-based exit: close position if open for > maxHours with no exit triggered.
   * Default: 4 hours.
   */
  async checkTimeExit(openedAt: number, maxHours = 4): Promise<boolean> {
    const elapsed = (Date.now() - openedAt) / (1000 * 60 * 60);
    return elapsed >= maxHours;
  }
}
