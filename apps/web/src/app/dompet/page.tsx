"use client";

import DashboardLayout from "../components/DashboardLayout";

const TX_HISTORY = [
  { date: "Hari ini, 09:14", type: "Trading fee", amount: "-0.002 SOL", status: "Confirmed" },
  { date: "Hari ini, 08:30", type: "Deposit", amount: "+1.000 SOL", status: "Confirmed" },
  { date: "Kemarin, 21:45", type: "Withdraw", amount: "-0.500 SOL", status: "Confirmed" },
  { date: "Kemarin, 14:12", type: "Trading fee", amount: "-0.003 SOL", status: "Confirmed" },
  { date: "2 hari lalu", type: "Deposit", amount: "+2.000 SOL", status: "Confirmed" },
];

export default function DompetPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Dompet bot</h2>

        {/* Wallet info */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "6px" }}>Alamat dompet bot</div>
            <div className="font-mono-num" style={{
              padding: "10px 14px", background: "var(--bg-primary)",
              borderRadius: "var(--radius-md)", border: "1px solid var(--border-primary)",
              fontSize: "0.875rem", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>7xKXtg2Qp...9sF4Wp</span>
              <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>Salin</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>SOL tersedia</div>
              <div className="font-mono-num" style={{ fontSize: "1.25rem", fontWeight: 600 }}>1.987 SOL</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Terkunci di posisi</div>
              <div className="font-mono-num" style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--amber-400)" }}>0.860 SOL</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Total saldo</div>
              <div className="font-mono-num" style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--emerald-400)" }}>2.847 SOL</div>
            </div>
          </div>

          <a href="#" style={{ fontSize: "0.8125rem", color: "var(--emerald-400)", textDecoration: "none" }}>
            Cek sendiri di Solscan &rarr;
          </a>
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div className="card" style={{ textAlign: "center" }}>
            <h3 style={{ marginBottom: "8px", fontSize: "1rem" }}>Deposit</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginBottom: "16px" }}>
              Transfer SOL dari Phantom ke dompet bot
            </p>
            <div style={{
              width: "120px", height: "120px", margin: "0 auto 16px",
              background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-secondary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", color: "var(--text-muted)",
            }}>
              QR Code
            </div>
            <div className="font-mono-num" style={{
              fontSize: "0.75rem", color: "var(--text-secondary)",
              padding: "8px", background: "var(--bg-primary)", borderRadius: "var(--radius-sm)",
            }}>
              7xKXtg2Qp...9sF4Wp
            </div>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <h3 style={{ marginBottom: "8px", fontSize: "1rem" }}>Withdraw</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginBottom: "16px" }}>
              Tarik SOL dari dompet bot ke Phantom
            </p>
            <div style={{ marginBottom: "12px" }}>
              <input
                type="number"
                placeholder="Jumlah SOL"
                className="font-mono-num"
                style={{ textAlign: "center", fontSize: "1.125rem", padding: "14px" }}
              />
            </div>
            <button className="btn btn-secondary" style={{ width: "100%" }}>
              Withdraw ke Phantom
            </button>
            <p style={{
              fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "12px",
            }}>
              Tidak bisa withdraw penuh jika ada posisi aktif
            </p>
          </div>
        </div>

        {/* Transaction history */}
        <h3 style={{ marginBottom: "12px" }}>Riwayat transaksi dompet</h3>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Tipe</th>
                <th>Jumlah</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {TX_HISTORY.map((tx, i) => (
                <tr key={i}>
                  <td>{tx.date}</td>
                  <td>{tx.type}</td>
                  <td className="font-mono-num" style={{
                    color: tx.amount.startsWith("+") ? "var(--emerald-400)" : "var(--rose-400)",
                  }}>{tx.amount}</td>
                  <td>
                    <span className="badge badge-emerald">{tx.status}</span>
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
