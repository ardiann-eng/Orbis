"use client";

import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

const TOKENS = [
  { name: "PULSE", ticker: "PULSE", age: "3m", logika: "L1", risk: "green", confidence: 82, price: "$0.00043", change: "+18.2%", changeVal: 1 },
  { name: "DRIFT", ticker: "DRIFT", age: "12m", logika: "L2", risk: "red", confidence: 41, price: "$0.0021", change: "+5.1%", changeVal: 1 },
  { name: "APEX", ticker: "APEX", age: "28m", logika: "L3", risk: "yellow", confidence: 58, price: "$0.00091", change: "+42.7%", changeVal: 1 },
  { name: "MOON", ticker: "MOON", age: "7m", logika: "L1+L2", risk: "green", confidence: 91, price: "$0.0015", change: "+67.3%", changeVal: 1 },
  { name: "NEON", ticker: "NEON", age: "45m", logika: "L1", risk: "green", confidence: 73, price: "$0.00028", change: "+22.9%", changeVal: 1 },
  { name: "VOID", ticker: "VOID", age: "1h", logika: "L2", risk: "yellow", confidence: 55, price: "$0.0087", change: "-2.1%", changeVal: -1 },
  { name: "CRUX", ticker: "CRUX", age: "15m", logika: "L1+L3", risk: "green", confidence: 88, price: "$0.0034", change: "+35.6%", changeVal: 1 },
  { name: "FLUX", ticker: "FLUX", age: "52m", logika: "L3", risk: "yellow", confidence: 62, price: "$0.00019", change: "+8.4%", changeVal: 1 },
];

const DETAIL_DATA = {
  socialTwitter: true,
  socialTelegram: true,
  socialWebsite: true,
  volumeScore: 28,
  buzzScore: 15,
  firstBuyerScore: 12,
  narrativeScore: 8,
  riskFlags: ["Holder concentration 38% (batas: 60%) — aman", "RugCheck score: 180/1000 — risiko rendah"],
  holders: [
    { label: "Wallet #1", share: 12 },
    { label: "Wallet #2", share: 9 },
    { label: "Wallet #3", share: 7 },
    { label: "Wallet #4", share: 5 },
    { label: "Wallet #5", share: 4 },
    { label: "Lainnya", share: 63 },
  ],
  bondingCurve: 42,
};

const riskColors: Record<string, string> = {
  green: "var(--emerald-500)",
  yellow: "var(--amber-500)",
  red: "var(--rose-500)",
};

export default function ScannerPage() {
  const [filter, setFilter] = useState("semua");
  const [riskFilter, setRiskFilter] = useState("semua");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = TOKENS.filter((t) => {
    if (filter === "l1" && !t.logika.includes("L1")) return false;
    if (filter === "l2" && !t.logika.includes("L2")) return false;
    if (filter === "l3" && !t.logika.includes("L3")) return false;
    if (riskFilter !== "semua" && t.risk !== riskFilter) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Scanner token</h2>

        {/* Filter bar */}
        <div className="card" style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginRight: "4px" }}>Sinyal:</span>
          {[
            { id: "semua", label: "Semua" },
            { id: "l1", label: "Token baru" },
            { id: "l2", label: "Volume spike" },
            { id: "l3", label: "TG Buzz" },
          ].map((f) => (
            <button
              key={f.id}
              className={`btn btn-sm ${filter === f.id ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}

          <div style={{ width: "1px", height: "20px", background: "var(--border-secondary)", margin: "0 8px" }} />

          <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginRight: "4px" }}>Risk:</span>
          {[
            { id: "semua", label: "Semua" },
            { id: "green", label: "Hijau" },
            { id: "yellow", label: "Kuning" },
            { id: "red", label: "Merah" },
          ].map((f) => (
            <button
              key={f.id}
              className={`btn btn-sm ${riskFilter === f.id ? "btn-secondary" : "btn-ghost"}`}
              onClick={() => setRiskFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Umur</th>
                <th>Sinyal</th>
                <th>Risk</th>
                <th>Confidence</th>
                <th>Harga</th>
                <th>Perubahan</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    color: "var(--text-tertiary)",
                  }}>
                    Bot sedang memindai pasar. Biasanya ada sinyal dalam 1-5 menit.
                  </td>
                </tr>
              ) : filtered.map((token, i) => (
                <tr
                  key={i}
                  className="animate-slide-in-top"
                  style={{
                    animationDelay: `${i * 30}ms`,
                    cursor: "pointer",
                    background: selected === token.name ? "rgba(255,255,255,0.02)" : undefined,
                  }}
                  onClick={() => setSelected(selected === token.name ? null : token.name)}
                >
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{token.name}</span>
                    <span style={{ color: "var(--text-muted)", marginLeft: "6px", fontSize: "0.75rem" }}>{token.ticker}</span>
                  </td>
                  <td className="font-mono-num">{token.age}</td>
                  <td><span className="badge badge-neutral">{token.logika}</span></td>
                  <td>
                    <span style={{
                      display: "inline-block",
                      width: 8, height: 8,
                      borderRadius: "50%",
                      background: riskColors[token.risk],
                    }} />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "48px", height: "4px", borderRadius: "2px",
                        background: "var(--bg-tertiary)", overflow: "hidden",
                      }}>
                        <div className="animate-fill-bar" style={{
                          width: `${token.confidence}%`,
                          ["--fill-width" as string]: `${token.confidence}%`,
                          height: "100%", borderRadius: "2px",
                          background: token.confidence >= 65 ? "var(--emerald-500)" : token.confidence >= 50 ? "var(--amber-500)" : "var(--rose-500)",
                        }} />
                      </div>
                      <span className="font-mono-num" style={{ fontSize: "0.8125rem" }}>{token.confidence}</span>
                    </div>
                  </td>
                  <td className="font-mono-num">{token.price}</td>
                  <td className="font-mono-num" style={{
                    color: token.changeVal >= 0 ? "var(--emerald-400)" : "var(--rose-400)",
                  }}>{token.change}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setSelected(token.name); }}>
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-in detail panel */}
      {selected && (
        <>
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
              zIndex: 45,
            }}
            onClick={() => setSelected(null)}
          />
          <div className="slide-panel" style={{ padding: "32px" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px",
            }}>
              <h2>{selected}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Tutup</button>
            </div>

            {/* Price chart placeholder */}
            <div className="card" style={{
              height: "140px", display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "20px", color: "var(--text-muted)", fontSize: "0.8125rem",
            }}>
              Grafik harga 1 jam (TradingView Lightweight)
            </div>

            {/* Confidence breakdown */}
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "0.875rem", marginBottom: "12px" }}>Breakdown confidence</h3>
              {[
                { label: "Volume & sinyal", score: DETAIL_DATA.volumeScore, max: 40 },
                { label: "Buzz Telegram", score: DETAIL_DATA.buzzScore, max: 30 },
                { label: "First buyer", score: DETAIL_DATA.firstBuyerScore, max: 20 },
                { label: "Narrative", score: DETAIL_DATA.narrativeScore, max: 10 },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px",
                }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", width: "110px", flexShrink: 0 }}>
                    {item.label}
                  </span>
                  <div style={{ flex: 1, height: "6px", background: "var(--bg-tertiary)", borderRadius: "3px", overflow: "hidden" }}>
                    <div className="animate-fill-bar" style={{
                      width: `${(item.score / item.max) * 100}%`,
                      ["--fill-width" as string]: `${(item.score / item.max) * 100}%`,
                      height: "100%", borderRadius: "3px", background: "var(--emerald-500)",
                    }} />
                  </div>
                  <span className="font-mono-num" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", width: "40px", textAlign: "right" }}>
                    {item.score}/{item.max}
                  </span>
                </div>
              ))}
            </div>

            {/* Risk flags */}
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "0.875rem", marginBottom: "8px" }}>Risk check</h3>
              {DETAIL_DATA.riskFlags.map((flag, i) => (
                <div key={i} style={{
                  fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px",
                  display: "flex", alignItems: "flex-start", gap: "6px",
                }}>
                  <span style={{ color: "var(--emerald-400)", flexShrink: 0 }}>&#10003;</span>
                  {flag}
                </div>
              ))}
            </div>

            {/* Social links */}
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "0.875rem", marginBottom: "8px" }}>Social links</h3>
              <div style={{ display: "flex", gap: "12px" }}>
                {[
                  { label: "Twitter", ok: DETAIL_DATA.socialTwitter },
                  { label: "Telegram", ok: DETAIL_DATA.socialTelegram },
                  { label: "Website", ok: DETAIL_DATA.socialWebsite },
                ].map((s, i) => (
                  <span key={i} className={`badge badge-${s.ok ? "emerald" : "rose"}`}>
                    {s.ok ? "\u2713" : "\u2717"} {s.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Holder distribution */}
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "0.875rem", marginBottom: "12px" }}>Holder distribution</h3>
              {DETAIL_DATA.holders.map((h, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px",
                }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", width: "70px" }}>{h.label}</span>
                  <div style={{ flex: 1, height: "8px", background: "var(--bg-tertiary)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      width: `${h.share}%`, height: "100%", borderRadius: "4px",
                      background: i === 0 ? "var(--amber-500)" : "var(--emerald-500)",
                      opacity: 1 - i * 0.1,
                    }} />
                  </div>
                  <span className="font-mono-num" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", width: "30px", textAlign: "right" }}>
                    {h.share}%
                  </span>
                </div>
              ))}
            </div>

            {/* Bonding curve */}
            <div className="card" style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "0.875rem", marginBottom: "8px" }}>Bonding curve (Pump.fun)</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1, height: "8px", background: "var(--bg-tertiary)", borderRadius: "4px", overflow: "hidden" }}>
                  <div className="animate-fill-bar" style={{
                    width: `${DETAIL_DATA.bondingCurve}%`,
                    ["--fill-width" as string]: `${DETAIL_DATA.bondingCurve}%`,
                    height: "100%", borderRadius: "4px", background: "var(--emerald-500)",
                  }} />
                </div>
                <span className="font-mono-num" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  {DETAIL_DATA.bondingCurve}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" style={{ flex: 1 }}>Buy sekarang</button>
              <button className="btn btn-secondary" style={{ flex: 1 }}>Tambah watchlist</button>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
