"use client";

import DashboardLayout from "../components/DashboardLayout";

const FAQ = [
  {
    q: "Bagaimana cara kerja ORBIS?",
    a: "ORBIS menggunakan 14 logika berlapis untuk memindai, menganalisis, dan mengeksekusi trading token memecoin di Solana. Bot memantau token baru, volume spike, dan buzz di Telegram. Setiap token harus lolos semua filter sebelum bot mengambil keputusan.",
  },
  {
    q: "Apakah dana saya aman?",
    a: "Dompet bot terpisah dari dompet utamamu (Phantom). Kunci private di-generate di browser dan dienkripsi sebelum dikirim ke server. Bot hanya bisa melakukan trading, tidak bisa transfer keluar tanpa persetujuanmu. Kamu bisa cek semua transaksi di Solscan kapan saja.",
  },
  {
    q: "Berapa modal minimum?",
    a: "Minimum 0.1 SOL, tapi kami rekomendasikan 0.5-1 SOL untuk pemula. Bot akan membagi modal ke banyak posisi kecil, bukan dihabiskan sekaligus.",
  },
  {
    q: "Apa itu market regime?",
    a: "ORBIS membaca kondisi pasar saat ini. HOT = pasar aktif, bot agresif. WARM = pasar normal, bot lebih selektif. COLD = pasar turun, bot berhenti entry dan hanya kirim alert.",
  },
  {
    q: "Kenapa bot skip sebuah token?",
    a: "Setiap token yang di-skip punya alasan spesifik. Bisa karena risk score terlalu tinggi, holder concentration berbahaya, developer wallet pernah rug, atau wash trading terdeteksi. Kamu bisa lihat alasan lengkapnya di halaman Sinyal.",
  },
  {
    q: "Bagaimana cara pause atau stop bot?",
    a: "Di dashboard, kamu bisa: (1) Pause — bot berhenti membuka posisi baru tapi tetap mengelola posisi aktif. (2) Emergency Stop — bot langsung jual semua posisi dan berhenti total. Butuh 2 klik konfirmasi.",
  },
  {
    q: "Apa perbedaan tiga sinyal?",
    a: "Token baru (L1): bot masuk saat token baru launch di Pump.fun. Volume spike (L2): bot masuk saat volume token lama melonjak. Buzz Telegram (L3): bot masuk saat banyak channel Telegram menyebutkan token yang sama.",
  },
  {
    q: "Apakah bot bisa rugi?",
    a: "Ya. Trading memecoin berisiko sangat tinggi. Bot menggunakan stop loss, trailing stop, dan cascade stop untuk membatasi kerugian, tapi tidak bisa menjamin profit. Selalu gunakan dana yang siap hilang.",
  },
];

export default function BantuanPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <h2 style={{ marginBottom: "8px" }}>Bantuan</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
          Pertanyaan yang sering diajukan tentang ORBIS.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="card"
              style={{ cursor: "pointer" }}
            >
              <summary style={{
                fontWeight: 600,
                fontSize: "0.9375rem",
                listStyle: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                {item.q}
                <span style={{ color: "var(--text-muted)", fontSize: "1.25rem", fontWeight: 300 }}>+</span>
              </summary>
              <div style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid var(--border-primary)",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
              }}>
                {item.a}
              </div>
            </details>
          ))}
        </div>

        <div className="card" style={{ marginTop: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
            Tidak menemukan jawaban?
          </p>
          <button className="btn btn-secondary">Hubungi kami di Telegram</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
