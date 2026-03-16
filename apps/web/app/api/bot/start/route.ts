// apps/web/app/api/bot/start/route.ts
import { z } from 'zod';
import { getDb, apiOk, apiError } from '../../lib/turso';

const StartSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = StartSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.message);

    const { userId } = parsed.data;
    const db = getDb();

    // Check config exists
    const cfg = await db.execute(
      `SELECT id FROM bot_config WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    if (cfg.rows.length === 0) {
      return apiError('Bot config not found — complete onboarding first', 404);
    }

    // Check wallet exists
    const wallet = await db.execute(
      `SELECT trading_wallet FROM wallet_records WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    if (wallet.rows.length === 0) {
      return apiError('Trading wallet not configured', 400);
    }

    await db.execute(
      `UPDATE bot_config SET is_bot_active = 1, updated_at = ? WHERE user_id = ?`,
      [Date.now(), userId]
    );

    return apiOk({ started: true, userId });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}
