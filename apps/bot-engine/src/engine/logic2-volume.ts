// apps/bot-engine/src/engine/logic2-volume.ts
import type { TokenSnapshot, Logic2Signal } from '@orbis/shared-types';

interface Logic2Config {
  minSpikeMultiplier: number;   // default 3.0
  timeWindowSeconds:  number;   // default 300 (5 min)
}

const DEFAULT_CONFIG: Logic2Config = {
  minSpikeMultiplier: 3.0,
  timeWindowSeconds:  300,
};

/**
 * Logic 2 — Volume Spike
 * Triggers when: current 5-min volume > 3x the expected 5-min slice of 24h average.
 *
 * Score:
 *  - spikeMultiplier normalized 3x–15x → 0–1
 */
export function evaluateLogic2(
  snapshot: TokenSnapshot,
  config: Partial<Logic2Config> = {}
): Logic2Signal | null {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // avgVolume24h represents 24h average — convert to per-5min
  const avgPer5m = snapshot.volumeAvg24h / 288; // 288 × 5min periods per day
  if (avgPer5m <= 0) return null;

  const spikeMultiplier = snapshot.volume5m / avgPer5m;
  if (spikeMultiplier < cfg.minSpikeMultiplier) return null;

  // Score: 3x = 0.0, 15x = 1.0 (linear)
  const score = Math.min(1, Math.max(0, (spikeMultiplier - cfg.minSpikeMultiplier) / (15 - cfg.minSpikeMultiplier)));

  return {
    ca: snapshot.ca,
    currentVolume: snapshot.volume5m,
    avgVolume24h: snapshot.volumeAvg24h,
    spikeMultiplier,
    timeWindow: cfg.timeWindowSeconds,
    score,
    timestamp: Date.now(),
  };
}
