// packages/shared-types/src/score.ts

export type WarningFlag =
  | 'DANGER'       // Hard skip — rug/honeypot/extreme concentration
  | 'CAUTION'      // Watchlist — some weak indicators
  | 'GO'           // All filters pass, high confidence
  | 'SPIKE'        // Volume spike detected (Logic 2)
  | 'BUZZ'         // CA trending in 3+ Telegram channels (Logic 3)
  | 'EXTREME'      // CA trending in 8+ channels — manual review
  | 'SMART_MONEY'  // Known smart money wallet entered
  | 'DUPLICATE'    // Similar name/image to a previous token
  | 'TRIPLE';      // All 3 logics confirm — priority entry

export interface TokenScore {
  ca: string;

  // Sub-scores (each 0–1)
  momentumScore: number;    // Logic 1  — weight 0.25
  volumeScore: number;      // Logic 2  — weight 0.20
  socialScore: number;      // Logic 3  — weight 0.30
  narrativeScore: number;   // Keyword  — weight 0.10
  safetyScore: number;      // Filters  — weight 0.15

  // Final
  confidenceScore: number;  // Weighted average, 0 if DANGER

  warningFlags: WarningFlag[];
  logicsTriggered: ('logic1' | 'logic2' | 'logic3')[];

  // Routing
  decision: 'BUY' | 'SKIP' | 'WATCHLIST';
  skipReason: string | null;

  timestamp: number;
}

// Weights — exported so API can show breakdown
export const SCORE_WEIGHTS = {
  momentum:  0.25,
  volume:    0.20,
  social:    0.30,
  narrative: 0.10,
  safety:    0.15,
  tripleBonus: 0.10,
} as const;
