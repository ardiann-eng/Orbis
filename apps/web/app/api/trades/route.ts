// apps/web/app/api/trades/route.ts
import { z } from 'zod';
import { getDb, apiOk, apiError } from '../lib/turso';

const QuerySchema = z.object({
  userId: z.string().default('default'),
  status: z.enum(['open', 'closed', 'all']).default('all'),
  limit:  z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return apiError(parsed.error.message);

    const { userId, status, limit, offset } = parsed.data;
    const db = getDb();

    let sql = `SELECT p.*, t.name, t.symbol
               FROM portfolio_state p
               LEFT JOIN tokens_history t ON t.ca = p.ca
               WHERE p.user_id = ?`;
    const args: (string | number)[] = [userId];

    if (status !== 'all') {
      sql += ` AND p.status = ?`;
      args.push(status);
    }
    sql += ` ORDER BY p.opened_at DESC LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const result = await db.execute({ sql, args });
    return apiOk({ trades: result.rows });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}
