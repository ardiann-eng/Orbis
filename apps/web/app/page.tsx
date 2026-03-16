"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConnectPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      // Simulate: user has no bot wallet → go to onboarding
      router.push("/onboarding");
    }, 1200);
  };

  return (
    <div
      className="cosmic-grid"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background cosmic grid dots */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.04) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      <div
        className="animate-fade-in"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Orbital ring animation */}
        <div className="orbital-container" style={{ marginBottom: "8px" }}>
          <div className="orbital-ring" />
          <div className="orbital-ring-2" />
          <div className="orbital-ring-3" />
          <div className="orbital-sphere" />
        </div>

        {/* Logo & tagline */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            marginBottom: "12px",
          }}>
            ORBIS
          </h1>
          <p style={{
            color: "var(--text-secondary)",
            fontSize: "1.0625rem",
            maxWidth: "400px",
            lineHeight: 1.6,
          }}>
            Bot trading memecoin Solana yang cerdas.
            <br />
            14 logika berlapis, satu dashboard presisi.
          </p>
        </div>

        {/* Connect Wallet Button */}
        <button
          className="btn btn-primary btn-lg"
          onClick={handleConnect}
          disabled={connecting}
          style={{
            minWidth: "220px",
            position: "relative",
          }}
        >
          {connecting ? (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 600ms linear infinite",
              }} />
              Menghubungkan...
            </span>
          ) : (
            "Connect Wallet"
          )}
        </button>

        <div style={{
          display: "flex",
          gap: "20px",
          marginTop: "4px",
        }}>
          {["Phantom", "Solflare", "Backpack"].map((wallet) => (
            <span
              key={wallet}
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              {wallet}
            </span>
          ))}
        </div>
      </div>

      {/* Version footer */}
      <div style={{
        position: "absolute",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        fontSize: "0.75rem",
        color: "var(--text-muted)",
      }}>
        <span>ORBIS Engine v1.3</span>
        <span style={{ color: "var(--border-secondary)" }}>|</span>
        <span>14 logika aktif</span>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
