"use client";

import DashboardLayout from "../components/DashboardLayout";

const TRADES = [
  { token: "ZEUS", logika: "L1+L3", entry: "$0.00082", exit: "$0.00108", pnl: "+32.4%", pnlSol: "+0.14", date: "Hari ini, 09:14", result: "profit" },
  { token: "CRUX", logika: "L1+L3", entry: "$0.0034", exit: "$0.0052", pnl: "+52.9%", pnlSol: "+0.22", date: "Hari ini, 07:30", result: "profit" },
  { token: "FLUX", logika: "L3", entry: "$0.00019", exit: "$0.00016", pnl: "-15.8%", pnlSol: "-0.04", date: "Kemarin, 21:12", result: "loss" },
  { token: "NOVA", logika: "L2", entry: "$0.0087", exit: "$0.0095", pnl: "+9.2%", pnlSol: "+0.05", date: "Kemarin, 18:45", result: "profit" },
  { token: "BLZE", logika: "L1", entry: "$0.00045", exit: "$0.00039", pnl: "-13.3%", pnlSol: "-0.03", date: "Kemarin, 14:20", result: "loss" },
  { token: "PRISM", logika: "L2", entry: "$0.0021", exit: "$0.0033", pnl: "+57.1%", pnlSol: "+0.28", date: "2 hari lalu", result: "profit" },
  { token: "VORT", logika: "L1", entry: "$0.00091", exit: "$0.00122", pnl: "+34.1%", pnlSol: "+0.15", date: "2 hari lalu", result: "profit" },
  { token: "SHADE", logika: "L3", entry: "$0.0015", exit: "$0.0012", pnl: "-20.0%", pnlSol: "-0.06", date: "3 hari lalu", result: "loss" },
];

export default function RiwayatPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Riwayat trading</h2>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Sinyal</th>
                <th>Harga masuk</th>
                <th>Harga keluar</th>
                <th>PnL</th>
                <th>Profit/Loss</th>
                <th>Tanggal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {TRADES.map((t, i) => (
                <tr key={i} className="animate-slide-in-top" style={{ animationDelay: `${i * 25}ms` }}>
                  <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.token}</td>
                  <td><span className="badge badge-neutral">{t.logika}</span></td>
                  <td className="font-mono-num">{t.entry}</td>
                  <td className="font-mono-num">{t.exit}</td>
                  <td className="font-mono-num" style={{
                    color: t.result === "profit" ? "var(--emerald-400)" : "var(--rose-400)",
                    fontWeight: 600,
                  }}>{t.pnl}</td>
                  <td className="font-mono-num" style={{
                    color: t.result === "profit" ? "var(--emerald-400)" : "var(--rose-400)",
                  }}>{t.pnlSol} SOL</td>
                  <td>{t.date}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: "0.75rem" }}>Solscan</button>
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
