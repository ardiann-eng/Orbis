// apps/bot-engine/src/ingestion/pump-portal.ts
import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { db } from '../utils/turso-client';
import type { BotEngine } from '../engine';
import { HeliusClient } from './helius-listener';
import { heliusQueue } from './helius-queue';
import { SolscanClient } from './solscan-client';
import { enrichTokenFromDexScreener } from './dexscreener-enricher';
import { isDuplicate } from '../utils/fuzzy-matcher';
import type { TokenSnapshot, HolderDistribution } from '@orbis/shared-types';

const PUMP_PORTAL_WS = 'wss://pumpportal.fun/api/data';

interface PumpPortalEvent {
  txType: 'create' | 'buy' | 'sell';
  mint: string;
  solAmount: number;
  tokenAmount: number;
  bondingCurveKey: string;
  marketCapSol: number;
  name?: string;
  symbol?: string;
  uri?: string;
  pool?: string;
}

/**
 * PumpPortal real-time WebSocket feed.
 * Subscribes to new token creation events from Pump.fun.
 */
export class PumpPortalListener {
  private ws: WebSocket | null = null;
  private reconnectDelay = 2000;

  constructor(private readonly engine: BotEngine) {}

  start(): void {
    this.connect();
  }

  stop(): void {
    this.ws?.close();
    this.ws = null;
  }

  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    
    this.ws = new WebSocket(PUMP_PORTAL_WS);

    this.ws.on('open', () => {
      this.reconnectDelay = 2000;
      logger.info('PumpPortal WebSocket connected');
      this.ws!.send(JSON.stringify({ method: 'subscribeNewToken' }));
    });

    this.ws.on('message', async (data: Buffer) => {
      try {
        const message = data.toString();
        logger.debug({ payload: message }, 'RAW PUMPPORTAL MESSAGE');
        
        if (message.includes('message":"Successfully')) {
          logger.info('PumpPortal subscription success confirmed');
          return;
        }
        
        const event = JSON.parse(message);
        if (!event.mint || !event.signature) return;

        if (event.txType === 'create') {
          await this.handleNewToken(event);
        }
      } catch (err) {
        logger.warn({ err }, 'PumpPortal message parse error');
      }
    });

    this.ws.on('close', () => {
      logger.warn('PumpPortal disconnected — reconnecting');
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
    });

    this.ws.on('error', (err) => {
      logger.error({ err }, 'PumpPortal WebSocket error');
    });

    const pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 15000);
  }

  private async handleNewToken(event: PumpPortalEvent): Promise<void> {
    const ca = event.mint;
    if (!ca) return;

    logger.debug({ ca, name: event.name, symbol: event.symbol }, 'PumpPortal new token');

    // ── 1. Upsert basic metadata into tokens_history ────────────────────────
    try {
      await db.execute(
        `INSERT INTO tokens_history
           (ca, name, symbol, created_at, first_seen_at, is_pump_fun)
         VALUES (?, ?, ?, ?, ?, 1)
         ON CONFLICT(ca) DO UPDATE SET
           name   = COALESCE(excluded.name, name),
           symbol = COALESCE(excluded.symbol, symbol)`,
        [ca, event.name ?? null, event.symbol ?? null, Date.now(), Date.now()]
      );
    } catch (err) {
      logger.debug({ ca, err }, 'Failed to upsert token history (likely SQLITE_BUSY)');
    }

    // ── 2. Fire-and-forget DexScreener enrichment ───────────────────────────
    // Fills market_cap_usd, liquidity_usd, volume_24h in tokens_history.
    // Non-blocking: we don't await this — it happens in background.
    enrichTokenFromDexScreener(ca).catch(() => {});

    // ── 3. EARLY EXIT: Name duplicate check (0 Credits) ─────────────────────
    if (event.name) {
      try {
        const recentTokens = await db.execute(
          `SELECT name FROM tokens_history WHERE ca != ? AND first_seen_at > ? ORDER BY first_seen_at DESC LIMIT 200`,
          [ca, Date.now() - 7 * 24 * 60 * 60 * 1000]
        );
        const existingNames = (recentTokens.rows as any[]).map(r => r.name).filter(Boolean);
        if (existingNames.length > 0) {
          const dupCheck = isDuplicate(event.name, existingNames);
          if (dupCheck.isDup) {
            logger.info({ ca, name: event.name, matched: dupCheck.matchedName }, 'EARLY EXIT: Duplicate name (Saved 5 credits)');
            return;
          }
        }
      } catch (err) {
        logger.debug({ err, ca }, 'EARLY EXIT Step 1 failed, proceeding');
      }
    }

    // ── 4. EARLY EXIT: RugCheck API (0 Credits) ─────────────────────────────
    try {
      const res = await fetch(`https://api.rugcheck.xyz/v1/tokens/${ca}/report`);
      if (res.ok) {
        const report = await res.json() as { score: number };
        if (report.score > 500) {
          logger.info({ ca, score: report.score }, 'EARLY EXIT: RugCheck score > 500 (Saved 5 credits)');
          return;
        }
      }
    } catch (err) {
      logger.debug({ err, ca }, 'EARLY EXIT Step 2 failed, proceeding');
    }

    // ── 5. Fetch token metadata (Helius DAS + DexScreener — free) ────────────
    const result = await heliusQueue.enqueue(`pump-${ca}`, async () => {
      // TokenMetaResult uses Helius DAS + DexScreener — both free alternatives
      // to the broken Solscan /token/meta (401 insufficient plan).
      const meta = await SolscanClient.getTokenMeta(ca);
      const holdersRes = await SolscanClient.getTokenHolders(ca, 1, 20);

      // Estimate initial Pump.fun metrics (assuming 1 SOL = ~$150 for fallback logic)
      const solPriceFallback = 150;
      const fallbackMcapUsd = event.marketCapSol ? event.marketCapSol * solPriceFallback : 4500;
      // Pump.fun virtual liquidity is usually slightly higher than mcap initially
      const fallbackLiqUsd = fallbackMcapUsd * 1.1;

      const snapshot: TokenSnapshot = {
        ca,
        creator:         meta?.creator               ?? null,
        priceUsd:        meta?.priceUsd              ?? (fallbackMcapUsd / 1_000_000_000),
        priceChange5m:   0,
        priceChange1h:   meta?.priceChange24h        ?? 0,
        volume5m:        0,
        volumeAvg24h:    meta?.volume24h             ?? 0,
        holderCount:     holdersRes?.total           ?? 1,  // total from getTokenLargestAccounts
        holderGrowthRate: 0,
        marketCapUsd:    meta?.mcap                 ?? fallbackMcapUsd,
        liquidityUsd:    meta?.liquidity            ?? fallbackLiqUsd,
        bondingCurvePct: null,
        timestamp:       Date.now(),
      };

      // Persist fallback estimates if needed
      await db.execute(
        `UPDATE tokens_history SET
          market_cap_usd = COALESCE(market_cap_usd, ?),
          liquidity_usd  = COALESCE(liquidity_usd,  ?),
          updated_at     = ?
         WHERE ca = ?`,
        [fallbackMcapUsd, fallbackLiqUsd, Date.now(), ca]
      ).catch(() => {});

      // If holders fetch failed, fallback to 1 holder (the creator)
      const holders: HolderDistribution = holdersRes
        ? SolscanClient.toHolderDistribution(ca, holdersRes)
        : { ca, topHolders: [{ address: 'creator', share: 1 }], top10Pct: 1, uniqueHolders: 1 };

      return { snapshot, holders };
    });

    if (!result) return;
    await this.engine.processToken(result.snapshot, result.holders, true);
  }
}
