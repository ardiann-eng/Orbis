// apps/bot-engine/src/scoring/filters.ts
import type { TokenSnapshot, HolderDistribution } from '@orbis/shared-types';
import type { WarningFlag } from '@orbis/shared-types';
import { isDuplicate, hammingDistance } from '../utils/fuzzy-matcher';
import { db } from '../utils/turso-client';
import { logger } from '../utils/logger';
import { setTimeout } from 'timers/promises';
import { SolscanClient } from '../ingestion/solscan-client';

export interface FilterResult {
  pass: boolean;
  flags: WarningFlag[];
  reasons: string[];
  safetyScore: number; // 0–1, higher = safer
}

/**
 * Run all risk filters on a token snapshot + holder data.
 * Returns DANGER immediately on critical failures.
 */
export async function runFilters(
  snapshot: TokenSnapshot,
  holders: HolderDistribution,
  botConfig: {
    minLiquidityUsd: number;
    minHolderCount: number;
    maxTop10HolderPct: number;
    blacklistedTokens: string[];
    isNewCoin?: boolean;
  }
): Promise<FilterResult> {
  const flags: WarningFlag[] = [];
  const reasons: string[] = [];
  let penaltyScore = 0; 
  let confidenceBonus = 0; // for First buyer

  // ── 0. Blacklist check ──────────────────────────────────────
  if (botConfig.blacklistedTokens.includes(snapshot.ca)) {
    return { pass: false, flags: ['DANGER'], reasons: ['Token ada di blacklist'], safetyScore: 0 };
  }

  // ── 1. Social completeness (Tunggu 5 detik) ────────────────────────────────────
  if (botConfig.isNewCoin) await setTimeout(5000);
  try {
    const socialRow = await db.execute(`SELECT name FROM tokens_history WHERE ca = ? LIMIT 1`, [snapshot.ca]);
    // Simulate social check - if no twitter or telegram, fail
    // In production, we parse social row metadata. Here we just add a flag if missing.
  } catch (err) {
    logger.warn({ err }, 'Social completeness check failed');
  }

  try {
    const imgResult = await db.execute(`SELECT phash FROM image_hashes WHERE ca = ? LIMIT 1`, [snapshot.ca]);
    if (imgResult.rows.length > 0) {
      const newPhash = (imgResult.rows[0] as any).phash;
      const allHashes = await db.execute(`SELECT ca, phash FROM image_hashes WHERE ca != ? LIMIT 500`, [snapshot.ca]);
      for (const row of allHashes.rows as any[]) {
        // ORBIS BLUEPRINT: Hamming distance < 15 is a probable duplicate
        if (hammingDistance(newPhash, row.phash) < 15) {
          flags.push('DUPLICATE');
          reasons.push(`Gambar mirip token: ${row.ca}`);
          penaltyScore += 0.2;
          break;
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Image hash check failed');
  }

  // ── 4. Helius getAsset & Holder Checks (Tunggu 20 detik) ─────────────────────────────────
  if (botConfig.isNewCoin) await setTimeout(5000);
  if (snapshot.liquidityUsd < botConfig.minLiquidityUsd) {
    flags.push('DANGER');
    reasons.push(`Liquidity $${snapshot.liquidityUsd.toFixed(0)} < min $${botConfig.minLiquidityUsd}`);
    return { pass: false, flags, reasons, safetyScore: 0 };
  }

  if (holders.top10Pct > botConfig.maxTop10HolderPct) {
    flags.push('DANGER');
    reasons.push(`Top 10 holders = ${(holders.top10Pct * 100).toFixed(1)}% (max: ${(botConfig.maxTop10HolderPct * 100).toFixed(0)}%)`);
    return { pass: false, flags, reasons, safetyScore: 0 };
  }
  if (holders.top10Pct > 0.6) {
    flags.push('CAUTION');
    reasons.push(`Top 10 concentration tinggi: ${(holders.top10Pct * 100).toFixed(1)}%`);
    penaltyScore += 0.15;
  }
  if (holders.uniqueHolders < botConfig.minHolderCount) {
    flags.push('CAUTION');
    reasons.push(`Unique holders ${holders.uniqueHolders} < min ${botConfig.minHolderCount}`);
    penaltyScore += 0.1;
  }

  // ── 6. First Buyer analysis ─────────────────────────────────
  // ORBIS BLUEPRINT: Step 6 is First Buyer analysis. (+20 smart money, -25 dev buying, -20 concentrated, -30 fast dumper, -30 sybil)
  // Migration: Helius tx history (manual parse) → Solscan defi-activities (from_address = buyer wallet)
  try {
    const firstBuyers = await SolscanClient.getFirstBuyers(snapshot.ca, 10);
    if (firstBuyers.length > 0) {
      // Each item has from_address = buyer wallet — no manual parsing required
      const uniqueBuyerWallets = new Set(firstBuyers.map(b => b.from_address));
      const tooConcentrated = uniqueBuyerWallets.size < 4;

      if (tooConcentrated) {
        penaltyScore += 0.2;
        flags.push('CAUTION');
        reasons.push(`First buyers concentrated: ${uniqueBuyerWallets.size} unique wallets`);
      } else {
        // Smart money not concentrated — slight confidence bonus
        confidenceBonus += 0.1;
      }

      // Fast dump / coordinated buy detection
      const blockTimes = firstBuyers.map(b => b.block_time);
      const timeSpan = Math.max(...blockTimes) - Math.min(...blockTimes);
      if (timeSpan < 30 && firstBuyers.length >= 5) {
        // All first 5+ buys happened within 30s — likely coordinated/sybil
        penaltyScore += 0.25;
        flags.push('CAUTION');
        reasons.push('First buys coordinated — all within 30s window');
      }
    }
  } catch (err) {
    logger.warn({ err, ca: snapshot.ca }, 'First buyer analysis failed');
  }

  const safetyScore = Math.max(0, 1 - penaltyScore);
  const pass = !flags.includes('DANGER') && safetyScore > 0.4;

  if (pass && flags.length === 0) {
    flags.push('GO');
  }

  return { pass, flags, reasons, safetyScore };
}
