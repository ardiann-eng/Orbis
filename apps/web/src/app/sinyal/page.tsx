"use client";

import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

const SIGNALS = [
  {
    token: "PULSE", logika: "L1", decision: "Dieksekusi", confidence: 82, time: "2 menit lalu",
    color: "emerald", reasoning: null,
  },
  {
    token: "DRIFT", logika: "L2", decision: "Di-skip", confidence: 41, time: "8 menit lalu",
    color: "rose",
    reasoning: "Skip karena wash trading terdeteksi. Top 3 wallet menguasai 68% volume (batas aman: 60%). Buy/sell ratio 0.3 (terlalu banyak sell). Hanya 7 wallet unik aktif.",
  },
  {
    token: "APEX", logika: "L3", decision: "Watchlist", confidence: 58, time: "15 menit lalu",
    color: "amber",
    reasoning: "Buzz di 3 channel Telegram (moderate), tapi belum ada konfirmasi on-chain dari Logika 1 atau 2. Menunggu sinyal tambahan sebelum entry otomatis.",
  },
  {
    token: "MOON", logika: "L1+L2", decision: "Dieksekusi", confidence: 91, time: "23 menit lalu",
    color: "emerald", reasoning: null,
  },
  {
    token: "NXRA", logika: "L2", decision: "Dieksekusi", confidence: 71, time: "1j 22m lalu",
    color: "emerald", reasoning: null,
  },
  {
    token: "VOID", logika: "L1", decision: "Di-skip", confidence: 33, time: "1j 45m lalu",
    color: "rose",
    reasoning: "Skip karena holder concentration 71% (batas aman: 60%). Risk score terlalu tinggi. Developer wallet pernah launch 2 token yang rug sebelumnya.",
  },
  {
    token: "DARK", logika: "L3", decision: "Di-skip", confidence: 28, time: "2j 10m lalu",
    color: "rose",
    reasoning: "Buzz hanya dari 2 channel (di bawah threshold minimum 3). Salah satu channel tier 3 dengan accuracy rate 22%. Tidak cukup bukti untuk entry.",
  },
  {
    token: "CRUX", logika: "L1+L3", decision: "Dieksekusi", confidence: 88, time: "3j 5m lalu",
    color: "emerald", reasoning: null,
  },
];

export default function SinyalPage() {
  const [filter, setFilter] = useState("semua");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = SIGNALS.filter((s) => {
    if (filter === "eksekusi" && s.decision !== "Dieksekusi") return false;
    if (filter === "skip" && s.decision !== "Di-skip") return false;
    if (filter === "watchlist" && s.decision !== "Watchlist") return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Sinyal baru</h2>

        {/* Filter */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[
            { id: "semua", label: "Semua" },
            { id: "eksekusi", label: "Dieksekusi" },
            { id: "skip", label: "Di-skip" },
            { id: "watchlist", label: "Watchlist" },
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

        {/* Signal feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((sig, i) => (
            <div
              key={i}
              className="card animate-slide-in-top"
              style={{
                animationDelay: `${i * 40}ms`,
                cursor: sig.reasoning ? "pointer" : undefined,
              }}
              onClick={() => sig.reasoning && setExpanded(expanded === sig.token + sig.time ? null : sig.token + sig.time)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className={`badge badge-${sig.color}`}>{sig.decision}</span>
                  <span className="badge badge-neutral">{sig.logika}</span>
                  <span style={{ fontWeight: 600 }}>{sig.token}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{
                      width: "48px", height: "4px", borderRadius: "2px",
                      background: "var(--bg-tertiary)", overflow: "hidden",
                    }}>
                      <div className="animate-fill-bar" style={{
                        width: `${sig.confidence}%`,
                        ["--fill-width" as string]: `${sig.confidence}%`,
                        height: "100%", borderRadius: "2px",
                        background: sig.confidence >= 65 ? "var(--emerald-500)" : sig.confidence >= 50 ? "var(--amber-500)" : "var(--rose-500)",
                      }} />
                    </div>
                    <span className="font-mono-num" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      {sig.confidence}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sig.time}</span>
                </div>
              </div>

              {/* Reasoning "Kenapa bot skip ini?" */}
              {sig.reasoning && expanded === sig.token + sig.time && (
                <div
                  className="animate-fade-in"
                  style={{
                    marginTop: "12px", paddingTop: "12px",
                    borderTop: "1px solid var(--border-primary)",
                  }}
                >
                  <div style={{
                    fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px",
                  }}>
                    {sig.decision === "Di-skip" ? "Kenapa bot skip token ini?" : "Kenapa masuk watchlist?"}
                  </div>
                  <div style={{
                    fontSize: "0.8125rem", color: "var(--text-tertiary)", lineHeight: 1.6,
                  }}>
                    {sig.reasoning}
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <button className="btn btn-secondary btn-sm">Beli sekarang</button>
                    <button className="btn btn-ghost btn-sm">Tambah watchlist</button>
                  </div>
                </div>
              )}

              {sig.reasoning && expanded !== sig.token + sig.time && (
                <div style={{
                  marginTop: "8px",
                  fontSize: "0.75rem",
                  color: "var(--emerald-400)",
                  cursor: "pointer",
                }}>
                  {sig.decision === "Di-skip" ? "Kenapa bot skip token ini?" : "Lihat alasan"}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
