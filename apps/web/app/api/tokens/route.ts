// apps/web/app/api/tokens/route.ts
import { z } from 'zod';
import { getDb, apiOk, apiError } from '../lib/turso';

const QuerySchema = z.object({
  sort:   z.enum(['created_at', 'market_cap_usd', 'volume_24h']).default('created_at'),
  order:  z.enum(['asc', 'desc']).default('desc'),
  limit:  z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const parsed = QuerySchema.safeParse(params);
    if (!parsed.success) return apiError(parsed.error.message);

    const { sort, order, limit, offset, search } = parsed.data;
    const db = getDb();

    let sql = `SELECT * FROM tokens_history`;
    const args: (string | number)[] = [];

    if (search) {
      sql += ` WHERE (name LIKE ? OR symbol LIKE ? OR ca LIKE ?)`;
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ` ORDER BY ${sort} ${order.toUpperCase()} LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const result = await db.execute({ sql, args });

    // Get total count (for sidebar badge + pagination)
    let countSql = `SELECT COUNT(*) as total FROM tokens_history`;
    const countArgs: (string | number)[] = [];
    if (search) {
      countSql += ` WHERE (name LIKE ? OR symbol LIKE ? OR ca LIKE ?)`;
      countArgs.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const countResult = await db.execute({ sql: countSql, args: countArgs });
    const total = (countResult.rows[0] as any)?.total ?? result.rows.length;

    return apiOk({ tokens: result.rows, total });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}
