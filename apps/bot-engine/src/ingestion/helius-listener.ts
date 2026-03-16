// apps/bot-engine/src/ingestion/helius-listener.ts
// Helius is now ONLY used for:
//  1. fetchTokenSnapshotsBatch — batch token metadata (still needed for bonding curve cache pre-warm)
//  2. Webhook / real-time notifications (external, not in this file)
//
// Holder distribution, first buyer analysis, and single snapshot
// have been migrated to SolscanClient (see solscan-client.ts).

import { logger } from '../utils/logger';
import { redis } from '../utils/redis-client';
import type { TokenSnapshot } from '@orbis/shared-types';

export class HeliusClient {

  /**
   * Batch token metadata fetch (5 credits per 100 tokens).
   * Used by the queue's batch pre-warm optimization.
   * Still using Helius because pump-portal integration relies on
   * raw account data for bonding curve progress.
   */
  static async fetchTokenSnapshotsBatch(cas: string[]): Promise<Record<string, TokenSnapshot>> {
    try {
      const apiKey = process.env.HELIUS_API_KEY;
      const res = await fetch(
        `https://api.helius.xyz/v0/token-metadata?api-key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mintAccounts: cas, includeOffChain: true }),
        }
      );

      if (!res.ok) {
        logger.warn({ status: res.status }, 'Helius batch API fetch error');
        return {};
      }

      const data = await res.json() as any[];
      const results: Record<string, TokenSnapshot> = {};

      for (const token of data) {
        if (!token.account) continue;
        const ca = token.account;
        const snapshot: TokenSnapshot = {
          ca,
          creator: token.authorities?.[0]?.address ?? null,
          priceUsd: token.onChainData?.price ?? 0,
          priceChange5m: 0,
          priceChange1h: 0,
          volume5m: 0,
          volumeAvg24h: token.onChainData?.volume24h ?? 0,
          holderCount: token.onChainData?.holderCount ?? 0,
          holderGrowthRate: 0,
          marketCapUsd: token.onChainData?.marketCap ?? 0,
          liquidityUsd: token.onChainData?.liquidity ?? 0,
          bondingCurvePct: null,
          timestamp: Date.now(),
        };
        results[ca] = snapshot;
        await redis.set(`helius:snapshot:${ca}`, snapshot, { ex: 86400 });
      }

      return results;
    } catch (err) {
      logger.warn({ err }, 'fetchTokenSnapshotsBatch failed');
      return {};
    }
  }
}
