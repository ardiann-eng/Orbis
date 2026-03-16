// apps/bot-engine/src/engine/logic3-telegram.ts
import type { Logic3Signal } from '@orbis/shared-types';
import { db } from '../utils/turso-client';
import { logger } from '../utils/logger';

interface Logic3Config {
  minUniqueChannels: number;   // default 3
  timeWindowSeconds: number;   // default 3600 (1 hour)
}

const DEFAULT_CONFIG: Logic3Config = {
  minUniqueChannels: 3,
  timeWindowSeconds: 3600,
};

interface ChannelRow {
  channel_id: string;
  channel_name: string | null;
  weight: number;
  mention_count: number;
}

/**
 * Logic 3 — Telegram CA Mention
 * Aggregates ca_mentions_log for a given CA within the time window.
 * Joins with telegram_channels for per-channel weight.
 *
 * Score:
 *   weighted_mentions = Σ (channel.weight × mention_count)
 *   normalized:  0 at 3 channels, 1.0 at 8+ channels
 *   EXTREME flag: 8+ unique channels (set in scorer.ts)
 */
export async function evaluateLogic3(
  ca: string,
  config: Partial<Logic3Config> = {}
): Promise<Logic3Signal | null> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const since = Date.now() - cfg.timeWindowSeconds * 1000;

  try {
    const result = await db.execute(
      `SELECT
         m.channel_id,
         c.channel_name,
         COALESCE(c.weight, 1.0) AS weight,
         COUNT(*) AS mention_count
       FROM ca_mentions_log m
       LEFT JOIN telegram_channels c ON c.channel_id = m.channel_id
       WHERE m.ca = ?
         AND m.mentioned_at >= ?
         AND (c.is_active IS NULL OR c.is_active = 1)
       GROUP BY m.channel_id
       ORDER BY mention_count DESC`,
      [ca, since]
    );

    const channels = result.rows as any[];
    const uniqueChannelCount = channels.length;

    if (uniqueChannelCount < cfg.minUniqueChannels) return null;

    const totalMentions = channels.reduce((s, c) => s + c.mention_count, 0);

    // Weighted score: each channel contributes weight × normalized_mentions
    const weightedSum = channels.reduce(
      (s, c) => s + c.weight * Math.min(1, c.mention_count / 5), // cap per-channel at 5 mentions
      0
    );
    const maxPossibleWeight = channels.reduce((s, c) => s + c.weight, 0);
    const rawScore = maxPossibleWeight > 0 ? weightedSum / maxPossibleWeight : 0;

    // Bonus for more unique channels: 3 → 0.3, 8+ → 1.0
    const channelBonus = Math.min(1, (uniqueChannelCount - cfg.minUniqueChannels) / (8 - cfg.minUniqueChannels));
    const score = Math.min(1, rawScore * 0.5 + channelBonus * 0.5);

    return {
      ca,
      uniqueChannelCount,
      totalMentions,
      channels: channels.map((c) => ({
        channelId: c.channel_id,
        channelName: c.channel_name,
        weight: c.weight,
        mentionCount: c.mention_count,
      })),
      timeWindow: cfg.timeWindowSeconds,
      score,
      timestamp: Date.now(),
    };
  } catch (err) {
    logger.error({ err, ca }, 'Logic3 evaluation failed');
    return null;
  }
}
