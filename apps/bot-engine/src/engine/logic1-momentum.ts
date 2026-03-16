// apps/bot-engine/src/engine/logic1-momentum.ts
import type { TokenSnapshot, Logic1Signal } from '@orbis/shared-types';

interface Logic1Config {
  minPriceChange5m: number;   // e.g. 0.05 (5%)
  minVolumeChange:  number;   // e.g. 1.5 (150% of avg)
  maxMarketCapUsd:  number;   // e.g. 5_000_000
  minMarketCapUsd:  number;   // e.g. 10_000
}

const DEFAULT_CONFIG: Logic1Config = {
  minPriceChange5m: 0.05,
  minVolumeChange:  1.5,
  maxMarketCapUsd:  5_000_000,
  minMarketCapUsd:  10_000,
};

/**
 * Logic 1 — Price Momentum
 * Triggers when: priceChange5m > threshold AND volume is rising.
 *
 * Score breakdown:
 *  - price momentum (60% weight)
 *  - volume momentum (25% weight)
 *  - holder growth (15% weight)
 */
export function evaluateLogic1(
  snapshot: TokenSnapshot,
  config: Partial<Logic1Config> = {}
): Logic1Signal | null {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Market cap gate
  if (
    snapshot.marketCapUsd < cfg.minMarketCapUsd ||
    snapshot.marketCapUsd > cfg.maxMarketCapUsd
  ) {
    return null;
  }

  // Must have positive 5-minute price movement
  if (snapshot.priceChange5m < cfg.minPriceChange5m) return null;

  // Must have volume above average
  const volumeRatio = snapshot.volumeAvg24h > 0
    ? snapshot.volume5m / (snapshot.volumeAvg24h / 288) // 5-min slice of 24h avg
    : 0;

  if (volumeRatio < cfg.minVolumeChange) return null;

  // ── Score calculation ──────────────────────────────────────
  // Price score: 0–1, maxes at 30% gain
  const priceScore = Math.min(1, snapshot.priceChange5m / 0.30);

  // Volume score: 0–1, maxes at 5x avg
  const volumeScore = Math.min(1, (volumeRatio - cfg.minVolumeChange) / (5 - cfg.minVolumeChange));

  // Holder growth: 0–1, maxes at 20% per hour
  const holderScore = Math.min(1, Math.max(0, snapshot.holderGrowthRate / 0.20));

  const score = priceScore * 0.60 + volumeScore * 0.25 + holderScore * 0.15;

  return {
    ca: snapshot.ca,
    priceChange5m: snapshot.priceChange5m,
    priceChange1h: snapshot.priceChange1h,
    volumeChange: volumeRatio,
    holderGrowthRate: snapshot.holderGrowthRate,
    marketCapUsd: snapshot.marketCapUsd,
    score: Math.min(1, Math.max(0, score)),
    timestamp: Date.now(),
  };
}
