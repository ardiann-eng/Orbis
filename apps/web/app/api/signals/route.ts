// apps/web/app/api/signals/route.ts
import { z } from 'zod';
import { getDb, apiOk, apiError } from '../lib/turso';

const QuerySchema = z.object({
  decision: z.string().transform(v => v.toLowerCase()).pipe(
    z.enum(['buy', 'skip', 'watchlist', 'all']).default('all')
  ).default('all'),
  limit:    z.coerce.number().min(1).max(100).default(50),
  offset:   z.coerce.number().min(0).default(0),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return apiError(parsed.error.message);

    const { decision, limit, offset } = parsed.data;
    const db = getDb();

    let sql = `SELECT d.*, t.name, t.symbol
               FROM decisions_log d
               LEFT JOIN tokens_history t ON t.ca = d.ca`;
    const args: (string | number)[] = [];

    if (decision !== 'all') {
      sql += ` WHERE d.decision = ?`;
      args.push(decision.toUpperCase());
    }
    sql += ` ORDER BY d.executed_at DESC LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const result = await db.execute({ sql, args });
    return apiOk({ signals: result.rows });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}
