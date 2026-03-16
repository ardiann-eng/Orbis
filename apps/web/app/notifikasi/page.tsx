"use client";

import DashboardLayout from "../components/DashboardLayout";

const NOTIFICATIONS = [
  { type: "entry", title: "Bot entry ZEUS", desc: "Confidence 82, logika L1+L3. Posisi dibuka dengan 0.14 SOL.", time: "2 menit lalu", read: false },
  { type: "tp", title: "Partial TP CRUX tercapai", desc: "Level 1 (+30%) tercapai. 40% posisi dijual. Profit +0.09 SOL.", time: "15 menit lalu", read: false },
  { type: "skip", title: "Bot skip DRIFT", desc: "Wash trading terdeteksi. Top 3 wallet = 68% volume.", time: "23 menit lalu", read: true },
  { type: "regime", title: "Market regime berubah", desc: "Regime berubah dari HOT ke WARM. Threshold confidence dinaikkan ke 75.", time: "1 jam lalu", read: true },
  { type: "warning", title: "Cascade warning", desc: "2 loss berturut-turut hari ini. 1 lagi dan bot akan pause otomatis.", time: "2 jam lalu", read: true },
  { type: "entry", title: "Bot entry NXRA", desc: "Confidence 71, logika L2. Volume spike Z-score 4.2.", time: "3 jam lalu", read: true },
];

const typeColors: Record<string, string> = {
  entry: "emerald",
  tp: "emerald",
  skip: "amber",
  regime: "amber",
  warning: "rose",
};

export default function NotifikasiPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Notifikasi</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {NOTIFICATIONS.map((n, i) => (
            <div
              key={i}
              className="card animate-slide-in-top"
              style={{
                animationDelay: `${i * 40}ms`,
                opacity: n.read ? 0.7 : 1,
                borderColor: !n.read ? "var(--border-secondary)" : undefined,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  {!n.read && (
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "var(--emerald-500)", flexShrink: 0,
                    }} />
                  )}
                  <span className={`badge badge-${typeColors[n.type]}`}>{n.type}</span>
                  <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{n.title}</span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>{n.time}</span>
              </div>
              <div style={{
                fontSize: "0.8125rem", color: "var(--text-tertiary)", marginTop: "4px",
                marginLeft: !n.read ? "14px" : 0,
              }}>
                {n.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
