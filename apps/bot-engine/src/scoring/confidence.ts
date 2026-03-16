// apps/bot-engine/src/scoring/confidence.ts
import { SCORE_WEIGHTS, type TokenScore, type WarningFlag } from '@orbis/shared-types';

interface SubScores {
  momentumScore: number;   // Logic 1
  volumeScore: number;     // Logic 2
  socialScore: number;     // Logic 3
  narrativeScore: number;  // Keyword match
  safetyScore: number;     // Filter result inverted penalty
}

interface ConfidenceInput extends SubScores {
  ca: string;
  warningFlags: WarningFlag[];
  logicsTriggered: ('logic1' | 'logic2' | 'logic3')[];
  skipReason: string | null;
}

/**
 * Calculate final weighted confidence score.
 *
 * Formula:
 *   base = momentum*0.25 + volume*0.20 + social*0.30 + narrative*0.10 + safety*0.15
 *   + 0.10 if TRIPLE (all 3 logics triggered)
 *   = 0.00 if DANGER flag present
 */
export function calculateConfidence(input: ConfidenceInput): TokenScore {
  const { ca, warningFlags, logicsTriggered, skipReason } = input;

  // Hard fail on DANGER
  if (warningFlags.includes('DANGER')) {
    return {
      ca,
      momentumScore: input.momentumScore,
      volumeScore: input.volumeScore,
      socialScore: input.socialScore,
      narrativeScore: input.narrativeScore,
      safetyScore: 0,
      confidenceScore: 0,
      warningFlags,
      logicsTriggered,
      decision: 'SKIP',
      skipReason: skipReason ?? 'DANGER flag detected',
      timestamp: Date.now(),
    };
  }

  const base =
    clamp(input.momentumScore)  * SCORE_WEIGHTS.momentum  +
    clamp(input.volumeScore)    * SCORE_WEIGHTS.volume    +
    clamp(input.socialScore)    * SCORE_WEIGHTS.social    +
    clamp(input.narrativeScore) * SCORE_WEIGHTS.narrative +
    clamp(input.safetyScore)    * SCORE_WEIGHTS.safety;

  // TRIPLE bonus
  const isTriple = logicsTriggered.length === 3;
  if (isTriple && !warningFlags.includes('TRIPLE')) {
    warningFlags.push('TRIPLE');
  }
  const confidenceScore = clamp(base + (isTriple ? SCORE_WEIGHTS.tripleBonus : 0));

  // Decision routing
  let decision: TokenScore['decision'];
  if (warningFlags.includes('EXTREME')) {
    // Manual review needed — watchlist
    decision = 'WATCHLIST';
  } else if (confidenceScore >= 0.65) {
    decision = 'BUY';
  } else if (confidenceScore >= 0.50 || warningFlags.includes('CAUTION')) {
    decision = 'WATCHLIST';
  } else {
    decision = 'SKIP';
  }

  return {
    ca,
    momentumScore: clamp(input.momentumScore),
    volumeScore:   clamp(input.volumeScore),
    socialScore:   clamp(input.socialScore),
    narrativeScore: clamp(input.narrativeScore),
    safetyScore:   clamp(input.safetyScore),
    confidenceScore,
    warningFlags,
    logicsTriggered,
    decision,
    skipReason: decision === 'SKIP' ? (skipReason ?? `Confidence ${confidenceScore.toFixed(2)} terlalu rendah`) : null,
    timestamp: Date.now(),
  };
}

function clamp(v: number): number {
  return Math.min(1, Math.max(0, v));
}
