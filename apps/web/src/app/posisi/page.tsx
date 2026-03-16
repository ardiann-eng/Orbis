"use client";

import DashboardLayout from "../components/DashboardLayout";

const POSITIONS = [
  {
    token: "ZEUS", logika: "L1+L3", entryTime: "14 menit lalu",
    entryPrice: "$0.00082", currentPrice: "$0.00108",
    pnl: "+32.4%", pnlVal: 0.324, pnlSol: "+0.14 SOL",
    tpLevels: [{ level: "+30%", done: true }, { level: "+80%", done: false }],
    trailingStop: false, progress: 0.65, narrative: "mythology",
  },
  {
    token: "AURA", logika: "L1", entryTime: "47 menit lalu",
    entryPrice: "$0.00045", currentPrice: "$0.00050",
    pnl: "+12.1%", pnlVal: 0.121, pnlSol: "+0.06 SOL",
    tpLevels: [{ level: "+30%", done: false }, { level: "+80%", done: false }],
    trailingStop: false, progress: 0.38, narrative: "ai",
  },
  {
    token: "NXRA", logika: "L2", entryTime: "1j 22m lalu",
    entryPrice: "$0.0042", currentPrice: "$0.0041",
    pnl: "-3.2%", pnlVal: -0.032, pnlSol: "-0.01 SOL",
    tpLevels: [{ level: "+30%", done: false }, { level: "+80%", done: false }],
    trailingStop: false, progress: 0.15, narrative: "defi",
  },
];

export default function PosisiPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Posisi aktif</h2>

        {/* Portfolio summary */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px",
        }}>
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Total nilai posisi</div>
            <div className="font-mono-num" style={{ fontSize: "1.125rem", fontWeight: 600 }}>0.86 SOL</div>
          </div>
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Unrealized PnL</div>
            <div className="font-mono-num" style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--emerald-400)" }}>+0.19 SOL</div>
          </div>
          <div className="card card-sm">
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Exposure narrative</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
              <span className="pill pill-warm">mythology</span>
              <span className="pill pill-warm">ai</span>
              <span className="pill pill-cold">defi</span>
            </div>
          </div>
        </div>

        {/* Protection status */}
        <div className="card" style={{
          marginBottom: "24px",
          display: "flex", gap: "32px", flexWrap: "wrap", alignItems: "center",
        }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Cascade stop</span>
            <div className="font-mono-num" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              0 <span style={{ color: "var(--text-muted)" }}>dari 3 loss berturut-turut</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Daily loss</span>
            <div className="font-mono-num" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              2.1% <span style={{ color: "var(--text-muted)" }}>dari 15% limit</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Exposure per logika</span>
            <div style={{ display: "flex", gap: "12px", marginTop: "2px" }}>
              <span className="font-mono-num" style={{ fontSize: "0.8125rem" }}>L1 <span style={{ color: "var(--emerald-400)" }}>30%</span></span>
              <span className="font-mono-num" style={{ fontSize: "0.8125rem" }}>L2 <span style={{ color: "var(--amber-400)" }}>20%</span></span>
              <span className="font-mono-num" style={{ fontSize: "0.8125rem" }}>L3 <span style={{ color: "var(--text-secondary)" }}>10%</span></span>
            </div>
          </div>
        </div>

        {/* Position cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {POSITIONS.map((pos, i) => (
            <div
              key={i}
              className="card animate-slide-in-top"
              style={{
                animationDelay: `${i * 50}ms`,
                borderColor: pos.pnlVal >= 0 ? "var(--emerald-border)" : "var(--rose-border)",
                background: pos.pnlVal >= 0 ? "rgba(16,185,129,0.015)" : "rgba(244,63,94,0.015)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, fontSize: "1.0625rem" }}>{pos.token}</span>
                    <span className="badge badge-neutral">{pos.logika}</span>
                    <span className="pill pill-warm" style={{ fontSize: "0.6875rem" }}>{pos.narrative}</span>
                  </div>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>{pos.entryTime}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="font-mono-num" style={{
                    fontSize: "1.25rem", fontWeight: 600,
                    color: pos.pnlVal >= 0 ? "var(--emerald-400)" : "var(--rose-400)",
                  }}>
                    {pos.pnl}
                  </div>
                  <div className="font-mono-num" style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
                    {pos.pnlSol}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Harga masuk</span>
                  <div className="font-mono-num" style={{ fontSize: "0.875rem" }}>{pos.entryPrice}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Harga saat ini</span>
                  <div className="font-mono-num" style={{ fontSize: "0.875rem" }}>{pos.currentPrice}</div>
                </div>
              </div>

              {/* TP progress */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Progress menuju TP</span>
                  <span className="font-mono-num" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {Math.round(pos.progress * 100)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{
                    width: `${pos.progress * 100}%`,
                    background: pos.pnlVal >= 0 ? "var(--emerald-500)" : "var(--rose-500)",
                  }} />
                </div>
              </div>

              {/* TP levels */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                {pos.tpLevels.map((tp, j) => (
                  <span key={j} className={`badge badge-${tp.done ? "emerald" : "neutral"}`}>
                    {tp.done ? "\u2713 " : ""}{tp.level}
                  </span>
                ))}
                {pos.trailingStop && (
                  <span className="badge badge-amber">Trailing stop aktif</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-danger btn-sm">Jual sekarang</button>
                <button className="btn btn-secondary btn-sm">Ubah TP/SL</button>
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }}>
                  Lihat di Solscan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
