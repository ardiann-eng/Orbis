"use client";

import DashboardLayout from "../components/DashboardLayout";

const WALLETS = [
  {
    label: "Smart Money #1",
    address: "Ck3n...8mPw",
    pnl7d: "+342%",
    trades7d: 28,
    winRate: "78%",
    lastTrade: "12 menit lalu",
    recentTokens: ["ZEUS", "CRUX", "NOVA"],
  },
  {
    label: "Smart Money #2",
    address: "9bVx...4Rqn",
    pnl7d: "+218%",
    trades7d: 15,
    winRate: "73%",
    lastTrade: "45 menit lalu",
    recentTokens: ["MOON", "PRISM"],
  },
  {
    label: "Whale Tracker",
    address: "3mNp...7YqR",
    pnl7d: "+89%",
    trades7d: 8,
    winRate: "62%",
    lastTrade: "2 jam lalu",
    recentTokens: ["AURA", "FLUX", "BLZE"],
  },
  {
    label: "Degen Alpha",
    address: "5tLk...2Hsv",
    pnl7d: "+561%",
    trades7d: 42,
    winRate: "52%",
    lastTrade: "5 menit lalu",
    recentTokens: ["PULSE", "DRIFT", "VOID", "DARK"],
  },
  {
    label: "Custom Wallet",
    address: "7xKX...1Fdd",
    pnl7d: "-12%",
    trades7d: 3,
    winRate: "33%",
    lastTrade: "1 hari lalu",
    recentTokens: ["NXRA"],
  },
];

export default function PantauWalletPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>Pantau wallet</h2>
          <button className="btn btn-secondary btn-sm">Tambah wallet</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {WALLETS.map((w, i) => (
            <div key={i} className="card animate-slide-in-top" style={{ animationDelay: `${i * 50}ms` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "2px" }}>{w.label}</div>
                  <div className="font-mono-num" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{w.address}</div>
                </div>
                <div className="font-mono-num" style={{
                  fontSize: "1.125rem", fontWeight: 600,
                  color: w.pnl7d.startsWith("+") ? "var(--emerald-400)" : "var(--rose-400)",
                }}>
                  {w.pnl7d}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Trade 7d</div>
                  <div className="font-mono-num" style={{ fontSize: "0.875rem" }}>{w.trades7d}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Win rate</div>
                  <div className="font-mono-num" style={{
                    fontSize: "0.875rem",
                    color: parseInt(w.winRate) >= 60 ? "var(--emerald-400)" : "var(--text-secondary)",
                  }}>{w.winRate}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Last trade</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{w.lastTrade}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "4px" }}>Token terbaru</div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {w.recentTokens.map((t, j) => (
                    <span key={j} className="badge badge-neutral">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
