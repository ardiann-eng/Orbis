"use client";

import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useApi } from "../hooks/useApi";

interface TokenRecord {
  ca: string;
  name: string | null;
  symbol: string | null;
  image_hash: string | null;
  created_at: number;
  market_cap_usd: number | null;
  liquidity_usd: number | null;
  volume_24h: number | null;
  holder_count: number | null;
}

function SkeletonRow() {
  return (
    <tr>
      <td colSpan={7}>
        <div style={{
          width: "100%", height: 32, borderRadius: 4,
          background: "var(--bg-tertiary)", animation: "pulse 1.5s ease-in-out infinite"
        }} />
      </td>
    </tr>
  );
}

export default function ScannerPage() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<TokenRecord | null>(null);

  // Fetch the latest tokens detected by the Helius/PumpPortal ingestion engine
  const { data, loading } = useApi<{ tokens: TokenRecord[] }>(
    "/api/tokens?limit=100",
    { tokens: [] }
  );

  const tokens = data?.tokens ?? [];

  const filtered = tokens.filter((t) => {
    // In a real scenario, scanner filters would map to specific token metadata
    // For now, we display all new tokens caught by the ingestion engine
    if (filter === "l1") return t.market_cap_usd && t.market_cap_usd > 10000;
    if (filter === "l2") return t.volume_24h && t.volume_24h > 5000;
    return true;
  });

  function relativeTime(ts: number) {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return `${Math.floor(diff)}d lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)} hari`;
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Scanner Token Baru (Live)</h2>

        {/* Filter bar */}
        <div className="card" style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginRight: "4px" }}>Filter:</span>
          {[
            { id: "all", label: "Semua Token" },
            { id: "l1", label: "MCap > $10k" },
            { id: "l2", label: "Volume Tinggi" },
          ].map((f) => (
            <button
              key={f.id}
              className={`btn btn-sm ${filter === f.id ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFilter(f.id)}
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
                <th>MCap</th>
                <th>Liquidity</th>
                <th>Volume 24h</th>
                <th>Holders</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 Array.from({ length: 15 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    color: "var(--text-tertiary)",
                  }}>
                    Bot sedang memindai pasar (Pump.fun)... Belum ada token baru terdeteksi.
                  </td>
                </tr>
              ) : filtered.map((token, i) => {
                const label = token.symbol ?? token.name ?? token.ca.slice(0, 8);
                const isSelected = selected?.ca === token.ca;

                return (
                  <tr
                    key={token.ca}
                    className="animate-slide-in-top"
                    style={{
                      animationDelay: `${i * 30}ms`,
                      cursor: "pointer",
                      background: isSelected ? "rgba(255,255,255,0.02)" : undefined,
                    }}
                    onClick={() => setSelected(isSelected ? null : token)}
                  >
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{token.name ?? "Unknown"}</span>
                      <span style={{ color: "var(--text-muted)", marginLeft: "6px", fontSize: "0.75rem" }}>{label}</span>
                    </td>
                    <td className="font-mono-num">{relativeTime(token.created_at)}</td>
                    <td className="font-mono-num">{token.market_cap_usd ? `$${Math.round(token.market_cap_usd).toLocaleString()}` : "—"}</td>
                    <td className="font-mono-num">{token.liquidity_usd ? `$${Math.round(token.liquidity_usd).toLocaleString()}` : "—"}</td>
                    <td className="font-mono-num">{token.volume_24h ? `$${Math.round(token.volume_24h).toLocaleString()}` : "—"}</td>
                    <td className="font-mono-num">{token.holder_count ?? "—"}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setSelected(token); }}>
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-in detail panel */}
      {selected && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 45 }}
            onClick={() => setSelected(null)}
          />
          <div className="slide-panel" style={{ padding: "32px", overflowY: "auto" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px",
            }}>
              <h2>{selected.name ?? "Unknown"} ({selected.symbol ?? selected.ca.slice(0,4)})</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Tutup</button>
            </div>

            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "0.875rem", marginBottom: "12px" }}>Contract Address</h3>
              <div className="font-mono-num" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>
                {selected.ca}
              </div>
            </div>

            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "0.875rem", marginBottom: "12px" }}>Helius / PumpPortal Data</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Market Cap</span>
                  <div className="font-mono-num" style={{ fontSize: "0.875rem" }}>
                    {selected.market_cap_usd ? `$${Math.round(selected.market_cap_usd).toLocaleString()}` : "—"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Liquidity</span>
                  <div className="font-mono-num" style={{ fontSize: "0.875rem" }}>
                    {selected.liquidity_usd ? `$${Math.round(selected.liquidity_usd).toLocaleString()}` : "—"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Holders</span>
                  <div className="font-mono-num" style={{ fontSize: "0.875rem" }}>
                    {selected.holder_count ?? "—"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Created</span>
                  <div className="font-mono-num" style={{ fontSize: "0.875rem" }}>
                    {new Date(selected.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={() => window.open(`https://pump.fun/${selected.ca}`)}
              >
                Buka di Pump.fun
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => window.open(`https://solscan.io/token/${selected.ca}`)}
              >
                Cek Solscan
              </button>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
