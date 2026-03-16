// packages/scoring-lib/src/index.ts
// Public API for the scoring library — re-exports types and formula
// so apps/web API routes can show score breakdowns without importing bot-engine directly.

export type {
  TokenScore,
  WarningFlag,
} from '@orbis/shared-types';

/**
 * Pure function: compute confidence score from sub-scores.
 * No DB/Redis side effects — safe to call from API routes.
 */
export function computeConfidence(scores: {
  momentumScore:  number;
  volumeScore:    number;
  socialScore:    number;
  narrativeScore: number;
  safetyScore:    number;
  isTriple?:      boolean;
}): number {
  const weights = {
    momentum:  0.25,
    volume:    0.20,
    social:    0.30,
    narrative: 0.10,
    safety:    0.15,
    triple:    0.10,
  };

  const base =
    clamp(scores.momentumScore)  * weights.momentum  +
    clamp(scores.volumeScore)    * weights.volume    +
    clamp(scores.socialScore)    * weights.social    +
    clamp(scores.narrativeScore) * weights.narrative +
    clamp(scores.safetyScore)    * weights.safety;

  return clamp(base + (scores.isTriple ? weights.triple : 0));
}

function clamp(v: number): number {
  return Math.min(1, Math.max(0, v));
}
