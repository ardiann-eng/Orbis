// apps/web/app/api/bot/status/route.ts
import { getDb, apiOk, apiError } from '../../lib/turso';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') ?? 'default';
    const db = getDb();

    const [configResult, positionsResult] = await Promise.all([
      db.execute(`SELECT * FROM bot_config WHERE user_id = ? LIMIT 1`, [userId]),
      db.execute(
        `SELECT COUNT(*) as cnt FROM portfolio_state
         WHERE user_id = ? AND status = 'open'`,
        [userId]
      ),
    ]);

    if (configResult.rows.length === 0) {
      return apiError('Bot config not found', 404);
    }

    const config = configResult.rows[0] as Record<string, unknown>;
    const openPositions = Number((positionsResult.rows[0] as unknown as { cnt: number }).cnt);

    return apiOk({
      isActive: config.is_bot_active === 1,
      openPositions,
      logic1Enabled: config.logic1_enabled === 1,
      logic2Enabled: config.logic2_enabled === 1,
      logic3Enabled: config.logic3_enabled === 1,
      minConfidenceScore: config.min_confidence_score,
    });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}
