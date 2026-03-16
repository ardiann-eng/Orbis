"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  "Disclaimer",
  "Buat Dompet",
  "Isi Saldo",
  "Gaya Trading",
  "Sinyal",
  "Review",
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0",
      marginBottom: "48px",
    }}>
      {STEPS.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8125rem",
              fontWeight: 600,
              background: i <= current ? "var(--emerald-500)" : "var(--bg-tertiary)",
              color: i <= current ? "#fff" : "var(--text-tertiary)",
              border: `1px solid ${i <= current ? "var(--emerald-600)" : "var(--border-secondary)"}`,
              transition: "all 150ms ease",
            }}>
              {i < current ? "\u2713" : i + 1}
            </div>
            <span style={{
              fontSize: "0.6875rem",
              color: i <= current ? "var(--text-secondary)" : "var(--text-muted)",
              whiteSpace: "nowrap",
            }}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              width: "40px",
              height: "1px",
              background: i < current ? "var(--emerald-500)" : "var(--border-secondary)",
              margin: "0 8px",
              marginBottom: "22px",
              transition: "background 150ms ease",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1({ onNext, checks, setChecks }: {
  onNext: () => void;
  checks: [boolean, boolean];
  setChecks: (c: [boolean, boolean]) => void;
}) {
  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: "8px" }}>Sebelum mulai, bacalah ini dulu</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "0.9375rem" }}>
        ORBIS adalah alat bantu trading — bukan jaminan profit. Pastikan kamu paham risikonya.
      </p>

      <div className="card" style={{
        marginBottom: "32px",
        background: "var(--bg-tertiary)",
      }}>
        <div style={{
          fontSize: "0.875rem",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          marginBottom: "24px",
        }}>
          Trading memecoin adalah aktivitas berisiko sangat tinggi. Harga token bisa turun ke nol dalam hitungan menit.
          Bot ini menggunakan 14 logika berlapis untuk memfilter peluang, tetapi tidak ada sistem yang bisa menjamin profit.
          Kamu bertanggung jawab penuh atas keputusan finansialmu.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label className="checkbox-custom">
            <input
              type="checkbox"
              checked={checks[0]}
              onChange={() => setChecks([!checks[0], checks[1]])}
            />
            <span>Saya mengerti ini bukan saran investasi dan semua risiko ada di tangan saya.</span>
          </label>
          <label className="checkbox-custom">
            <input
              type="checkbox"
              checked={checks[1]}
              onChange={() => setChecks([checks[0], !checks[1]])}
            />
            <span>Saya akan menggunakan dana yang siap hilang, bukan tabungan utama saya.</span>
          </label>
        </div>
      </div>

      <button
        className="btn btn-primary"
        disabled={!checks[0] || !checks[1]}
        onClick={onNext}
        style={{ minWidth: "180px" }}
      >
        Lanjutkan
      </button>
    </div>
  );
}

function Step2({ onNext }: { onNext: () => void }) {
  const [created, setCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [publicKey, setPublicKey] = useState("");

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/wallet/create?userId=default", { method: "POST" });
      const data = await res.json();
      if (data.success && data.publicKey) {
        setPublicKey(data.publicKey);
        setCreated(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicKey);
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: "8px" }}>Buat dompet khusus untuk bot kamu</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "0.9375rem" }}>
        Bot butuh dompet sendiri yang terpisah dari dompet utamamu. Ini untuk melindungi aset utamamu — bot hanya bisa akses dompet ini, bukan dompet Phantom-mu.
      </p>

      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>Alamat dompet bot</span>
          {created && <span className="badge badge-emerald">Terenkripsi</span>}
        </div>
        <div className="font-mono-num" style={{
          padding: "12px 16px",
          background: "var(--bg-primary)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-primary)",
          fontSize: "0.875rem",
          color: created ? "var(--text-primary)" : "var(--text-muted)",
          letterSpacing: "0.02em",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{created ? publicKey : "••••••••••••••••••"}</span>
          {created && (
            <button
              onClick={copyToClipboard}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
              title="Copy to clipboard"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          )}
        </div>
      </div>

      {!created ? (
        <button
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={creating}
          style={{ minWidth: "180px" }}
        >
          {creating ? "Membuat dompet..." : "Buat Dompet Bot"}
        </button>
      ) : (
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
            color: "var(--emerald-400)",
            fontSize: "0.875rem",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            Dompet berhasil dibuat dan terenkripsi
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginBottom: "24px" }}>
            Kunci dompet ini disimpan terenkripsi. Tidak ada yang bisa mengaksesnya selain kamu — termasuk kami.
          </p>
          <button className="btn btn-primary" onClick={onNext} style={{ minWidth: "180px" }}>
            Lanjutkan
          </button>
        </div>
      )}
    </div>
  );
}

function Step3({ onNext, balance, setBalance }: {
  onNext: () => void;
  balance: number;
  setBalance: (b: number) => void;
}) {
  const quickPicks = [0.5, 1, 2, 5];
  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: "8px" }}>Isi saldo dompet bot kamu</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "0.9375rem" }}>
        Transfer SOL dari dompet Phantom kamu ke dompet bot. Ini adalah &ldquo;modal kerja&rdquo; bot — mulai dari jumlah kecil dulu.
      </p>

      <div style={{ marginBottom: "16px" }}>
        <label style={{
          fontSize: "0.8125rem",
          color: "var(--text-tertiary)",
          display: "block",
          marginBottom: "8px",
        }}>
          Jumlah SOL
        </label>
        <input
          type="number"
          value={balance || ""}
          onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className="font-mono-num"
          style={{
            fontSize: "1.5rem",
            padding: "16px 20px",
            textAlign: "center",
          }}
        />
      </div>

      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "16px",
      }}>
        {quickPicks.map((amt) => (
          <button
            key={amt}
            className={`btn ${balance === amt ? "btn-primary" : "btn-secondary"} btn-sm`}
            onClick={() => setBalance(amt)}
            style={{ flex: 1 }}
          >
            {amt} SOL
          </button>
        ))}
      </div>

      <p style={{
        fontSize: "0.8125rem",
        color: "var(--text-tertiary)",
        marginBottom: "8px",
      }}>
        Saran untuk pemula: mulai dengan 0.5-1 SOL. Bot akan membagi modal ini ke banyak posisi kecil, bukan dihabiskan sekaligus.
      </p>
      <p style={{
        fontSize: "0.8125rem",
        color: "var(--text-tertiary)",
        marginBottom: "24px",
      }}>
        Kamu bisa tambah atau tarik saldo kapan saja dari halaman Dompet.
      </p>

      <button
        className="btn btn-primary"
        disabled={balance < 0.1}
        onClick={onNext}
        style={{ minWidth: "180px" }}
      >
        Lanjutkan
      </button>
    </div>
  );
}

function Step4({ onNext, mode, setMode }: {
  onNext: () => void;
  mode: string;
  setMode: (m: string) => void;
}) {
  const presets = [
    { id: "konservatif", label: "Konservatif", desc: "Hanya token yang sangat meyakinkan", max: "2%" },
    { id: "seimbang", label: "Seimbang", desc: "Rekomendasi untuk pemula", max: "5%", default: true },
    { id: "agresif", label: "Agresif", desc: "Lebih banyak entry, risiko lebih tinggi", max: "10%" },
  ];

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: "8px" }}>Pilih gaya trading kamu</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "0.9375rem" }}>
        Ini menentukan seberapa berani bot akan masuk ke sebuah token. Kamu bisa ubah ini kapan saja.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setMode(p.id)}
            className="card"
            style={{
              cursor: "pointer",
              textAlign: "left",
              borderColor: mode === p.id ? "var(--emerald-500)" : undefined,
              background: mode === p.id ? "rgba(16,185,129,0.04)" : undefined,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div>
              <div style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                {p.label}
                {p.default && <span className="badge badge-emerald">Default</span>}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
                {p.desc}
              </div>
            </div>
            <div className="font-mono-num" style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: mode === p.id ? "var(--emerald-400)" : "var(--text-secondary)",
            }}>
              {p.max}
            </div>
          </button>
        ))}
      </div>

      <button className="btn btn-primary" onClick={onNext} style={{ minWidth: "180px" }}>
        Lanjutkan
      </button>
    </div>
  );
}

function Step5({ onNext, signals, setSignals }: {
  onNext: () => void;
  signals: Record<string, boolean>;
  setSignals: (s: Record<string, boolean>) => void;
}) {
  const options = [
    {
      id: "newCoin",
      label: "Token baru",
      desc: "Bot masuk saat token baru launch di Pump.fun dan lolos semua filter kualitas.",
    },
    {
      id: "volumeSpike",
      label: "Volume spike",
      desc: "Bot masuk saat volume token lama tiba-tiba melonjak drastis — biasanya pertanda ada yang terjadi.",
    },
    {
      id: "tgBuzz",
      label: "Buzz Telegram",
      desc: "Bot masuk saat banyak channel Telegram berbeda menyebutkan token yang sama dalam waktu singkat.",
    },
  ];

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: "8px" }}>Sinyal mana yang ingin bot kamu gunakan?</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "0.9375rem" }}>
        Setiap sinyal adalah cara bot mendeteksi peluang. Kamu bisa aktifkan lebih dari satu.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
        {options.map((opt) => (
          <div
            key={opt.id}
            className="card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              borderColor: signals[opt.id] ? "var(--emerald-border)" : undefined,
            }}
            onClick={() => setSignals({ ...signals, [opt.id]: !signals[opt.id] })}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "4px",
              }}>
                {opt.label}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", maxWidth: "380px" }}>
                {opt.desc}
              </div>
            </div>
            <div
              className={`toggle-switch ${signals[opt.id] ? "active" : ""}`}
              style={{ flexShrink: 0 }}
            />
          </div>
        ))}
      </div>

      <p style={{
        fontSize: "0.8125rem",
        color: "var(--text-tertiary)",
        marginBottom: "24px",
      }}>
        Kamu bisa matikan atau nyalakan sinyal ini kapan saja dari halaman Pengaturan Bot.
      </p>

      <button className="btn btn-primary" onClick={onNext} style={{ minWidth: "180px" }}>
        Lanjutkan
      </button>
    </div>
  );
}

function Step6({ onActivate, balance, mode, signals, activating }: {
  onActivate: () => void;
  balance: number;
  mode: string;
  signals: Record<string, boolean>;
  activating: boolean;
}) {
  const modeLabels: Record<string, string> = {
    konservatif: "Konservatif",
    seimbang: "Seimbang",
    agresif: "Agresif",
  };
  const maxPer: Record<string, string> = {
    konservatif: "2%",
    seimbang: "5%",
    agresif: "10%",
  };
  const signalLabels: Record<string, string> = {
    newCoin: "Token baru",
    volumeSpike: "Volume spike",
    tgBuzz: "Buzz Telegram",
  };

  const activeSignals = Object.entries(signals)
    .filter(([, v]) => v)
    .map(([k]) => signalLabels[k])
    .join(", ");

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: "8px" }}>Semua siap! Review sebelum aktif</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "0.9375rem" }}>
        Cek dulu ringkasan setup kamu. Begitu kamu klik &ldquo;Aktifkan ORBIS&rdquo;, bot akan mulai bekerja.
      </p>

      <div className="card" style={{ marginBottom: "32px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["Saldo awal", `${balance} SOL`],
              ["Gaya trading", modeLabels[mode] || mode],
              ["Sinyal aktif", activeSignals || "Tidak ada"],
              ["Max per posisi", maxPer[mode] || "5%"],
            ].map(([label, value], i) => (
              <tr key={i}>
                <td style={{
                  padding: "12px 0",
                  fontSize: "0.875rem",
                  color: "var(--text-tertiary)",
                  borderBottom: i < 3 ? "1px solid var(--border-primary)" : "none",
                  width: "40%",
                }}>
                  {label}
                </td>
                <td className="font-mono-num" style={{
                  padding: "12px 0",
                  fontSize: "0.875rem",
                  color: "var(--text-primary)",
                  fontWeight: 500,
                  borderBottom: i < 3 ? "1px solid var(--border-primary)" : "none",
                  textAlign: "right",
                }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        className="btn btn-primary btn-lg"
        onClick={onActivate}
        disabled={activating}
        style={{ minWidth: "220px" }}
      >
        {activating ? "Mengaktifkan..." : "Aktifkan ORBIS"}
      </button>

      <p style={{
        fontSize: "0.8125rem",
        color: "var(--text-tertiary)",
        marginTop: "16px",
        maxWidth: "420px",
      }}>
        Kamu bisa pause atau stop bot kapan saja dari dashboard. Dana selalu bisa ditarik kembali ke dompet utamamu.
      </p>
    </div>
  );
}

import { SpaceOpeningAnimation } from "../components/SpaceOpeningAnimation";
import { ApiKeyRevealModal } from "../components/ApiKeyRevealModal";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [checks, setChecks] = useState<[boolean, boolean]>([false, false]);
  const [balance, setBalance] = useState(1);
  const [mode, setMode] = useState("seimbang");
  const [signals, setSignals] = useState<Record<string, boolean>>({
    newCoin: true,
    volumeSpike: true,
    tgBuzz: true,
  });

  const [activating, setActivating] = useState(false);
  const [animationState, setAnimationState] = useState<'idle' | 'animating' | 'apikey' | 'done'>('idle');
  const [generatedApiKey, setGeneratedApiKey] = useState("");

  const next = () => setStep((s) => Math.min(s + 1, 5));

  const handleActivate = async () => {
    setActivating(true);
    try {
      // 1. Generate real API Key
      const res = await fetch("/api/apikey?userId=default", { method: "POST" });
      const data = await res.json();
      if (data.success && data.apiKey) {
        setGeneratedApiKey(data.apiKey);
        // 2. Start Space Opening Cinematic Animation
        setAnimationState('animating');
      }
    } catch (err) {
      console.error("Activation failed:", err);
      // Fallback
      setAnimationState('animating');
    }
  };

  const handleAnimationComplete = () => {
    // 3. After animation, show API Key one-time reveal modal
    if (generatedApiKey) {
      setAnimationState('apikey');
    } else {
      router.push("/dashboard");
    }
  };

  const handleModalClose = () => {
    // 4. Finally, go to dashboard
    setAnimationState('done');
    router.push("/dashboard");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "60px 24px",
    }}>
      {/* Overlay Animations */}
      {animationState === 'animating' && (
        <SpaceOpeningAnimation onComplete={handleAnimationComplete} />
      )}
      {animationState === 'apikey' && generatedApiKey && (
        <ApiKeyRevealModal apiKey={generatedApiKey} onClose={handleModalClose} />
      )}

      {/* Logo */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "48px",
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, var(--emerald-500), rgba(16,185,129,0.15))",
        }} />
        <span style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.03em" }}>ORBIS</span>
      </div>

      <StepIndicator current={step} />

      <div style={{ width: "100%", maxWidth: "520px" }}>
        {step === 0 && <Step1 onNext={next} checks={checks} setChecks={setChecks} />}
        {step === 1 && <Step2 onNext={next} />}
        {step === 2 && <Step3 onNext={next} balance={balance} setBalance={setBalance} />}
        {step === 3 && <Step4 onNext={next} mode={mode} setMode={setMode} />}
        {step === 4 && <Step5 onNext={next} signals={signals} setSignals={setSignals} />}
        {step === 5 && (
          <Step6
            onActivate={handleActivate}
            balance={balance}
            mode={mode}
            signals={signals}
            activating={activating}
          />
        )}
      </div>
    </div>
  );
}
