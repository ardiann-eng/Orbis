// packages/shared-types/src/trade.ts

export type TradeStatus = 'open' | 'closed' | 'cancelled';
export type CloseReason =
  | 'stop_loss'
  | 'take_profit_1'
  | 'take_profit_2'
  | 'trailing_stop'
  | 'time_exit'
  | 'cascade_stop'
  | 'manual'
  | 'emergency_stop';

export interface Position {
  id?: number;
  userId: string;
  ca: string;
  status: TradeStatus;
  entryPrice: number;
  entryAmountSol: number;
  entryTx: string | null;
  currentPrice: number | null;
  unrealizedPnl: number | null;
  realizedPnl: number | null;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  cascadeStopCount: number;
  openedAt: number;   // Unix ms
  closedAt: number | null;
  closeReason: CloseReason | null;
}

export interface TradeHistory extends Position {
  pnlPct: number | null;
  logicsTriggered: string | null;
  confidenceScore: number | null;
}

export interface BotConfig {
  userId: string;
  logic1Enabled: boolean;
  logic2Enabled: boolean;
  logic3Enabled: boolean;
  minConfidenceScore: number;
  minUniqueChannels: number;
  maxTradesPerDay: number;
  maxExposureSol: number;
  drawdownLimitPct: number;
  stopLossPct: number;
  takeProfitPct: number;
  minLiquidityUsd: number;
  minHolderCount: number;
  maxTop10HolderPct: number;
  blacklistedTokens: string[];
  isBotActive: boolean;
  updatedAt: number | null;
}
