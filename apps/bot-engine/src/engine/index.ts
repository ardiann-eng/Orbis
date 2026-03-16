// apps/bot-engine/src/engine/index.ts
import type { TokenSnapshot, HolderDistribution, TokenScore, BotConfig } from '@orbis/shared-types';
import { evaluateLogic1 } from './logic1-momentum';
import { evaluateLogic2 } from './logic2-volume';
import { evaluateLogic3 } from './logic3-telegram';
import { scoreToken } from '../scoring/scorer';
import { PositionManager } from '../execution/position-manager';
import { RiskManager } from '../execution/risk-manager';
import { Trader } from '../execution/trader';
import { db } from '../utils/turso-client';
import { logger } from '../utils/logger';
import { redis, CacheKeys } from '../utils/redis-client';
import { SolscanClient } from '../ingestion/solscan-client';

const RATE_LIMIT_SECONDS = 300; // same token can't be evaluated within 5 min
const MAX_HELIUS_CREDITS = 800000;

export class BotEngine {
  private running = false;
  private positionManager: PositionManager;
  private riskManager: RiskManager;
  private trader: Trader;

  constructor(private readonly userId: string) {
    this.positionManager = new PositionManager(userId);
    this.riskManager = new RiskManager(userId);
    this.trader = new Trader(userId);
  }

  async start(): Promise<void> {
    if (this.running) {
      logger.warn({ userId: this.userId }, 'BotEngine already running');
      return;
    }
    this.running = true;

    // Mark bot active in Turso
    await db.execute(
      `UPDATE bot_config SET is_bot_active = 1, updated_at = ? WHERE user_id = ?`,
      [Date.now(), this.userId]
    );
    await redis.set(CacheKeys.botStatus(this.userId), { active: true, startedAt: Date.now() });

    logger.info({ userId: this.userId }, 'BotEngine started');
  }

  async stop(reason: 'manual' | 'cascade_stop' | 'emergency' = 'manual'): Promise<void> {
    this.running = false;

    await db.execute(
      `UPDATE bot_config SET is_bot_active = 0, updated_at = ? WHERE user_id = ?`,
      [Date.now(), this.userId]
    );
    await redis.set(CacheKeys.botStatus(this.userId), { active: false, stoppedAt: Date.now(), reason });

    logger.info({ userId: this.userId, reason }, 'BotEngine stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Main entry point — called by ingestion listeners per new/updated token.
   * Runs all 3 logics, scores the token, executes if BUY.
   */
  async processToken(
    snapshot: TokenSnapshot,
    holders: HolderDistribution,
    isNewCoin = false
  ): Promise<TokenScore | null> {
    if (!this.running) return null;

    const { ca } = snapshot;

    // ── Rate limit per token ───────────────────────────────────
    const rlKey = CacheKeys.rateLimit(ca);
    const rateLimited = await redis.exists(rlKey);
    if (rateLimited) {
      logger.debug({ ca }, 'Rate limited — skipping evaluation');
      return null;
    }
    await redis.set(rlKey, 1, { ex: RATE_LIMIT_SECONDS });

    // ── Load bot config ────────────────────────────────────────
    const config = await this.loadConfig();
    if (!config || !config.isBotActive) return null;

    // ── Max open positions check ───────────────────────────────
    const openPositions = await this.positionManager.countOpenPositions();
    const maxOpen = 5; // HARD LIMIT from Blueprint
    if (openPositions >= maxOpen) {
      logger.debug({ ca, openPositions, maxOpen }, 'Max positions reached — skip');
      return null;
    }

    // ── Daily loss limit check ─────────────────────────────────
    const balance = await this.trader.getBalance();
    const isSafe = await this.riskManager.checkDailyLossLimit(balance);
    if (!isSafe) {
      logger.warn({ userId: this.userId }, 'Daily loss limit hit — bot paused');
      await this.stop('cascade_stop');
      return null;
    }

    // ── Run logics ─────────────────────────────────────────────
    const logic1 = config.logic1Enabled ? evaluateLogic1(snapshot) : undefined;
    const logic2 = config.logic2Enabled ? evaluateLogic2(snapshot) : undefined;
    const logic3 = config.logic3Enabled ? await evaluateLogic3(ca) : undefined;

    // Must have at least one logic signal to proceed
    if (!logic1 && !logic2 && !logic3) {
      logger.debug({ ca }, 'No logic triggered — skip');
      return null;
    }

    // ── Score the token ────────────────────────────────────────
    const score = await scoreToken({
      snapshot,
      holders,
      logic1: logic1 ?? undefined,
      logic2: logic2 ?? undefined,
      logic3: logic3 ?? undefined,
      config,
      isNewCoin,
    });

    // ── Pre-execution check (Early Exit Step 5) ────────────────
    const today = new Date().toISOString().split('T')[0];
    const creditsUsed = Number(await redis.get(`helius:credits:${today}`) || 0);
    const economyMode = creditsUsed > MAX_HELIUS_CREDITS;
    
    // Adjust threshold if nearing API limits
    const threshold = economyMode ? config.minConfidenceScore + 0.10 : config.minConfidenceScore;

    // ── Execute decision ───────────────────────────────────────
    if (score.decision === 'BUY' && score.confidenceScore >= threshold) {
      let isFirstBuyersSafe = true;

      // EARLY EXIT PIPELINE STEP 5: First Buyer Validation
      // Migration: Helius tx history (10 credits) → Solscan defi-activities (0 credits, cached)
      // Only run if NOT in economy mode — this is the final gate before execution.
      if (!economyMode) {
        try {
          const firstBuyers = await SolscanClient.getFirstBuyers(ca, 10);
          if (firstBuyers.length > 0) {
            const uniqueBuyerWallets = new Set(firstBuyers.map(b => b.from_address));

            // If < 4 unique buyers in first 10 swaps, it's highly concentrated/sybil
            if (uniqueBuyerWallets.size < 4) {
              isFirstBuyersSafe = false;
              logger.warn({ ca, uniqueBuyers: uniqueBuyerWallets.size }, 'Execution blocked: First buyers too concentrated (Sybil)');

              score.warningFlags.push('DANGER');
              score.decision = 'SKIP';
              score.skipReason = 'First buyers concentrated (Sybil)';

              await db.execute(
                `UPDATE decisions_log SET decision = 'SKIP', reason = ?, warning_flags = ? WHERE ca = ?`,
                [score.skipReason, JSON.stringify(score.warningFlags), ca]
              );
            }
          }
        } catch (err) {
          logger.warn({ err, ca }, 'First buyer validation failed, proceeding anyway');
        }
      } else {
        logger.debug({ ca }, 'Economy Mode: Skipped first buyer analysis');
      }

      if (isFirstBuyersSafe) {
        await this.executeBuy(score, config, snapshot);
      }
    }

    return score;
  }

  private async executeBuy(
    score: TokenScore,
    config: BotConfig,
    snapshot: TokenSnapshot
  ): Promise<void> {
    const ca = score.ca;

    // Idempotency: check if we already have an open position for this CA
    const existing = await this.positionManager.getOpenPosition(ca);
    if (existing) {
      logger.info({ ca }, 'Already have open position — skip buy');
      return;
    }

    // Calculate position size
    const balance = await this.trader.getBalance();
    const MAX_EXPOSURE_PER_TRADE = 0.15; 
    const maxPerTrade = balance * MAX_EXPOSURE_PER_TRADE; 
    let amountSol = Math.min(balance * 0.05, maxPerTrade); // default 5%, capped at 15%

    if (amountSol < 0.01) {
      logger.warn({ ca, amountSol }, 'Position too small — skip');
      return;
    }

    logger.info({ ca, amountSol, confidence: score.confidenceScore }, 'Executing BUY');

    try {
      const txHash = await this.trader.buy(ca, amountSol);
      if (!txHash) return;

      await this.positionManager.openPosition({
        ca,
        entryPrice: snapshot.priceUsd,
        entryAmountSol: amountSol,
        entryTx: txHash,
        stopLossPrice: snapshot.priceUsd * (1 - config.stopLossPct),
        takeProfitPrice: snapshot.priceUsd * (1 + config.takeProfitPct),
      });

      logger.info({ ca, txHash, amountSol }, 'Position opened');
    } catch (err) {
      logger.error({ err, ca }, 'BUY execution failed');
    }
  }

  private async loadConfig(): Promise<BotConfig | null> {
    try {
      const result = await db.execute(
        `SELECT * FROM bot_config WHERE user_id = ? LIMIT 1`,
        [this.userId]
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0] as Record<string, unknown>;
      return {
        userId: this.userId,
        logic1Enabled: row.logic1_enabled === 1,
        logic2Enabled: row.logic2_enabled === 1,
        logic3Enabled: row.logic3_enabled === 1,
        minConfidenceScore: row.min_confidence_score as number,
        minUniqueChannels: row.min_unique_channels as number,
        maxTradesPerDay: row.max_trades_per_day as number,
        maxExposureSol: row.max_exposure_sol as number,
        drawdownLimitPct: row.drawdown_limit_pct as number,
        stopLossPct: row.stop_loss_pct as number,
        takeProfitPct: row.take_profit_pct as number,
        minLiquidityUsd: row.min_liquidity_usd as number,
        minHolderCount: row.min_holder_count as number,
        maxTop10HolderPct: row.max_top10_holder_pct as number,
        blacklistedTokens: JSON.parse((row.blacklisted_tokens as string) || '[]'),
        isBotActive: row.is_bot_active === 1,
        updatedAt: row.updated_at as number | null,
      };
    } catch (err) {
      logger.error({ err }, 'Failed to load bot config');
      return null;
    }
  }
}
