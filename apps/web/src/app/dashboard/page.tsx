"use client";

import DashboardLayout from "../components/DashboardLayout";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Dot,
} from "recharts";

/* ===== MOCK DATA ===== */
const EQUITY_DATA = [
  { day: "Sen", pnl: 0.12, color: "#10b981" },
  { day: "Sel", pnl: -0.03, color: "#f43f5e" },
  { day: "Rab", pnl: 0.08, color: "#10b981" },
  { day: "Kam", pnl: 0.21, color: "#10b981" },
  { day: "Jum", pnl: -0.05, color: "#f43f5e" },
  { day: "Sab", pnl: 0.15, color: "#10b981" },
  { day: "Min", pnl: 0.09, color: "#10b981" },
];

const POSITIONS = [
  { token: "ZEUS", pnl: "+32.4%", pnlValue: 0.324, entryTime: "14 menit lalu", progress: 0.65, logika: "L1+L3" },
  { token: "AURA", pnl: "+12.1%", pnlValue: 0.121, entryTime: "47 menit lalu", progress: 0.38, logika: "L1" },
  { token: "NXRA", pnl: "-3.2%", pnlValue: -0.032, entryTime: "1j 22m lalu", progress: 0.15, logika: "L2" },
];

const SIGNALS = [
  { token: "PULSE", logika: "L1", decision: "Beli", confidence: 82, time: "2 menit lalu", color: "emerald" },
  { token: "DRIFT", logika: "L2", decision: "Skip", confidence: 41, time: "8 menit lalu", color: "rose", reason: "Wash trading terdeteksi (top 3 wallet = 68%)" },
  { token: "APEX", logika: "L3", decision: "Watchlist", confidence: 58, time: "15 menit lalu", color: "amber", reason: "Buzz di 3 channel, menunggu konfirmasi on-chain" },
  { token: "MOON", logika: "L1+L2", decision: "Beli", confidence: 91, time: "23 menit lalu", color: "emerald" },
];

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

export default function DashboardPage() {
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                className="animate-pulse-dot"
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "var(--emerald-500)", flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 600, fontSize: "1rem" }}>Aktif</span>
              <span className="pill pill-warm" style={{ marginLeft: "auto" }}>WARM</span>
            </div>
          </div>

          {/* Saldo */}
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "6px" }}>
              Saldo dompet bot
            </div>
            <div className="font-mono-num" style={{ fontWeight: 600, fontSize: "1.125rem" }}>
              2.847 SOL
            </div>
          </div>

          {/* PnL Hari Ini */}
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "6px" }}>
              PnL hari ini
            </div>
            <div className="font-mono-num" style={{
              fontWeight: 600, fontSize: "1.125rem",
              color: "var(--emerald-400)",
            }}>
              +0.34 SOL (+13.6%)
            </div>
          </div>

          {/* Posisi Aktif */}
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "6px" }}>
              Posisi aktif
            </div>
            <div className="font-mono-num" style={{ fontWeight: 600, fontSize: "1.125rem" }}>
              3 <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", fontWeight: 400 }}>dari 3 max</span>
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
          <div className="toggle-switch active" title="Bot ON/OFF" />
          <button className="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            Pause
          </button>
          <button className="btn btn-danger btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            Emergency Stop
          </button>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Market regime:</span>
            <span className="pill pill-warm">WARM</span>
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
              <a href="/posisi" style={{
                fontSize: "0.8125rem",
                color: "var(--emerald-400)",
                textDecoration: "none",
              }}>
                Lihat semua
              </a>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {POSITIONS.map((pos, i) => (
                <div
                  key={i}
                  className="card card-sm animate-slide-in-top"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    borderColor: pos.pnlValue >= 0 ? "var(--emerald-border)" : "var(--rose-border)",
                    background: pos.pnlValue >= 0 ? "rgba(16,185,129,0.02)" : "rgba(244,63,94,0.02)",
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{pos.token}</span>
                      <span className="badge badge-neutral">{pos.logika}</span>
                    </div>
                    <span className="font-mono-num" style={{
                      fontWeight: 600,
                      color: pos.pnlValue >= 0 ? "var(--emerald-400)" : "var(--rose-400)",
                    }}>
                      {pos.pnl}
                    </span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                      {pos.entryTime}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                      TP progress
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill animate-fill-bar"
                      style={{
                        width: `${pos.progress * 100}%`,
                        ["--fill-width" as string]: `${pos.progress * 100}%`,
                        background: pos.pnlValue >= 0 ? "var(--emerald-500)" : "var(--rose-500)",
                      }}
                    />
                  </div>
                </div>
              ))}
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
              <a href="/sinyal" style={{
                fontSize: "0.8125rem",
                color: "var(--emerald-400)",
                textDecoration: "none",
              }}>
                Lihat semua
              </a>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {SIGNALS.map((sig, i) => (
                <div
                  key={i}
                  className="card card-sm animate-slide-in-top"
                  style={{ animationDelay: `${i * 50}ms`, cursor: sig.reason ? "pointer" : undefined }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                      <span className={`badge badge-${sig.color}`}>{sig.logika}</span>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{sig.token}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className={`badge badge-${sig.color}`} style={{ marginBottom: "4px" }}>
                        {sig.decision}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "8px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                        Confidence
                      </span>
                      <div style={{
                        width: "60px",
                        height: "4px",
                        borderRadius: "2px",
                        background: "var(--bg-tertiary)",
                        overflow: "hidden",
                      }}>
                        <div
                          className="animate-fill-bar"
                          style={{
                            width: `${sig.confidence}%`,
                            ["--fill-width" as string]: `${sig.confidence}%`,
                            height: "100%",
                            borderRadius: "2px",
                            background: sig.confidence >= 65 ? "var(--emerald-500)" : sig.confidence >= 50 ? "var(--amber-500)" : "var(--rose-500)",
                          }}
                        />
                      </div>
                      <span className="font-mono-num" style={{
                        fontSize: "0.75rem",
                        color: sig.confidence >= 65 ? "var(--emerald-400)" : sig.confidence >= 50 ? "var(--amber-400)" : "var(--rose-400)",
                      }}>
                        {sig.confidence}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {sig.time}
                    </span>
                  </div>
                  {sig.reason && (
                    <div style={{
                      marginTop: "8px",
                      paddingTop: "8px",
                      borderTop: "1px solid var(--border-primary)",
                      fontSize: "0.8125rem",
                      color: "var(--text-tertiary)",
                      fontStyle: "italic",
                    }}>
                      {sig.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== EQUITY CURVE ===== */}
        <div className="card animate-fade-in" style={{ marginTop: "24px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}>
            <h3>PnL 7 hari terakhir</h3>
            <span className="font-mono-num" style={{
              fontSize: "0.875rem",
              color: "var(--emerald-400)",
              fontWeight: 500,
            }}>
              +0.57 SOL total
            </span>
          </div>
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={EQUITY_DATA}>
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
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald-500)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
              Latency: <span className="font-mono-num" style={{ color: "var(--emerald-400)" }}>142ms</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald-500)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
              Uptime: <span className="font-mono-num" style={{ color: "var(--text-secondary)" }}>99.7%</span>
            </span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Data diperbarui 2 detik lalu
          </div>
          <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            ORBIS Engine v1.3 — 14 logika aktif
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
