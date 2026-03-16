"use client";

import DashboardLayout from "../components/DashboardLayout";

const BUZZ_DATA = [
  { ca: "7xKX...4Wp", channels: 7, velocity: "2.4/m", strength: "Strong", firstSeen: "8 menit lalu", color: "emerald" },
  { ca: "3mNp...9Rq", channels: 5, velocity: "1.8/m", strength: "Strong", firstSeen: "14 menit lalu", color: "emerald" },
  { ca: "9vBz...2Hs", channels: 3, velocity: "0.6/m", strength: "Moderate", firstSeen: "22 menit lalu", color: "amber" },
  { ca: "5tLk...7Ym", channels: 9, velocity: "3.1/m", strength: "Extreme", firstSeen: "31 menit lalu", color: "rose" },
  { ca: "2bXc...1Fd", channels: 3, velocity: "0.4/m", strength: "Moderate", firstSeen: "45 menit lalu", color: "amber" },
];

const CHANNELS = [
  { name: "Solana Alpha Calls", tier: "1", members: "87,200", accuracy: "72%", status: "Aktif" },
  { name: "Pump.fun Signals", tier: "1", members: "52,100", accuracy: "68%", status: "Aktif" },
  { name: "Memecoin Indo", tier: "2", members: "14,800", accuracy: "54%", status: "Aktif" },
  { name: "Degen Plays", tier: "2", members: "23,400", accuracy: "51%", status: "Aktif" },
  { name: "SOL Micro Caps", tier: "3", members: "3,200", accuracy: "38%", status: "Aktif" },
  { name: "Crypto Snipers ID", tier: "3", members: "1,800", accuracy: "29%", status: "Error" },
];

export default function TgBuzzPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Buzz Telegram</h2>

        {/* Live CA trending */}
        <h3 style={{ marginBottom: "12px" }}>CA trending saat ini</h3>
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "32px" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Contract Address</th>
                <th>Channel</th>
                <th>Velocity</th>
                <th>Strength</th>
                <th>Pertama muncul</th>
              </tr>
            </thead>
            <tbody>
              {BUZZ_DATA.map((b, i) => (
                <tr key={i} className="animate-slide-in-top" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="font-mono-num" style={{ color: "var(--text-primary)" }}>{b.ca}</td>
                  <td className="font-mono-num">{b.channels}</td>
                  <td className="font-mono-num">{b.velocity}</td>
                  <td>
                    <span className={`badge badge-${b.color}`}>{b.strength}</span>
                  </td>
                  <td>{b.firstSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Channel monitor */}
        <h3 style={{ marginBottom: "12px" }}>Channel yang dimonitor</h3>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Tier</th>
                <th>Members</th>
                <th>Accuracy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {CHANNELS.map((ch, i) => (
                <tr key={i} className="animate-slide-in-top" style={{ animationDelay: `${i * 30}ms` }}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{ch.name}</td>
                  <td>
                    <span className={`badge badge-${ch.tier === "1" ? "emerald" : ch.tier === "2" ? "amber" : "neutral"}`}>
                      Tier {ch.tier}
                    </span>
                  </td>
                  <td className="font-mono-num">{ch.members}</td>
                  <td className="font-mono-num" style={{
                    color: parseInt(ch.accuracy) >= 60 ? "var(--emerald-400)" : parseInt(ch.accuracy) >= 40 ? "var(--amber-400)" : "var(--rose-400)",
                  }}>{ch.accuracy}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: ch.status === "Aktif" ? "var(--emerald-500)" : "var(--rose-500)",
                      }} />
                      <span style={{ color: ch.status === "Aktif" ? "var(--text-secondary)" : "var(--rose-400)" }}>
                        {ch.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
