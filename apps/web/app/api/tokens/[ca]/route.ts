// apps/web/app/api/tokens/[ca]/route.ts
import { getDb, apiOk, apiError } from '../../lib/turso';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ca: string }> }
) {
  try {
    const { ca } = await params;
    if (!ca || ca.length < 32) return apiError('Invalid CA address');

    const db = getDb();

    const [tokenResult, decisionsResult, mentionsResult] = await Promise.all([
      db.execute(`SELECT * FROM tokens_history WHERE ca = ? LIMIT 1`, [ca]),
      db.execute(
        `SELECT * FROM decisions_log WHERE ca = ? ORDER BY executed_at DESC LIMIT 10`,
        [ca]
      ),
      db.execute(
        `SELECT m.channel_id, c.channel_name, COUNT(*) as mention_count
         FROM ca_mentions_log m
         LEFT JOIN telegram_channels c ON c.channel_id = m.channel_id
         WHERE m.ca = ?
         GROUP BY m.channel_id
         ORDER BY mention_count DESC`,
        [ca]
      ),
    ]);

    if (tokenResult.rows.length === 0) {
      return apiError('Token not found', 404);
    }

    return apiOk({
      token: tokenResult.rows[0],
      recentDecisions: decisionsResult.rows,
      telegramMentions: mentionsResult.rows,
    });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}
