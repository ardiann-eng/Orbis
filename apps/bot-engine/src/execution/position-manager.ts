// apps/bot-engine/src/execution/position-manager.ts
import type { Position, CloseReason } from '@orbis/shared-types';
import { db } from '../utils/turso-client';
import { logger } from '../utils/logger';

export class PositionManager {
  constructor(private readonly userId: string) {}

  async openPosition(params: {
    ca: string;
    entryPrice: number;
    entryAmountSol: number;
    entryTx: string;
    stopLossPrice: number;
    takeProfitPrice: number;
  }): Promise<number> {
    const now = Date.now();
    const result = await db.execute(
      `INSERT INTO portfolio_state
         (user_id, ca, status, entry_price, entry_amount_sol, entry_tx,
          current_price, unrealized_pnl, stop_loss_price, take_profit_price,
          cascade_stop_count, opened_at)
       VALUES (?, ?, 'open', ?, ?, ?, ?, 0, ?, ?, 0, ?)`,
      [
        this.userId, params.ca,
        params.entryPrice, params.entryAmountSol, params.entryTx,
        params.entryPrice, params.stopLossPrice, params.takeProfitPrice,
        now,
      ]
    );
    return Number(result.lastInsertRowid);
  }

  async updatePrice(ca: string, currentPrice: number): Promise<void> {
    const pos = await this.getOpenPosition(ca);
    if (!pos || !pos.entryPrice) return;

    const unrealizedPnl =
      (currentPrice - pos.entryPrice) / pos.entryPrice;

    await db.execute(
      `UPDATE portfolio_state
       SET current_price = ?, unrealized_pnl = ?
       WHERE user_id = ? AND ca = ? AND status = 'open'`,
      [currentPrice, unrealizedPnl, this.userId, ca]
    );
  }

  async closePosition(ca: string, closeReason: CloseReason, realizedPnl: number): Promise<void> {
    await db.execute(
      `UPDATE portfolio_state
       SET status = 'closed', realized_pnl = ?, close_reason = ?, closed_at = ?
       WHERE user_id = ? AND ca = ? AND status = 'open'`,
      [realizedPnl, closeReason, Date.now(), this.userId, ca]
    );
    logger.info({ ca, closeReason, realizedPnl }, 'Position closed');
  }

  async getOpenPosition(ca: string): Promise<Position | null> {
    const result = await db.execute(
      `SELECT * FROM portfolio_state
       WHERE user_id = ? AND ca = ? AND status = 'open' LIMIT 1`,
      [this.userId, ca]
    );
    if (result.rows.length === 0) return null;
    return this.rowToPosition(result.rows[0] as Record<string, unknown>);
  }

  async getAllOpenPositions(): Promise<Position[]> {
    const result = await db.execute(
      `SELECT * FROM portfolio_state
       WHERE user_id = ? AND status = 'open'
       ORDER BY opened_at DESC`,
      [this.userId]
    );
    return (result.rows as Array<Record<string, unknown>>).map(this.rowToPosition);
  }

  async countOpenPositions(): Promise<number> {
    const result = await db.execute(
      `SELECT COUNT(*) as cnt FROM portfolio_state
       WHERE user_id = ? AND status = 'open'`,
      [this.userId]
    );
    return Number((result.rows[0] as any).cnt);
  }

  private rowToPosition(row: Record<string, unknown>): Position {
    return {
      id:              row.id as number,
      userId:          row.user_id as string,
      ca:              row.ca as string,
      status:          row.status as Position['status'],
      entryPrice:      row.entry_price as number,
      entryAmountSol:  row.entry_amount_sol as number,
      entryTx:         row.entry_tx as string | null,
      currentPrice:    row.current_price as number | null,
      unrealizedPnl:   row.unrealized_pnl as number | null,
      realizedPnl:     row.realized_pnl as number | null,
      stopLossPrice:   row.stop_loss_price as number | null,
      takeProfitPrice: row.take_profit_price as number | null,
      cascadeStopCount: row.cascade_stop_count as number,
      openedAt:        row.opened_at as number,
      closedAt:        row.closed_at as number | null,
      closeReason:     row.close_reason as Position['closeReason'],
    };
  }
}
