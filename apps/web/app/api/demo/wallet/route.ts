import { getDb, apiOk, apiError } from '../../lib/turso';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') ?? 'default';
    const db = getDb();

    const res = await db.execute(
      `SELECT * FROM demo_wallets WHERE user_id = ? LIMIT 1`,
      [userId],
    );

    if (res.rows.length === 0) {
      return apiOk({
        userId,
        virtualBalance: 2,
        initialBalance: 2,
        lockedInPositions: 0,
        totalRealizedPnl: 0,
        totalTrades: 0,
        winCount: 0,
      });
    }

    const row = res.rows[0] as any;
    const virtualBalance = Number(row.virtual_balance ?? 0);
    const locked = Number(row.locked_in_positions ?? 0);

    return apiOk({
      userId,
      virtualBalance,
      initialBalance: Number(row.initial_balance ?? 0),
      lockedInPositions: locked,
      availableBalance: virtualBalance - locked,
      totalRealizedPnl: Number(row.total_realized_pnl ?? 0),
      totalTrades: Number(row.total_trades ?? 0),
      winCount: Number(row.win_count ?? 0),
    });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}

