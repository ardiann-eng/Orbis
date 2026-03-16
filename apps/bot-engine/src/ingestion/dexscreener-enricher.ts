// apps/bot-engine/src/ingestion/dexscreener-enricher.ts
// Fetches price/liquidity/volume from DexScreener (free, no API key)
// AND name/symbol/image/socials/creator from Helius DAS getAsset (free).
// Both are written back into tokens_history in a single json_patch update.

import { logger } from '../utils/logger';
import { db } from '../utils/turso-client';

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd: string | null;
  priceChange: { h24?: number } | null;
  volume: { h24?: number; h6?: number; m5?: number } | null;
  liquidity: { usd?: number } | null;
  fdv: number | null;
  marketCap: number | null;
}

interface DexScreenerResponse {
  pairs: DexScreenerPair[] | null;
}

/**
 * Fetch market data from DexScreener AND on-chain metadata from Helius DAS,
 * then write everything back into tokens_history in one json_patch update.
 * Non-blocking — errors are swallowed so the token pipeline never stalls.
 */
export async function enrichTokenFromDexScreener(ca: string): Promise<void> {
  try {
    // ── Fetch DexScreener + Helius in parallel ────────────────────────────
    const [dexResult, heliusResult] = await Promise.allSettled([
      fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`, {
        headers: { Accept: 'application/json' },
      }).then(r => r.ok ? r.json() as Promise<DexScreenerResponse> : Promise.reject(r.status)),

      (async () => {
        const apiKey = process.env.HELIUS_API_KEY;
        if (!apiKey) return null;
        const r = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 'orbis',
            method: 'getAsset',
            params: { id: ca },
          }),
        });
        if (!r.ok) return null;
        const j = await r.json() as { result: any; error?: any };
        return j.error ? null : j.result;
      })(),
    ]);

    // ── DexScreener extract ───────────────────────────────────────────────
    const dexData    = dexResult.status === 'fulfilled' ? dexResult.value : null;
    const heliusData = heliusResult.status === 'fulfilled' ? heliusResult.value : null;

    const solanaPairs = (dexData?.pairs ?? []).filter((p: DexScreenerPair) => p.chainId === 'solana');
    const bestPair    = solanaPairs.sort(
      (a: DexScreenerPair, b: DexScreenerPair) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
    )[0] ?? null;

    if (!bestPair && !heliusData) {
      logger.debug({ ca }, 'Enrichment: no data from DexScreener or Helius yet');
      return;
    }

    const marketCapUsd = bestPair?.marketCap ?? bestPair?.fdv ?? null;
    const liquidityUsd = bestPair?.liquidity?.usd ?? null;
    const volume24h    = bestPair?.volume?.h24 ?? null;
    const priceUsd     = bestPair?.priceUsd ? parseFloat(bestPair.priceUsd) : null;

    // ── Helius extract ────────────────────────────────────────────────────
    const heliusMeta: Record<string, unknown> = {};
    if (heliusData) {
      const meta  = heliusData?.content?.metadata ?? {};
      const links = heliusData?.content?.links ?? {};
      const files = heliusData?.content?.files ?? [];
      if (meta.name)           heliusMeta.name     = meta.name;
      if (meta.symbol)         heliusMeta.symbol   = meta.symbol;
      if (files[0]?.uri)       heliusMeta.imageUrl = files[0].uri;
      if (heliusData?.authorities?.[0]?.address)
                               heliusMeta.creator  = heliusData.authorities[0].address;
      if (links.twitter)       heliusMeta.twitter  = links.twitter;
      if (links.telegram)      heliusMeta.telegram = links.telegram;
      if (links.website)       heliusMeta.website  = links.website;
    }

    // ── Single DB write ───────────────────────────────────────────────────
    const metadataPatch = JSON.stringify({
      priceUsd,
      pairAddress: bestPair?.pairAddress ?? null,
      ...heliusMeta,
    });

    await db.execute(
      `UPDATE tokens_history
       SET market_cap_usd = COALESCE(?, market_cap_usd),
           liquidity_usd  = COALESCE(?, liquidity_usd),
           volume_24h     = COALESCE(?, volume_24h),
           metadata       = json_patch(COALESCE(metadata, '{}'), ?),
           updated_at     = ?
       WHERE ca = ?`,
      [marketCapUsd, liquidityUsd, volume24h, metadataPatch, Date.now(), ca]
    );

    logger.debug({ ca, marketCapUsd, liquidityUsd, heliusMeta }, 'Token enrichment written to DB');

  } catch (err: any) {
    logger.debug({ ca, err: err.message }, 'Token enrichment failed (non-fatal)');
  }
}

/**
 * Backfill enrichment for tokens already in DB with NULL market data.
 * Call this once on startup to fill historical gaps.
 */
export async function backfillNullTokens(limit = 50): Promise<void> {
  try {
    const result = await db.execute(
      `SELECT ca FROM tokens_history 
       WHERE market_cap_usd IS NULL 
       AND created_at > ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [Date.now() - 7 * 24 * 60 * 60 * 1000, limit] // last 7 days only
    );

    const cas = (result.rows as any[]).map(r => r.ca as string);
    logger.info({ count: cas.length }, 'DexScreener backfill starting');

    for (const ca of cas) {
      await enrichTokenFromDexScreener(ca);
      // 200ms delay between calls — DexScreener is rate-limited at ~30-60 req/min
      await new Promise(r => setTimeout(r, 200));
    }

    logger.info({ count: cas.length }, 'DexScreener backfill complete');
  } catch (err: any) {
    logger.warn({ err: err.message }, 'DexScreener backfill failed');
  }
}
