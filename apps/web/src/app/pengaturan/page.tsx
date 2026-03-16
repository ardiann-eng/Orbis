"use client";

import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

export default function PengaturanPage() {
  const [tab, setTab] = useState("mode");
  const [mode, setMode] = useState("seimbang");
  const [maxPerPos, setMaxPerPos] = useState(5);
  const [maxOpen, setMaxOpen] = useState(3);
  const [dailyLoss, setDailyLoss] = useState(15);
  const [signals, setSignals] = useState({ l1: true, l2: true, l3: true });
  const [minConfidence, setMinConfidence] = useState(65);
  const [minChannels, setMinChannels] = useState(3);
  const [tp1Gain, setTp1Gain] = useState(30);
  const [tp1Sell, setTp1Sell] = useState(40);
  const [tp2Gain, setTp2Gain] = useState(80);
  const [tp2Sell, setTp2Sell] = useState(35);
  const [trailing, setTrailing] = useState(30);
  const [stopLoss, setStopLoss] = useState(20);
  const [timeExit, setTimeExit] = useState(4);

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Pengaturan bot</h2>

        {/* Tabs */}
        <div className="tab-group" style={{ marginBottom: "24px" }}>
          {[
            { id: "mode", label: "Mode & Risk" },
            { id: "sinyal", label: "Sinyal" },
            { id: "exit", label: "Exit Strategy" },
          ].map((t) => (
            <button
              key={t.id}
              className={`tab-item ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Mode & Risk */}
        {tab === "mode" && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "12px", display: "block" }}>
                Preset mode
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { id: "konservatif", label: "Konservatif" },
                  { id: "seimbang", label: "Seimbang" },
                  { id: "agresif", label: "Agresif" },
                ].map((m) => (
                  <button
                    key={m.id}
                    className={`btn ${mode === m.id ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setMode(m.id)}
                    style={{ flex: 1 }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Max per posisi (%)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input type="range" min={1} max={15} value={maxPerPos} onChange={(e) => setMaxPerPos(Number(e.target.value))}
                    style={{ flex: 1, accentColor: "var(--emerald-500)" }} />
                  <span className="font-mono-num" style={{ width: "40px", textAlign: "right" }}>{maxPerPos}%</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Max posisi bersamaan
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input type="range" min={1} max={5} value={maxOpen} onChange={(e) => setMaxOpen(Number(e.target.value))}
                    style={{ flex: 1, accentColor: "var(--emerald-500)" }} />
                  <span className="font-mono-num" style={{ width: "40px", textAlign: "right" }}>{maxOpen}</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Daily loss limit (%)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input type="range" min={5} max={30} value={dailyLoss} onChange={(e) => setDailyLoss(Number(e.target.value))}
                    style={{ flex: 1, accentColor: "var(--emerald-500)" }} />
                  <span className="font-mono-num" style={{ width: "40px", textAlign: "right" }}>{dailyLoss}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Sinyal */}
        {tab === "sinyal" && (
          <div className="animate-fade-in">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {[
                { id: "l1", label: "Token baru (L1)" },
                { id: "l2", label: "Volume spike (L2)" },
                { id: "l3", label: "Buzz Telegram (L3)" },
              ].map((s) => (
                <div key={s.id} className="card" style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: "0.9375rem", fontWeight: 500 }}>{s.label}</span>
                  <div
                    className={`toggle-switch ${signals[s.id as keyof typeof signals] ? "active" : ""}`}
                    onClick={() => setSignals({ ...signals, [s.id]: !signals[s.id as keyof typeof signals] })}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Min confidence untuk auto-buy
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input type="range" min={50} max={90} value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))}
                    style={{ flex: 1, accentColor: "var(--emerald-500)" }} />
                  <span className="font-mono-num" style={{ width: "40px", textAlign: "right" }}>{minConfidence}</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Min unique channels (TG Buzz)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input type="range" min={2} max={8} value={minChannels} onChange={(e) => setMinChannels(Number(e.target.value))}
                    style={{ flex: 1, accentColor: "var(--emerald-500)" }} />
                  <span className="font-mono-num" style={{ width: "40px", textAlign: "right" }}>{minChannels}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Exit Strategy */}
        {tab === "exit" && (
          <div className="animate-fade-in">
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="card">
                <h3 style={{ fontSize: "0.9375rem", marginBottom: "16px" }}>Take Profit Level 1</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>
                      Target gain (%)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input type="range" min={10} max={100} value={tp1Gain} onChange={(e) => setTp1Gain(Number(e.target.value))}
                        style={{ flex: 1, accentColor: "var(--emerald-500)" }} />
                      <span className="font-mono-num" style={{ width: "40px" }}>+{tp1Gain}%</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>
                      Jual (%)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input type="range" min={10} max={100} value={tp1Sell} onChange={(e) => setTp1Sell(Number(e.target.value))}
                        style={{ flex: 1, accentColor: "var(--emerald-500)" }} />
                      <span className="font-mono-num" style={{ width: "40px" }}>{tp1Sell}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: "0.9375rem", marginBottom: "16px" }}>Take Profit Level 2</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>
                      Target gain (%)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input type="range" min={10} max={200} value={tp2Gain} onChange={(e) => setTp2Gain(Number(e.target.value))}
                        style={{ flex: 1, accentColor: "var(--emerald-500)" }} />
                      <span className="font-mono-num" style={{ width: "40px" }}>+{tp2Gain}%</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>
                      Jual (%)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input type="range" min={10} max={100} value={tp2Sell} onChange={(e) => setTp2Sell(Number(e.target.value))}
                        style={{ flex: 1, accentColor: "var(--emerald-500)" }} />
                      <span className="font-mono-num" style={{ width: "40px" }}>{tp2Sell}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    Trailing stop (%)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="range" min={10} max={50} value={trailing} onChange={(e) => setTrailing(Number(e.target.value))}
                      style={{ flex: 1, accentColor: "var(--emerald-500)" }} />
                    <span className="font-mono-num" style={{ width: "40px" }}>{trailing}%</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    Stop loss (%)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="range" min={5} max={50} value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))}
                      style={{ flex: 1, accentColor: "var(--rose-500)" }} />
                    <span className="font-mono-num" style={{ width: "40px" }}>{stopLoss}%</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    Time exit (jam)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="range" min={1} max={24} value={timeExit} onChange={(e) => setTimeExit(Number(e.target.value))}
                      style={{ flex: 1, accentColor: "var(--amber-500)" }} />
                    <span className="font-mono-num" style={{ width: "40px" }}>{timeExit}j</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="btn btn-primary" style={{ marginTop: "24px" }}>Simpan pengaturan</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
