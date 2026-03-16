// apps/web/app/api/bot/stop/route.ts
import { z } from 'zod';
import { getDb, apiOk, apiError } from '../../lib/turso';

const StopSchema = z.object({
  userId: z.string().min(1),
  reason: z.enum(['manual', 'emergency']).default('manual'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = StopSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.message);

    const { userId } = parsed.data;
    const db = getDb();

    await db.execute(
      `UPDATE bot_config SET is_bot_active = 0, updated_at = ? WHERE user_id = ?`,
      [Date.now(), userId]
    );

    return apiOk({ stopped: true, userId });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}
