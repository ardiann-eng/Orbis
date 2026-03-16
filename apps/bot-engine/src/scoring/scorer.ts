// apps/bot-engine/src/scoring/scorer.ts
import type { TokenSnapshot, HolderDistribution, TokenScore, Logic1Signal, Logic2Signal, Logic3Signal } from '@orbis/shared-types';
import type { BotConfig } from '@orbis/shared-types';
import { runFilters } from './filters';
import { calculateConfidence } from './confidence';
import { db } from '../utils/turso-client';
import { redis, CacheKeys } from '../utils/redis-client';
import { logger } from '../utils/logger';

const SCORE_CACHE_TTL = 60; // seconds

export interface ScorerInput {
  snapshot: TokenSnapshot;
  holders: HolderDistribution;
  logic1?: Logic1Signal;
  logic2?: Logic2Signal;
  logic3?: Logic3Signal;
  config: BotConfig;
  isNewCoin?: boolean;
}

/**
 * Full scoring pipeline for a token.
 * Checks cache first, then runs filters + confidence calc.
 */
export async function scoreToken(input: ScorerInput): Promise<TokenScore> {
  const { snapshot, holders, logic1, logic2, logic3, config } = input;
  const ca = snapshot.ca;

  // Cache check
  const cached = await redis.get<TokenScore>(CacheKeys.tokenScore(ca));
  if (cached) {
    logger.debug({ ca }, 'Score cache hit');
    return cached;
  }

  // ── Risk Filters ───────────────────────────────────────────
  const filterResult = await runFilters(snapshot, holders, {
    minLiquidityUsd: config.minLiquidityUsd,
    minHolderCount: config.minHolderCount,
    maxTop10HolderPct: config.maxTop10HolderPct,
    blacklistedTokens: config.blacklistedTokens,
    isNewCoin: input.isNewCoin,
  });

  const logicsTriggered: TokenScore['logicsTriggered'] = [];
  if (logic1) logicsTriggered.push('logic1');
  if (logic2) logicsTriggered.push('logic2');
  if (logic3) logicsTriggered.push('logic3');

  // ── Narrative Score ────────────────────────────────────────
  const narrativeScore = await computeNarrativeScore(snapshot.ca);

  // ── Logic scores as sub-scores ─────────────────────────────
  const momentumScore = logic1?.score ?? 0;
  const volumeScore   = logic2?.score ?? 0;
  const socialScore   = logic3?.score ?? 0;

  // ── Combine warning flags ──────────────────────────────────
  const flags = [...filterResult.flags];
  if (logic2 && logic2.spikeMultiplier > 3)  flags.push('SPIKE');
  if (logic3 && logic3.uniqueChannelCount >= 8) flags.push('EXTREME');
  else if (logic3 && logic3.uniqueChannelCount >= 3) flags.push('BUZZ');

  // ── Final confidence ───────────────────────────────────────
  const score = calculateConfidence({
    ca,
    momentumScore,
    volumeScore,
    socialScore,
    narrativeScore,
    safetyScore: filterResult.safetyScore,
    warningFlags: flags,
    logicsTriggered,
    skipReason: filterResult.reasons[0] ?? null,
  });

  // Cache score
  await redis.set(CacheKeys.tokenScore(ca), score, { ex: SCORE_CACHE_TTL });

  // Persist decision
  try {
    await db.execute(
      `INSERT INTO decisions_log
         (ca, decision, reason, confidence_score, logic_triggered, warning_flags, executed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ca,
        score.decision,
        score.skipReason ?? filterResult.reasons.join('; '),
        score.confidenceScore,
        JSON.stringify(logicsTriggered),
        JSON.stringify(score.warningFlags),
        Date.now(),
      ]
    );
  } catch (err) {
    logger.debug({ ca, err }, 'Failed to insert decisions_log (likely SQLITE_BUSY)');
  }

  logger.info({
    ca,
    decision: score.decision,
    confidence: score.confidenceScore.toFixed(3),
    flags: score.warningFlags,
  }, 'Token scored');

  return score;
}

// ── Narrative score helper ──────────────────────────────────────
async function computeNarrativeScore(ca: string): Promise<number> {
  try {
    // Get token name/symbol from tokens_history
    const tokenRow = await db.execute(
      `SELECT name, symbol FROM tokens_history WHERE ca = ? LIMIT 1`,
      [ca]
    );
    if (tokenRow.rows.length === 0) return 0;
    const { name, symbol } = tokenRow.rows[0] as any;
    const safeName = typeof name === 'string' ? name : '';
    const safeSymbol = typeof symbol === 'string' ? symbol : '';
    const text = `${safeName} ${safeSymbol}`.toLowerCase();

    // Fetch active narrative keywords
    const kwRows = await db.execute(
      `SELECT keyword, multiplier FROM narrative_config WHERE status = 'active'`
    );

    let maxScore = 0;
    for (const row of kwRows.rows as any[]) {
      if (text.includes(row.keyword.toLowerCase())) {
        const s = Math.min(1, (row.multiplier - 0.8) / 0.6); // normalize ~0.8–1.4 → 0–1
        if (s > maxScore) maxScore = s;
      }
    }
    return maxScore;
  } catch {
    return 0;
  }
}
