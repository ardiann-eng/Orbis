// apps/bot-engine/src/demo/demo-engine.ts
import { db } from '../utils/turso-client';
import { logger } from '../utils/logger';
import { SolscanClient } from '../ingestion/solscan-client';

export type TradingMode = 'DEMO' | 'REAL';

export interface DemoWallet {
  userId: string;
  virtualBalance: number;
  initialBalance: number;
  lockedInPositions: number;
  availableBalance: number;
}

export interface DemoPosition {
  id: number;
  userId: string;
  tokenMint: string;
  tokenName: string | null;
  entryPrice: number;
  entryTime: number;
  sizeSOL: number;
  triggerLogic: 'L1' | 'L2' | 'L3' | null;
  confidenceScore: number;
  status: 'OPEN' | 'CLOSED_TP1' | 'CLOSED_TP2' | 'CLOSED_SL' | 'CLOSED_TIME' | 'CLOSED_MANUAL';
  currentPrice: number | null;
  peakPrice: number | null;
  trailingStopPrice: number | null;
  remainingPercent: number;
  realizedPnlSOL: number;
}

const DEFAULT_BALANCE = 2;

export async function getOrCreateDemoWallet(userId: string): Promise<DemoWallet> {
  const res = await db.execute(
    `SELECT * FROM demo_wallets WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  if (res.rows.length === 0) {
    await db.execute(
      `INSERT INTO demo_wallets (user_id, virtual_balance, initial_balance, locked_in_positions, total_realized_pnl, total_trades, win_count, reset_count, created_at)
       VALUES (?, ?, ?, 0, 0, 0, 0, 0, ?)`,
      [userId, DEFAULT_BALANCE, DEFAULT_BALANCE, Date.now()],
    );
    return {
      userId,
      virtualBalance: DEFAULT_BALANCE,
      initialBalance: DEFAULT_BALANCE,
      lockedInPositions: 0,
      availableBalance: DEFAULT_BALANCE,
    };
  }
  const row = res.rows[0] as any;
  return {
    userId,
    virtualBalance: Number(row.virtual_balance ?? 0),
    initialBalance: Number(row.initial_balance ?? 0),
    lockedInPositions: Number(row.locked_in_positions ?? 0),
    availableBalance: Number(row.virtual_balance ?? 0) - Number(row.locked_in_positions ?? 0),
  };
}

export async function resetDemoWallet(userId: string): Promise<void> {
  const now = Date.now();
  await db.execute(
    `UPDATE demo_wallets
     SET virtual_balance = ?, initial_balance = ?, locked_in_positions = 0,
         total_realized_pnl = 0, total_trades = 0, win_count = 0,
         reset_count = COALESCE(reset_count, 0) + 1,
         last_reset_at = ?, updated_at = ?
     WHERE user_id = ?`,
    [DEFAULT_BALANCE, DEFAULT_BALANCE, now, now, userId],
  );
}

export async function getDexScreenerPrice(mint: string): Promise<number> {
  const meta = await SolscanClient.getTokenMeta(mint);
  return meta?.priceUsd ?? 0;
}

export function calculateSimulatedSlippage(liquidityUSD: number | null | undefined): number {
  const liq = liquidityUSD ?? 0;
  if (liq < 10_000) return 0.015 + Math.random() * 0.01;
  if (liq < 50_000) return 0.008 + Math.random() * 0.007;
  if (liq < 200_000) return 0.003 + Math.random() * 0.005;
  return 0.001 + Math.random() * 0.003;
}

export function calculateDemoFee(sizeSOL: number): number {
  return sizeSOL * 0.006;
}

export async function executeDemoBuy(params: {
  userId: string;
  tokenMint: string;
  tokenName?: string | null;
  triggerLogic?: 'L1' | 'L2' | 'L3' | null;
  confidenceScore: number;
}): Promise<void> {
  const wallet = await getOrCreateDemoWallet(params.userId);
  if (wallet.availableBalance <= 0) {
    logger.warn({ userId: params.userId }, 'Demo wallet has no available balance');
    return;
  }

  const meta = await SolscanClient.getTokenMeta(params.tokenMint);
  const price = meta?.priceUsd ?? 0;
  if (!price || price <= 0) {
    logger.warn({ mint: params.tokenMint }, 'Demo buy skipped — missing price');
    return;
  }

  const positionSize = Math.max(0.05, wallet.availableBalance * 0.05);
  const slippage = calculateSimulatedSlippage(meta?.liquidity ?? null);
  const actualEntryPrice = price * (1 + slippage);
  const fee = calculateDemoFee(positionSize);

  const now = Date.now();

  await db.execute(
    `INSERT INTO demo_positions
      (user_id, token_mint, token_name, entry_price, entry_time, size_sol,
       trigger_logic, confidence_score, status, current_price, peak_price,
       remaining_percent, realized_pnl_sol, simulated_slippage, simulated_fee, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, 100, 0, ?, ?, ?)`,
    [
      params.userId,
      params.tokenMint,
      params.tokenName ?? null,
      actualEntryPrice,
      now,
      positionSize,
      params.triggerLogic ?? null,
      params.confidenceScore,
      actualEntryPrice,
      actualEntryPrice,
      slippage,
      fee,
      now,
    ],
  );

  await db.execute(
    `UPDATE demo_wallets
     SET locked_in_positions = locked_in_positions + ?, updated_at = ?
     WHERE user_id = ?`,
    [positionSize, now, params.userId],
  );
}

export async function monitorDemoPositions(userId: string): Promise<void> {
  const res = await db.execute(
    `SELECT * FROM demo_positions WHERE user_id = ? AND status = 'OPEN'`,
    [userId],
  );
  const rows = res.rows as any[];
  for (const row of rows) {
    const mint = row.token_mint as string;
    const price = await getDexScreenerPrice(mint);
    if (!price || price <= 0) continue;

    const entry = Number(row.entry_price);
    const size = Number(row.size_sol);
    const tp1 = Number(row.tp1_percent ?? 30);
    const tp2 = Number(row.tp2_percent ?? 80);
    const sl = Number(row.sl_percent ?? 20);
    const timeExit = Number(row.time_exit_hours ?? 4);

    const gainPct = (price - entry) / entry * 100;
    const now = Date.now();
    const ageHours = (now - Number(row.entry_time)) / 3_600_000;

    // Update current/peak price
    const peak = Math.max(Number(row.peak_price ?? entry), price);
    await db.execute(
      `UPDATE demo_positions
       SET current_price = ?, peak_price = ?, updated_at = ?
       WHERE id = ?`,
      [price, peak, now, row.id],
    );

    // Simple exit rules for now: SL, TP2, time-based
    if (gainPct <= -sl) {
      const pnl = (price - entry) * size;
      await closeDemoPosition(row.id, userId, 'CLOSED_SL', price, pnl, size, now);
    } else if (gainPct >= tp2) {
      const pnl = (price - entry) * size;
      await closeDemoPosition(row.id, userId, 'CLOSED_TP2', price, pnl, size, now);
    } else if (ageHours > timeExit && Math.abs(gainPct) < 10) {
      const pnl = (price - entry) * size;
      await closeDemoPosition(row.id, userId, 'CLOSED_TIME', price, pnl, size, now);
    }
  }
}

export async function closeDemoPosition(
  id: number,
  userId: string,
  reason: 'CLOSED_TP1' | 'CLOSED_TP2' | 'CLOSED_SL' | 'CLOSED_TIME' | 'CLOSED_MANUAL',
  closePrice: number,
  pnlSol: number,
  sizeSol: number,
  now: number,
): Promise<void> {
  await db.execute(
    `UPDATE demo_positions
     SET status = ?, close_price = ?, close_time = ?, close_reason = ?, realized_pnl_sol = realized_pnl_sol + ?,
         remaining_percent = 0, unrealized_pnl_sol = 0
     WHERE id = ?`,
    [reason, closePrice, now, reason, pnlSol, id],
  );

  await db.execute(
    `UPDATE demo_wallets
     SET virtual_balance = virtual_balance + ?,
         locked_in_positions = locked_in_positions - ?,
         total_realized_pnl = total_realized_pnl + ?,
         total_trades = total_trades + 1,
         win_count = win_count + (CASE WHEN ? > 0 THEN 1 ELSE 0 END),
         updated_at = ?
     WHERE user_id = ?`,
    [pnlSol, sizeSol, pnlSol, pnlSol, now, userId],
  );
}

