"use client";

import DashboardLayout from "../components/DashboardLayout";
import { useApi } from "../hooks/useApi";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Dot,
} from "recharts";

/* Custom dot for equity curve */
function CustomDot(props: Record<string, unknown>) {
  const { cx, cy, payload } = props as { cx: number; cy: number; payload: { color: string } };
  if (!cx || !cy) return null;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={4}
      fill={payload.color}
      stroke="var(--bg-primary)"
      strokeWidth={2}
    />
  );
}

function Skeleton({ width = "100%", height = 20 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: "var(--bg-tertiary)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

interface BotStatus {
  isActive: boolean;
  openPositions: number;
  logic1Enabled: boolean;
  logic2Enabled: boolean;
  logic3Enabled: boolean;
}

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

interface Signal {
  ca: string;
  name: string | null;
  symbol: string | null;
  decision: "BUY" | "SKIP" | "WATCHLIST";
  confidence_score: number;
  executed_at: number;
  logics_triggered: string | null;
  skip_reason: string | null;
}

export default function DashboardPage() {
  const { data: status, loading: statusLoading } = useApi<BotStatus>(
    "/api/bot/status?userId=default",
    { isActive: false, openPositions: 0, logic1Enabled: false, logic2Enabled: false, logic3Enabled: false }
  );
  const { data: posData, loading: posLoading } = useApi<{ trades: Position[] }>(
    "/api/trades?userId=default&status=open&limit=5",
    { trades: [] }
  );
  const { data: sigData, loading: sigLoading } = useApi<{ signals: Signal[] }>(
    "/api/signals?limit=5",
    { signals: [] }
  );
  const { data: tradesData } = useApi<{ trades: Position[] }>(
    "/api/trades?userId=default&status=closed&limit=7",
    { trades: [] }
  );

  const positions = posData?.trades ?? [];
  const signals = sigData?.signals ?? [];
  const closedTrades = tradesData?.trades ?? [];

  // Build equity curve from last 7 closed trades
  const equityData = closedTrades.slice(0, 7).reverse().map((t, i) => {
    const entry = t.entry_price_usd ?? 0;
    const current = t.current_price_usd ?? entry;
    const pnl = entry > 0 ? (current - entry) / entry : 0;
    return {
      day: `#${i + 1}`,
      pnl: parseFloat((pnl * t.entry_amount_sol).toFixed(4)),
      color: pnl >= 0 ? "#10b981" : "#f43f5e",
    };
  });

  const totalPnlSol = equityData.reduce((a, b) => a + b.pnl, 0);

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

  function tpProgress(pos: Position) {
    if (!pos.current_price_usd || !pos.entry_price_usd || !pos.take_profit_price || pos.take_profit_price === pos.entry_price_usd) return 0;
    const progress = (pos.current_price_usd - pos.entry_price_usd) / (pos.take_profit_price - pos.entry_price_usd);
    return Math.max(0, Math.min(1, progress));
  }

  function decisionColor(d: string) {
    if (d === "BUY") return "emerald";
    if (d === "SKIP") return "rose";
    return "amber";
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>

        {/* ===== STATUS BAR ===== */}
        <div
          className="animate-fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Status Bot */}
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "6px" }}>
              Status bot
            </div>
            {statusLoading ? <Skeleton height={22} /> : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  className={status?.isActive ? "animate-pulse-dot" : undefined}
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: status?.isActive ? "var(--emerald-500)" : "var(--rose-500)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 600, fontSize: "1rem" }}>
                  {status?.isActive ? "Aktif" : "Nonaktif"}
                </span>
                {status?.isActive && (
                  <span className="pill pill-warm" style={{ marginLeft: "auto" }}>AKTIF</span>
                )}
              </div>
            )}
          </div>

          {/* Posisi Aktif */}
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "6px" }}>
              Posisi aktif
            </div>
            {statusLoading ? <Skeleton height={22} /> : (
              <div className="font-mono-num" style={{ fontWeight: 600, fontSize: "1.125rem" }}>
                {status?.openPositions}{" "}
                <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", fontWeight: 400 }}>
                  dari 5 max
                </span>
              </div>
            )}
          </div>

          {/* Logika Aktif */}
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "6px" }}>
              Logika aktif
            </div>
            {statusLoading ? <Skeleton height={22} /> : (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {status?.logic1Enabled && <span className="badge badge-emerald">L1</span>}
                {status?.logic2Enabled && <span className="badge badge-emerald">L2</span>}
                {status?.logic3Enabled && <span className="badge badge-emerald">L3</span>}
                {!status?.logic1Enabled && !status?.logic2Enabled && !status?.logic3Enabled && (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>—</span>
                )}
              </div>
            )}
          </div>

          {/* PnL Total */}
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "6px" }}>
              PnL 7 trade terakhir
            </div>
            <div className="font-mono-num" style={{
              fontWeight: 600, fontSize: "1.125rem",
              color: totalPnlSol >= 0 ? "var(--emerald-400)" : "var(--rose-400)",
            }}>
              {totalPnlSol >= 0 ? "+" : ""}{totalPnlSol.toFixed(4)} SOL
            </div>
          </div>
        </div>

        {/* ===== BOT CONTROLS ===== */}
        <div
          className="card animate-fade-in"
          style={{
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginRight: "4px" }}>Kontrol bot</span>
          <div className={`toggle-switch ${status?.isActive ? "active" : ""}`} title="Bot ON/OFF" />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetch("/api/bot/stop", { method: "POST", body: JSON.stringify({ userId: "default" }) })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            Pause
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => fetch("/api/bot/stop", { method: "POST", body: JSON.stringify({ userId: "default" }) })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            Emergency Stop
          </button>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
              {signals.length} sinyal diproses hari ini
            </span>
          </div>
        </div>

        {/* ===== MAIN GRID ===== */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "24px",
        }}>

          {/* ===== POSISI AKTIF (Left) ===== */}
          <div className="animate-fade-in">
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}>
              <h3>Posisi aktif</h3>
              <a href="/posisi" style={{ fontSize: "0.8125rem", color: "var(--emerald-400)", textDecoration: "none" }}>
                Lihat semua
              </a>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {posLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} height={80} />)
              ) : positions.length === 0 ? (
                <div className="card card-sm" style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "24px" }}>
                  Tidak ada posisi aktif
                </div>
              ) : positions.map((pos, i) => {
                const pct = pnlPct(pos);
                const progress = tpProgress(pos);
                const label = pos.symbol ?? pos.name ?? pos.ca.slice(0, 8);
                const logics = pos.logics_triggered ?? "—";
                return (
                  <div
                    key={pos.ca}
                    className="card card-sm animate-slide-in-top"
                    style={{
                      animationDelay: `${i * 50}ms`,
                      borderColor: pct >= 0 ? "var(--emerald-border)" : "var(--rose-border)",
                      background: pct >= 0 ? "rgba(16,185,129,0.02)" : "rgba(244,63,94,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{label}</span>
                        <span className="badge badge-neutral">{logics}</span>
                      </div>
                      <span className="font-mono-num" style={{
                        fontWeight: 600,
                        color: pct >= 0 ? "var(--emerald-400)" : "var(--rose-400)",
                      }}>
                        {pct >= 0 ? "+" : ""}{(pct * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                        {relativeTime(pos.opened_at)}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>TP progress</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill animate-fill-bar"
                        style={{
                          width: `${progress * 100}%`,
                          ["--fill-width" as string]: `${progress * 100}%`,
                          background: pct >= 0 ? "var(--emerald-500)" : "var(--rose-500)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== SINYAL TERBARU (Right) ===== */}
          <div className="animate-fade-in">
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}>
              <h3>Sinyal terbaru</h3>
              <a href="/sinyal" style={{ fontSize: "0.8125rem", color: "var(--emerald-400)", textDecoration: "none" }}>
                Lihat semua
              </a>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {sigLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} height={60} />)
              ) : signals.length === 0 ? (
                <div className="card card-sm" style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "24px" }}>
                  Belum ada sinyal
                </div>
              ) : signals.map((sig, i) => {
                const label = sig.symbol ?? sig.name ?? sig.ca.slice(0, 8);
                const color = decisionColor(sig.decision);
                const pct = Math.round(sig.confidence_score * 100);
                const decisionLabel = sig.decision === "BUY" ? "Beli" : sig.decision === "SKIP" ? "Skip" : "Watchlist";
                return (
                  <div
                    key={`${sig.ca}-${sig.executed_at}`}
                    className="card card-sm animate-slide-in-top"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                        <span className={`badge badge-neutral`}>{sig.logics_triggered ?? "—"}</span>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{label}</span>
                      </div>
                      <span className={`badge badge-${color}`}>{decisionLabel}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Confidence</span>
                        <div style={{ width: "60px", height: "4px", borderRadius: "2px", background: "var(--bg-tertiary)", overflow: "hidden" }}>
                          <div
                            className="animate-fill-bar"
                            style={{
                              width: `${pct}%`,
                              ["--fill-width" as string]: `${pct}%`,
                              height: "100%",
                              borderRadius: "2px",
                              background: pct >= 65 ? "var(--emerald-500)" : pct >= 50 ? "var(--amber-500)" : "var(--rose-500)",
                            }}
                          />
                        </div>
                        <span className="font-mono-num" style={{
                          fontSize: "0.75rem",
                          color: pct >= 65 ? "var(--emerald-400)" : pct >= 50 ? "var(--amber-400)" : "var(--rose-400)",
                        }}>{pct}</span>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {relativeTime(sig.executed_at)}
                      </span>
                    </div>
                    {sig.skip_reason && (
                      <div style={{
                        marginTop: "8px", paddingTop: "8px",
                        borderTop: "1px solid var(--border-primary)",
                        fontSize: "0.8125rem", color: "var(--text-tertiary)", fontStyle: "italic",
                      }}>
                        {sig.skip_reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===== EQUITY CURVE ===== */}
        <div className="card animate-fade-in" style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3>PnL per trade (7 terakhir)</h3>
            <span className="font-mono-num" style={{
              fontSize: "0.875rem",
              color: totalPnlSol >= 0 ? "var(--emerald-400)" : "var(--rose-400)",
              fontWeight: 500,
            }}>
              {totalPnlSol >= 0 ? "+" : ""}{totalPnlSol.toFixed(4)} SOL total
            </span>
          </div>
          {equityData.length === 0 ? (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Belum ada riwayat trade
            </div>
          ) : (
            <div style={{ width: "100%", height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityData}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 12 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      fontSize: "0.8125rem",
                      color: "#fafafa",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [`${Number(value) > 0 ? "+" : ""}${value} SOL`, "PnL"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={<CustomDot />}
                    activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "#09090b" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ===== TRUST ELEMENTS FOOTER ===== */}
        <div
          className="animate-fade-in"
          style={{
            marginTop: "24px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-primary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: status?.isActive ? "var(--emerald-500)" : "var(--rose-500)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
              Bot: <span className="font-mono-num" style={{ color: status?.isActive ? "var(--emerald-400)" : "var(--rose-400)" }}>
                {status?.isActive ? "Running" : "Stopped"}
              </span>
            </span>
          </div>
          <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Data live dari database
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
