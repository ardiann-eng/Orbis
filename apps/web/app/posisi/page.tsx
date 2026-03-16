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

function Skeleton({ width = "100%", height = 180 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 8,
        background: "var(--bg-tertiary)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

export default function PosisiPage() {
  const { data, loading } = useApi<{ trades: Position[] }>(
    "/api/trades?userId=default&status=open&limit=50",
    { trades: [] }
  );

  const positions = data?.trades ?? [];

  // Calculate totals
  const totalSolInvested = positions.reduce((sum, pos) => sum + (pos.entry_amount_sol ?? 0), 0);
  let totalPnlSol = 0;
  
  positions.forEach(pos => {
    if (pos.current_price_usd && pos.entry_price_usd && pos.entry_price_usd > 0) {
      const pct = (pos.current_price_usd - pos.entry_price_usd) / pos.entry_price_usd;
      totalPnlSol += (pct * pos.entry_amount_sol);
    }
  });

  function relativeTime(ts: number) {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return `${Math.floor(diff)}d lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    return `${Math.floor(diff / 3600)}j lalu`;
  }

  function pnlPct(pos: Position) {
    if (!pos.current_price_usd || !pos.entry_price_usd || pos.entry_price_usd === 0) return 0;
    return (pos.current_price_usd - pos.entry_price_usd) / pos.entry_price_usd;
  }

  function pnlSol(pos: Position) {
    const pct = pnlPct(pos);
    return pct * pos.entry_amount_sol;
  }

  function tpProgress(pos: Position) {
    if (!pos.current_price_usd || !pos.entry_price_usd || !pos.take_profit_price || pos.take_profit_price === pos.entry_price_usd) return 0;
    const progress = (pos.current_price_usd - pos.entry_price_usd) / (pos.take_profit_price - pos.entry_price_usd);
    return Math.max(0, Math.min(1, progress));
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Posisi aktif</h2>

        {/* Portfolio summary */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px",
        }}>
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Total nilai posisi (SOL invested)</div>
            {loading ? <Skeleton height={24} /> : (
              <div className="font-mono-num" style={{ fontSize: "1.125rem", fontWeight: 600 }}>{totalSolInvested.toFixed(4)} SOL</div>
            )}
          </div>
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Unrealized PnL</div>
            {loading ? <Skeleton height={24} /> : (
              <div className="font-mono-num" style={{ fontSize: "1.125rem", fontWeight: 600, color: totalPnlSol >= 0 ? "var(--emerald-400)" : "var(--rose-400)" }}>
                {totalPnlSol >= 0 ? "+" : ""}{totalPnlSol.toFixed(4)} SOL
              </div>
            )}
          </div>
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Exposure saat ini</div>
            {loading ? <Skeleton height={24} /> : (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                {positions.length > 0 ? (
                  <span className="pill pill-warm">{positions.length} posisi terbuka</span>
                ) : (
                  <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Tidak ada posisi</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Position cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading ? (
             [1, 2, 3].map((i) => <Skeleton key={i} />)
          ) : positions.length === 0 ? (
             <div className="card" style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
               Tidak ada posisi aktif saat ini.
             </div>
          ) : positions.map((pos, i) => {
            const label = pos.symbol ?? pos.name ?? pos.ca.slice(0, 8);
            const logics = pos.logics_triggered ?? "—";
            const pct = pnlPct(pos);
            const solDiff = pnlSol(pos);
            const progress = tpProgress(pos);

            return (
              <div
                key={pos.ca}
                className="card animate-slide-in-top"
                style={{
                  animationDelay: `${i * 50}ms`,
                  borderColor: pct >= 0 ? "var(--emerald-border)" : "var(--rose-border)",
                  background: pct >= 0 ? "rgba(16,185,129,0.015)" : "rgba(244,63,94,0.015)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "1.0625rem" }}>{label}</span>
                      <span className="badge badge-neutral">{logics}</span>
                    </div>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>{relativeTime(pos.opened_at)}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="font-mono-num" style={{
                      fontSize: "1.25rem", fontWeight: 600,
                      color: pct >= 0 ? "var(--emerald-400)" : "var(--rose-400)",
                    }}>
                      {pct >= 0 ? "+" : ""}{(pct * 100).toFixed(1)}%
                    </div>
                    <div className="font-mono-num" style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
                      {solDiff >= 0 ? "+" : ""}{solDiff.toFixed(4)} SOL
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Harga masuk</span>
                    <div className="font-mono-num" style={{ fontSize: "0.875rem" }}>${pos.entry_price_usd.toFixed(6)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Harga saat ini</span>
                    <div className="font-mono-num" style={{ fontSize: "0.875rem" }}>${(pos.current_price_usd ?? pos.entry_price_usd).toFixed(6)}</div>
                  </div>
                </div>

                {/* TP progress */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Progress menuju TP</span>
                    <span className="font-mono-num" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {Math.round(progress * 100)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{
                      width: `${progress * 100}%`,
                      background: pct >= 0 ? "var(--emerald-500)" : "var(--rose-500)",
                    }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-danger btn-sm">Jual sekarang</button>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => window.open(`https://solscan.io/token/${pos.ca}`)}>
                    Lihat di Solscan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
