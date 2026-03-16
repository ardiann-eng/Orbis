"use client";

import DashboardLayout from "../components/DashboardLayout";
import { useApi } from "../hooks/useApi";

const TX_HISTORY = [
  { date: "Hari ini, 09:14", type: "Trading fee", amount: "-0.002 SOL", status: "Confirmed" },
  { date: "Hari ini, 08:30", type: "Deposit", amount: "+1.000 SOL", status: "Confirmed" },
];

export default function DompetPage() {
  const { data, loading, refetch } = useApi<any>('/api/wallet/balance?userId=default', {});

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: "24px 32px" }}>
          <h2 style={{ marginBottom: "20px" }}>Dompet bot</h2>
          <div className="card animate-pulse" style={{ height: "150px", marginBottom: "24px" }} />
          <div className="card animate-pulse" style={{ height: "200px" }} />
        </div>
      </DashboardLayout>
    );
  }

  const walletData = data || {};
  const publicKey = walletData.publicKey || "Belum Dibuat";
  const solBalance = walletData.totalSol || 0;
  const lockedSol = walletData.lockedSol || 0;
  const solBalanceUSD = walletData.solBalanceUSD || 0;
  const solPriceUSD = walletData.solPriceUSD || 0;
  const tokens = walletData.tokens || [];

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "20px" }}>Dompet bot</h2>

        {/* Wallet info */}
        <div className="card" style={{ marginBottom: "24px", background: "var(--bg-tertiary)" }}>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "6px" }}>ALAMAT DOMPET BOT (REAL)</div>
            <div className="font-mono-num" style={{
              padding: "10px 14px", background: "var(--bg-primary)",
              borderRadius: "var(--radius-md)", border: "1px solid var(--border-primary)",
              fontSize: "0.875rem", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span className="break-all">{publicKey}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => copyToClipboard(publicKey)} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>Copy</button>
                {publicKey !== "Belum Dibuat" && (
                  <a href={`https://solscan.io/account/${publicKey}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", color: "var(--emerald-400)" }}>
                    Solscan ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>SALDO SOL</div>
              <div className="font-mono-num" style={{ fontSize: "1.5rem", fontWeight: 600 }}>
                {solBalance.toFixed(4)} <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>SOL</span>
              </div>
              <div className="font-mono-num" style={{ fontSize: "0.875rem", color: "var(--text-tertiary)" }}>
                ≈ ${solBalanceUSD.toLocaleString('en', { maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                1 SOL = ${solPriceUSD.toLocaleString('en', { maximumFractionDigits: 2 })}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>TERKUNCI (DI POSISI)</div>
              <div className="font-mono-num" style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--amber-400)" }}>
                {lockedSol.toFixed(4)} <span style={{ fontSize: "0.875rem", color: "var(--amber-400)", opacity: 0.7 }}>SOL</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>UPDATE TERAKHIR</div>
                <div className="font-mono-num" style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  {walletData.lastUpdated ? new Date(walletData.lastUpdated).toLocaleTimeString('id') : "Sekarang"}
                </div>
              </div>
              <div>
                <button onClick={() => refetch()} className="btn btn-secondary btn-sm" style={{ width: "100%", marginTop: "8px" }}>
                  Refresh Saldo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Token SPL */}
        {tokens.length > 0 && (
          <div className="card" style={{ marginBottom: "24px", padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
              <h3 style={{ fontSize: "0.875rem", margin: 0 }}>Token SPL di Dompet</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token Mint</th>
                  <th style={{ textAlign: "right" }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token: any) => (
                  <tr key={token.mint}>
                    <td className="font-mono-num" style={{ fontSize: "0.8125rem" }}>
                      {token.mint}
                    </td>
                    <td className="font-mono-num" style={{ textAlign: "right", fontWeight: 500 }}>
                      {token.balance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div className="card" style={{ textAlign: "center" }}>
            <h3 style={{ marginBottom: "8px", fontSize: "1rem" }}>Deposit SOL</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginBottom: "16px" }}>
              Transfer SOL ke alamat dompet bot ini.
            </p>
            <div className="font-mono-num" style={{
              fontSize: "0.75rem", color: "var(--emerald-400)",
              padding: "12px", background: "rgba(16,185,129,0.1)", borderRadius: "var(--radius-sm)",
              wordBreak: "break-all"
            }}>
              {publicKey !== "Belum Dibuat" ? publicKey : "Buat dompet dulu di wizard"}
            </div>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <h3 style={{ marginBottom: "8px", fontSize: "1rem" }}>Withdraw SOL</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginBottom: "16px" }}>
              Tarik SOL dari dompet bot ke dompet aslimu.
            </p>
            <button className="btn btn-secondary" style={{ width: "100%", padding: "12px" }}>
              Tarik ke Wallet Utama
            </button>
            <p style={{
              fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "12px",
            }}>
              Tidak bisa ditarik penuh jika ada token belum terjual
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
