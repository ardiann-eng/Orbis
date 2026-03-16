// apps/web/app/api/config/route.ts
import { z } from 'zod';
import { getDb, apiOk, apiError } from '../lib/turso';

const ConfigUpdateSchema = z.object({
  userId:              z.string().min(1),
  logic1Enabled:       z.boolean().optional(),
  logic2Enabled:       z.boolean().optional(),
  logic3Enabled:       z.boolean().optional(),
  tradingMode:         z.enum(['DEMO', 'REAL']).optional(),
  minConfidenceScore:  z.number().min(0).max(1).optional(),
  minUniqueChannels:   z.number().int().min(1).optional(),
  maxTradesPerDay:     z.number().int().min(1).optional(),
  maxExposureSol:      z.number().positive().optional(),
  drawdownLimitPct:    z.number().min(0).max(1).optional(),
  stopLossPct:         z.number().min(0).max(1).optional(),
  takeProfitPct:       z.number().min(0).optional(),
  minLiquidityUsd:     z.number().positive().optional(),
  minHolderCount:      z.number().int().min(0).optional(),
  maxTop10HolderPct:   z.number().min(0).max(1).optional(),
  blacklistedTokens:   z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') ?? 'default';
  const db = getDb();
  const result = await db.execute(
    `SELECT * FROM bot_config WHERE user_id = ? LIMIT 1`, [userId]
  );
  if (result.rows.length === 0) return apiError('Config not found', 404);
  return apiOk(result.rows[0]);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = ConfigUpdateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.message);

    const { userId, blacklistedTokens, ...rest } = parsed.data;
    const db = getDb();

    // Build dynamic SET clause
    const updates: string[] = ['updated_at = ?'];
    const args: (string | number)[] = [Date.now()];

    const fieldMap: Record<string, string> = {
      logic1Enabled:      'logic1_enabled',
      logic2Enabled:      'logic2_enabled',
      logic3Enabled:      'logic3_enabled',
      tradingMode:        'trading_mode',
      minConfidenceScore: 'min_confidence_score',
      minUniqueChannels:  'min_unique_channels',
      maxTradesPerDay:    'max_trades_per_day',
      maxExposureSol:     'max_exposure_sol',
      drawdownLimitPct:   'drawdown_limit_pct',
      stopLossPct:        'stop_loss_pct',
      takeProfitPct:      'take_profit_pct',
      minLiquidityUsd:    'min_liquidity_usd',
      minHolderCount:     'min_holder_count',
      maxTop10HolderPct:  'max_top10_holder_pct',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in rest) {
        updates.push(`${col} = ?`);
        const val = rest[key as keyof typeof rest];
        args.push(typeof val === 'boolean' ? (val ? 1 : 0) : (val as number));
      }
    }

    if (blacklistedTokens !== undefined) {
      updates.push('blacklisted_tokens = ?');
      args.push(JSON.stringify(blacklistedTokens));
    }

    args.push(userId);
    await db.execute(
      `UPDATE bot_config SET ${updates.join(', ')} WHERE user_id = ?`,
      args
    );

    return apiOk({ updated: true });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}
