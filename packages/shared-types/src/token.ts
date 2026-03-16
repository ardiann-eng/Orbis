// packages/shared-types/src/token.ts

export interface Token {
  id?: number;
  ca: string;
  name: string | null;
  symbol: string | null;
  imageHash: string | null;
  creatorWallet: string | null;
  createdAt: number;       // Unix timestamp ms
  firstSeenAt: number;
  marketCapUsd: number | null;
  liquidityUsd: number | null;
  volume24h: number | null;
  holderCount: number | null;
  isPumpFun: boolean;
  metadata: Record<string, unknown> | null;
  updatedAt: number | null;
}

export interface TokenSnapshot {
  ca: string;
  creator: string | null;  // Developer wallet
  priceUsd: number;
  priceChange5m: number;   // %
  priceChange1h: number;   // %
  volume5m: number;
  volumeAvg24h: number;
  holderCount: number;
  holderGrowthRate: number; // % per hour
  marketCapUsd: number;
  liquidityUsd: number;
  bondingCurvePct: number | null; // Pump.fun bonding curve progress
  timestamp: number;
}

export interface HolderDistribution {
  ca: string;
  topHolders: Array<{ address: string; share: number }>;
  top10Pct: number;
  uniqueHolders: number;
}
