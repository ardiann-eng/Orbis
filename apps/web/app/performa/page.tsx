"use client";

import DashboardLayout from "../components/DashboardLayout";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";

const EQUITY_DATA = [
  { date: "1 Mar", value: 2.0, hold: 2.0 },
  { date: "3 Mar", value: 2.12, hold: 1.95 },
  { date: "5 Mar", value: 2.08, hold: 1.88 },
  { date: "7 Mar", value: 2.34, hold: 2.05 },
  { date: "9 Mar", value: 2.28, hold: 2.1 },
  { date: "11 Mar", value: 2.55, hold: 2.2 },
  { date: "13 Mar", value: 2.71, hold: 2.15 },
  { date: "15 Mar", value: 2.85, hold: 2.25 },
];

export default function PerformaPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <h2>Performa bot</h2>
          <span className="badge badge-amber">Premium</span>
        </div>

        {/* Stats grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "24px",
        }}>
          {[
            { label: "Win rate", value: "64%", sub: "dari 47 trade" },
            { label: "Total PnL", value: "+0.85 SOL", color: "var(--emerald-400)" },
            { label: "Avg return", value: "+18.3%", color: "var(--emerald-400)" },
            { label: "Best trade", value: "+127.4%", color: "var(--emerald-400)" },
            { label: "Max drawdown", value: "-12.8%", color: "var(--rose-400)" },
          ].map((stat, i) => (
            <div key={i} className="card card-sm">
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>
                {stat.label}
              </div>
              <div className="font-mono-num" style={{
                fontSize: "1.25rem", fontWeight: 600,
                color: stat.color || "var(--text-primary)",
              }}>
                {stat.value}
              </div>
              {stat.sub && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {stat.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Breakdown per sinyal */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "16px" }}>Breakdown per sinyal</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { label: "Token baru (L1)", winRate: "71%", trades: 21, avgReturn: "+22.4%", bestNarrative: "ai" },
              { label: "Volume spike (L2)", winRate: "58%", trades: 15, avgReturn: "+14.1%", bestNarrative: "defi" },
              { label: "Buzz Telegram (L3)", winRate: "55%", trades: 11, avgReturn: "+12.8%", bestNarrative: "meme" },
            ].map((sig, i) => (
              <div key={i} style={{
                padding: "16px",
                background: "var(--bg-tertiary)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-primary)",
              }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "12px" }}>{sig.label}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>Win rate</span>
                    <span className="font-mono-num" style={{ color: "var(--emerald-400)" }}>{sig.winRate}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>Total trade</span>
                    <span className="font-mono-num">{sig.trades}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>Avg return</span>
                    <span className="font-mono-num" style={{ color: "var(--emerald-400)" }}>{sig.avgReturn}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>Best narrative</span>
                    <span className="pill pill-warm">{sig.bestNarrative}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full equity curve */}
        <div className="card">
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px",
          }}>
            <h3>Equity curve</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              {["7 hari", "30 hari", "Semua"].map((f, i) => (
                <button key={i} className={`btn btn-sm ${i === 1 ? "btn-secondary" : "btn-ghost"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{
            display: "flex", gap: "16px", marginBottom: "12px", fontSize: "0.75rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: 12, height: 2, background: "var(--emerald-500)" }} />
              <span style={{ color: "var(--text-tertiary)" }}>ORBIS</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: 12, height: 2, background: "var(--text-muted)", opacity: 0.5 }} />
              <span style={{ color: "var(--text-tertiary)" }}>Hold SOL</span>
            </div>
          </div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={EQUITY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} domain={["dataMin - 0.1", "dataMax + 0.1"]} />
                <Tooltip
                  contentStyle={{
                    background: "#18181b", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px", fontSize: "0.8125rem",
                  }}
                />
                <ReferenceLine y={2.0} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} name="ORBIS" />
                <Line type="monotone" dataKey="hold" stroke="#52525b" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Hold SOL" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
