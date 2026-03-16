"use client";

import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useApi } from "../hooks/useApi";

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

function Skeleton({ width = "100%", height = 60 }: { width?: string | number; height?: number }) {
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

export default function SinyalPage() {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, loading } = useApi<{ signals: Signal[] }>(
    `/api/signals?limit=50&decision=${filter === "semua" ? "all" : filter.toUpperCase()}`,
    { signals: [] }
  );

  const signals = data?.signals ?? [];

  function relativeTime(ts: number) {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return `${Math.floor(diff)}d lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    return `${Math.floor(diff / 3600)}j lalu`;
  }

  function decisionColor(d: string) {
    if (d === "BUY") return "emerald";
    if (d === "SKIP") return "rose";
    return "amber";
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Sinyal baru</h2>

        {/* Filter */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[
            { id: "all", label: "Semua" },
            { id: "buy", label: "Beli" },
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
          {loading ? (
             [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} />)
          ) : signals.length === 0 ? (
             <div className="card" style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
               Belum ada data sinyal sesuai filter ini.
             </div>
          ) : signals.map((sig, i) => {
            const label = sig.symbol ?? sig.name ?? sig.ca.slice(0, 8);
            const logics = sig.logics_triggered ?? "—";
            const color = decisionColor(sig.decision);
            const pct = Math.round(sig.confidence_score * 100);
            const decisionLabel = sig.decision === "BUY" ? "Beli" : sig.decision === "SKIP" ? "Skip" : "Watchlist";

            return (
              <div
                key={`${sig.ca}-${sig.executed_at}`}
                className="card animate-slide-in-top"
                style={{
                  animationDelay: `${i * 40}ms`,
                  cursor: sig.skip_reason ? "pointer" : undefined,
                }}
                onClick={() => sig.skip_reason && setExpanded(expanded === `${sig.ca}-${sig.executed_at}` ? null : `${sig.ca}-${sig.executed_at}`)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className={`badge badge-${color}`}>{decisionLabel}</span>
                    <span className="badge badge-neutral">{logics}</span>
                    <span style={{ fontWeight: 600 }}>{label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{
                        width: "48px", height: "4px", borderRadius: "2px",
                        background: "var(--bg-tertiary)", overflow: "hidden",
                      }}>
                        <div className="animate-fill-bar" style={{
                          width: `${pct}%`,
                          ["--fill-width" as string]: `${pct}%`,
                          height: "100%", borderRadius: "2px",
                          background: pct >= 65 ? "var(--emerald-500)" : pct >= 50 ? "var(--amber-500)" : "var(--rose-500)",
                        }} />
                      </div>
                      <span className="font-mono-num" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        {pct}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{relativeTime(sig.executed_at)}</span>
                  </div>
                </div>

                {/* Reasoning "Kenapa bot skip ini?" */}
                {sig.skip_reason && expanded === `${sig.ca}-${sig.executed_at}` && (
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
                      Kenapa bot skip token ini?
                    </div>
                    <div style={{
                      fontSize: "0.8125rem", color: "var(--text-tertiary)", lineHeight: 1.6,
                    }}>
                      {sig.skip_reason}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); window.open(`https://pump.fun/${sig.ca}`);}}>
                        Buka di Pump.fun
                      </button>
                    </div>
                  </div>
                )}

                {sig.skip_reason && expanded !== `${sig.ca}-${sig.executed_at}` && (
                  <div style={{
                    marginTop: "8px",
                    fontSize: "0.75rem",
                    color: "var(--emerald-400)",
                    cursor: "pointer",
                  }}>
                    Lihat alasan
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
