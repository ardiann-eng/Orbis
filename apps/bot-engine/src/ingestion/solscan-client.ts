// apps/bot-engine/src/ingestion/solscan-client.ts
// Solscan Pro API v2.0 — used for tx analysis, defi-activities, account txs.
// NOTE: getTokenMeta + getTokenHolders now use Helius DAS + DexScreener (free)
//       because Solscan /token/meta and /token/holders require a paid plan (401).
// NEVER logs the API key. All responses cached in Redis.

import { logger } from '../utils/logger';
import { redis } from '../utils/redis-client';

// ─── Base Config ────────────────────────────────────────────────────────────

const BASE_URL = 'https://pro-api.solscan.io/v2.0';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;
const LOOP_DELAY_MS = 100;

// TTLs (seconds)
const TTL = {
  tokenMeta:        5 * 60,   // 5 min
  tokenHolders:     2 * 60,   // 2 min
  defiActivities:  10 * 60,   // 10 min — first buyers rarely change
  accountTxs:       5 * 60,   // 5 min
  txDetail:        30 * 60,   // 30 min — tx detail is immutable
} as const;

// ─── TypeScript Interfaces ───────────────────────────────────────────────────

/** Legacy shape kept for backward compat (getFirstBuyers etc still reference it) */
export interface SolscanTokenMeta {
  address: string;
  name: string;
  symbol: string;
  icon: string | null;
  decimals: number;
  holder: number;
  creator: string | null;
  create_tx: string | null;
  created_time: number;
  first_mint_tx: string | null;
  mint_authority: string | null;
  freeze_authority: string | null;
  supply: string;
  price: number;
  volume_24h: number;
  market_cap: number;
  market_cap_rank: number | null;
  price_change_24h: number | null;
}

/** Unified token metadata from Solscan + DexScreener (replaces legacy SolscanTokenMeta) */
export interface TokenMetaResult {
  // From Solscan /token/meta
  name:        string | null;
  symbol:      string | null;
  imageUrl:    string | null;
  creator:     string | null;
  twitter:     string | null;
  telegram:    string | null;
  website:     string | null;
  // From DexScreener
  priceUsd:    number | null;
  mcap:        number | null;
  liquidity:   number | null;
  volume24h:   number | null;
  priceChange24h: number | null;
  pairAddress: string | null;
}

/** Single top-holder entry from Helius RPC getTokenLargestAccounts */
export interface TopHolderResult {
  rank:       number;
  address:    string;   // token account address
  owner:      string;   // wallet address (actual holder) — same as address from RPC
  amount:     number;   // uiAmount
  percentage: string;   // e.g. "4.23"
  percent_of_supply: number; // fraction 0–1, for toHolderDistribution()
}

export interface SolscanHolder {
  address: string;       // token account address
  owner: string;         // wallet address (actual holder)
  amount: string;        // raw amount
  decimals: number;
  rank: number;
  percent_of_supply: number; // e.g. 0.045 = 4.5%
}

export interface SolscanHoldersResponse {
  total: number;
  items: SolscanHolder[];
}

export interface SolscanDefiActivity {
  block_id: number;
  trans_id: string;
  block_time: number;
  activity_type: string;
  from_address: string;       // buyer wallet
  to_address: string | null;
  token_address: string;
  token_decimals: number;
  amount: number;
  routers: Record<string, unknown> | null;
  usd_amount: number | null;
}

export interface SolscanDefiActivitiesResponse {
  total: number;
  items: SolscanDefiActivity[];
}

export interface SolscanAccountTransaction {
  slot: number;
  signature: string;
  block_time: number;
  status: 'success' | 'fail';
  fee: number;
  lamport: number;
  main_actions: string[];
}

export interface SolscanTransactionDetail {
  block_id: number;
  fee: number;
  block_time: number;
  status: 'success' | 'fail';
  signer: string[];
  account_keys: string[];
  sol_bal_change: Array<{ address: string; pre_balance: number; post_balance: number; change_amount: number }>;
  token_bal_change: Array<{ address: string; token_address: string; pre_amount: string; post_amount: string; change_amount: string }>;
  inner_instructions: unknown[];
  log_messages: string[];
}

// ─── Internal HTTP Helper ────────────────────────────────────────────────────

async function solscanFetch<T>(endpoint: string): Promise<T> {
  const apiKey = process.env.SOLSCAN_API_KEY;
  if (!apiKey) throw new Error('SOLSCAN_API_KEY is not set');

  const url = `${BASE_URL}${endpoint}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await delay(RETRY_DELAY_MS * attempt);
      logger.debug({ endpoint, attempt }, 'Solscan retry');
    }

    try {
      const res = await fetch(url, {
        headers: {
          'token': apiKey,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        const err = new Error(`Solscan HTTP ${res.status} for ${endpoint}: ${body.slice(0, 200)}`);
        if (res.status === 429 || res.status >= 500) {
          lastError = err;
          continue; // retry on rate limit / server error
        }
        throw err; // 4xx (except 429) — don't retry
      }

      const json = await res.json() as { success: boolean; data: T; errors?: unknown };
      if (!json.success) {
        throw new Error(`Solscan API error for ${endpoint}: ${JSON.stringify(json.errors)}`);
      }
      return json.data;

    } catch (err: any) {
      lastError = err;
      if (err.message?.includes('429') || err.message?.includes('5')) continue;
      throw err;
    }
  }

  throw lastError ?? new Error(`Solscan request failed after ${MAX_RETRIES} retries: ${endpoint}`);
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Free API Helpers ────────────────────────────────────────────────────────

// NOTE: Previously this file used free Helius DAS / RPC for token meta + holders.
// Sesuai requirement terbaru, kita sekarang hanya pakai Solscan + DexScreener di bawah.

/** DexScreener free endpoint for price/liquidity/volume/mcap */
async function fetchDexScreenerMeta(mint: string): Promise<any> {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`DexScreener HTTP ${res.status}`);
  return res.json();
}

// ─── SolscanClient ───────────────────────────────────────────────────────────

export class SolscanClient {

  // ── 1. Token Metadata ───────────────────────────────────────────────────
  // Solscan /token/meta (butuh SOLSCAN_API_KEY)
  //   + DexScreener (price/mcap/liquidity/volume)
  static async getTokenMeta(mint: string): Promise<TokenMetaResult | null> {
    const cacheKey = `token:meta:${mint}`;
    try {
      const cached = await redis.get<TokenMetaResult>(cacheKey);
      if (cached) {
        logger.debug({ mint }, 'Token meta — cache hit');
        return cached;
      }

      // Ambil metadata dari Solscan + market data dari DexScreener (partial failure OK)
      const [solscanSettled, dexSettled] = await Promise.allSettled([
        solscanFetch<SolscanTokenMeta>(`/token/meta?address=${mint}`),
        fetchDexScreenerMeta(mint),
      ]);

      const solscan = solscanSettled.status === 'fulfilled' ? solscanSettled.value : null;
      const dex     = dexSettled.status    === 'fulfilled' ? dexSettled.value    : null;

      if (solscanSettled.status === 'rejected') {
        logger.warn({ mint, err: (solscanSettled.reason as any)?.message }, 'Solscan token/meta failed (partial)');
      }
      if (dexSettled.status === 'rejected') {
        logger.warn({ mint, err: (dexSettled.reason as any)?.message }, 'DexScreener meta failed (partial)');
      }

      // Pilih pair Solana terbaik dari DexScreener
      const solanaPairs: any[] = (dex?.pairs ?? []).filter((p: any) => p.chainId === 'solana');
      const bestPair = solanaPairs.sort(
        (a: any, b: any) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
      )[0] ?? null;

      const result: TokenMetaResult = {
        // Solscan fields
        name:        solscan?.name          ?? null,
        symbol:      solscan?.symbol        ?? null,
        imageUrl:    solscan?.icon          ?? null,
        creator:     solscan?.creator       ?? null,
        twitter:     null,
        telegram:    null,
        website:     null,
        // DexScreener fields
        priceUsd:       bestPair ? parseFloat(bestPair.priceUsd ?? '0') : null,
        mcap:           bestPair?.fdv                       ?? null,
        liquidity:      bestPair?.liquidity?.usd            ?? null,
        volume24h:      bestPair?.volume?.h24               ?? null,
        priceChange24h: bestPair?.priceChange?.h24          ?? null,
        pairAddress:    bestPair?.pairAddress               ?? null,
      };

      await redis.set(cacheKey, result, { ex: TTL.tokenMeta });
      logger.debug({ mint, symbol: result.symbol }, 'Token meta fetched via Solscan+DexScreener');
      return result;

    } catch (err: any) {
      logger.error({ mint, err: err.message }, 'getTokenMeta failed');
      return null;
    }
  }

  // ── 2. Token Holders ────────────────────────────────────────────────────
  // Solscan /token/holders (butuh SOLSCAN_API_KEY)
  // Return shape kompatibel dengan SolscanHoldersResponse sehingga toHolderDistribution() tetap bekerja.
  static async getTokenHolders(
    mint: string,
    _page = 1,
    _pageSize = 20
  ): Promise<SolscanHoldersResponse | null> {
    const cacheKey = `token:holders:${mint}`;
    try {
      const cached = await redis.get<SolscanHoldersResponse>(cacheKey);
      if (cached) {
        logger.debug({ mint }, 'Token holders — cache hit');
        return cached;
      }

      const data = await solscanFetch<SolscanHoldersResponse>(
        `/token/holders?address=${mint}&page=1&page_size=${_pageSize}`
      );

      const items = data.items ?? [];
      const normalized: SolscanHoldersResponse = {
        total: data.total ?? items.length,
        items,
      };

      await redis.set(cacheKey, normalized, { ex: TTL.tokenHolders });
      logger.debug({ mint, total: normalized.total }, 'Token holders fetched via Solscan');
      return normalized;

    } catch (err: any) {
      logger.error({ mint, err: err.message }, 'getTokenHolders failed');
      return null;
    }
  }

  // ── 3. First Buyers (DeFi Activities) ──────────────────────────────────
  // Replaces: Helius getTransactionHistory + manual buyer extraction
  // Sorted ascending by block_time = true first buyers. `from_address` is the buyer wallet.
  static async getFirstBuyers(mint: string, limit = 10): Promise<SolscanDefiActivity[]> {
    const cacheKey = `solscan:firstbuyers:${mint}:${limit}`;
    try {
      const cached = await redis.get<SolscanDefiActivity[]>(cacheKey);
      if (cached) {
        logger.debug({ mint }, 'Solscan first buyers — cache hit');
        return cached;
      }

      const data = await solscanFetch<SolscanDefiActivitiesResponse>(
        `/token/defi-activities?address=${mint}&activity_type=ACTIVITY_AGG_TOKEN_SWAP&page=1&page_size=${limit}&sort_by=block_time&sort_order=asc`
      );

      const items = data.items ?? [];
      await redis.set(cacheKey, items, { ex: TTL.defiActivities });
      logger.debug({ mint, count: items.length }, 'Solscan first buyers fetched');
      return items;

    } catch (err: any) {
      logger.error({ mint, err: err.message }, 'SolscanClient.getFirstBuyers failed');
      return [];
    }
  }

  // ── 4. Account Transaction History ─────────────────────────────────────
  // Replaces: Helius getSignaturesForAddress (saves 5 credits/call)
  // Used for: dev wallet history check, rug pattern detection
  static async getAccountTransactions(
    address: string,
    pageSize = 20
  ): Promise<SolscanAccountTransaction[]> {
    const cacheKey = `solscan:acctxs:${address}:${pageSize}`;
    try {
      const cached = await redis.get<SolscanAccountTransaction[]>(cacheKey);
      if (cached) {
        logger.debug({ address }, 'Solscan account txs — cache hit');
        return cached;
      }

      const data = await solscanFetch<SolscanAccountTransaction[]>(
        `/account/transactions?address=${address}&page=1&page_size=${pageSize}`
      );

      const items = Array.isArray(data) ? data : [];
      await redis.set(cacheKey, items, { ex: TTL.accountTxs });
      logger.debug({ address, count: items.length }, 'Solscan account txs fetched');
      return items;

    } catch (err: any) {
      logger.error({ address, err: err.message }, 'SolscanClient.getAccountTransactions failed');
      return [];
    }
  }

  // ── 5. Transaction Detail (single) ─────────────────────────────────────
  // Replaces: Helius getTransaction + manual decode
  // Already parsed: balance changes, token transfers, activity type
  static async getTransactionDetail(signature: string): Promise<SolscanTransactionDetail | null> {
    const cacheKey = `solscan:txdetail:${signature}`;
    try {
      const cached = await redis.get<SolscanTransactionDetail>(cacheKey);
      if (cached) {
        logger.debug({ signature }, 'Solscan tx detail — cache hit');
        return cached;
      }

      const data = await solscanFetch<SolscanTransactionDetail>(
        `/transaction/detail?tx=${signature}`
      );

      await redis.set(cacheKey, data, { ex: TTL.txDetail });
      logger.debug({ signature }, 'Solscan tx detail fetched');
      return data;

    } catch (err: any) {
      logger.error({ signature, err: err.message }, 'SolscanClient.getTransactionDetail failed');
      return null;
    }
  }

  // ── 6. Batch Transaction Detail (up to 20 at once) ─────────────────────
  // Saves multiple API calls. Deduplicates via cache.
  static async getTransactionDetailBatch(
    signatures: string[]
  ): Promise<Record<string, SolscanTransactionDetail>> {
    const results: Record<string, SolscanTransactionDetail> = {};
    const toFetch: string[] = [];

    // Check cache first
    for (const sig of signatures) {
      const cached = await redis.get<SolscanTransactionDetail>(`solscan:txdetail:${sig}`);
      if (cached) {
        results[sig] = cached;
      } else {
        toFetch.push(sig);
      }
    }

    if (toFetch.length === 0) return results;

    // Solscan batch: up to 20 per request
    const chunks = chunkArray(toFetch, 20);
    for (const chunk of chunks) {
      await delay(LOOP_DELAY_MS); // respect rate limit between batches

      try {
        const qs = chunk.map(sig => `tx[]=${encodeURIComponent(sig)}`).join('&');
        const data = await solscanFetch<SolscanTransactionDetail[]>(
          `/transaction/detail/multi?${qs}`
        );

        const items = Array.isArray(data) ? data : [];
        for (let i = 0; i < items.length; i++) {
          const detail = items[i];
          const sig = chunk[i];
          if (detail && sig) {
            results[sig] = detail;
            await redis.set(`solscan:txdetail:${sig}`, detail, { ex: TTL.txDetail });
          }
        }
      } catch (err: any) {
        logger.error({ chunk, err: err.message }, 'SolscanClient.getTransactionDetailBatch chunk failed');
      }
    }

    return results;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Convert Solscan holders to HolderDistribution shape (compatible with existing engine).
   * `percent_of_supply` from Solscan is already 0–1 (e.g. 0.045 = 4.5%).
   * If Solscan returns it as a percentage (4.5), we normalize automatically.
   */
  static toHolderDistribution(mint: string, res: SolscanHoldersResponse) {
    const items = res.items ?? [];

    // Normalize: Solscan sometimes returns % as 4.5, sometimes 0.045 — detect by max value
    const maxPct = Math.max(...items.map(h => h.percent_of_supply), 0);
    const normalize = (pct: number) => maxPct > 1 ? pct / 100 : pct;

    const topHolders = items.map(h => ({
      address: h.owner,
      share: normalize(h.percent_of_supply),
    }));

    const top10Pct = topHolders.reduce((sum, h) => sum + h.share, 0);

    return {
      ca: mint,
      topHolders,
      top10Pct,
      uniqueHolders: res.total,
    };
  }
}

// ─── Util ────────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
