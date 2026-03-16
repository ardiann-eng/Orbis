import { getDb, apiOk, apiError } from '../../lib/turso';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId ?? 'default';
    const db = getDb();
    const now = Date.now();

    await db.execute(
      `UPDATE demo_wallets
       SET virtual_balance = 2.0,
           initial_balance = 2.0,
           locked_in_positions = 0,
           total_realized_pnl = 0,
           total_trades = 0,
           win_count = 0,
           reset_count = COALESCE(reset_count, 0) + 1,
           last_reset_at = ?,
           updated_at = ?
       WHERE user_id = ?`,
      [now, now, userId],
    );

    return apiOk({ reset: true });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}

