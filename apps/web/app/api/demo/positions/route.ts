import { getDb, apiOk, apiError } from '../../lib/turso';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') ?? 'default';
    const status = url.searchParams.get('status') ?? 'OPEN';
    const db = getDb();

    const rows = await db.execute(
      `SELECT * FROM demo_positions WHERE user_id = ? AND status = ? ORDER BY entry_time DESC`,
      [userId, status],
    );

    return apiOk({ positions: rows.rows });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}

