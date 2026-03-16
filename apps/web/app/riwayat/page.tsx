"use client";

import { useApi } from "../hooks/useApi";
import DashboardLayout from "../components/DashboardLayout";

interface Position {
  ca: string;
  name: string | null;
  symbol: string | null;
  entry_price_usd: number;
  entry_amount_sol: number;
  current_price_usd: number | null;
  take_profit_price: number;
  entry_tx: string;
  opened_at: number;
  logics_triggered: string | null;
}

function SkeletonRow() {
  return (
    <tr>
      <td colSpan={8}>
        <div style={{
          width: "100%", height: 24, borderRadius: 4,
          background: "var(--bg-tertiary)", animation: "pulse 1.5s ease-in-out infinite"
        }} />
      </td>
    </tr>
  );
}

export default function RiwayatPage() {
  const { data, loading } = useApi<{ trades: Position[] }>(
    "/api/trades?userId=default&status=closed&limit=50",
    { trades: [] }
  );

  const trades = data?.trades ?? [];

  function relativeTime(ts: number) {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return `${Math.floor(diff)}d lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  }

  function pnlPct(pos: Position) {
    if (!pos.current_price_usd || !pos.entry_price_usd || pos.entry_price_usd === 0) return 0;
    return (pos.current_price_usd - pos.entry_price_usd) / pos.entry_price_usd;
  }

  function pnlSol(pos: Position) {
    const pct = pnlPct(pos);
    return pct * pos.entry_amount_sol;
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Riwayat trading</h2>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Sinyal</th>
                <th>Harga masuk</th>
                <th>Harga keluar</th>
                <th>PnL (%)</th>
                <th>Profit/Loss (SOL)</th>
                <th>Waktu Beli</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Belum ada riwayat trading.
                  </td>
                </tr>
              ) : trades.map((t, i) => {
                const pct = pnlPct(t);
                const sol = pnlSol(t);
                const isProfit = pct >= 0;

                return (
                  <tr key={t.ca} className="animate-slide-in-top" style={{ animationDelay: `${i * 25}ms` }}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.symbol ?? t.name ?? t.ca.slice(0,8)}</td>
                    <td><span className="badge badge-neutral">{t.logics_triggered ?? "—"}</span></td>
                    <td className="font-mono-num">${t.entry_price_usd.toFixed(6)}</td>
                    <td className="font-mono-num">${(t.current_price_usd ?? t.entry_price_usd).toFixed(6)}</td>
                    <td className="font-mono-num" style={{
                      color: isProfit ? "var(--emerald-400)" : "var(--rose-400)",
                      fontWeight: 600,
                    }}>
                      {isProfit ? "+" : ""}{(pct * 100).toFixed(2)}%
                    </td>
                    <td className="font-mono-num" style={{
                      color: isProfit ? "var(--emerald-400)" : "var(--rose-400)",
                    }}>
                      {isProfit ? "+" : ""}{sol.toFixed(4)} SOL
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>{relativeTime(t.opened_at)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: "0.75rem" }} onClick={() => window.open(`https://solscan.io/token/${t.ca}`)}>
                        Solscan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
