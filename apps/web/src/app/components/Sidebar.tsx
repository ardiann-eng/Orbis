"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: "/dashboard", name: "Dashboard", badge: "Live", badgeType: "emerald" as const },
      { href: "/scanner", name: "Scanner token", badge: "12", badgeType: "neutral" as const },
      { href: "/posisi", name: "Posisi aktif", badge: "3", badgeType: "neutral" as const },
    ],
  },
  {
    label: "ANALISIS",
    items: [
      { href: "/sinyal", name: "Sinyal baru", badge: "5", badgeType: "amber" as const },
      { href: "/tg-buzz", name: "Buzz Telegram" },
      { href: "/pantau-wallet", name: "Pantau wallet" },
    ],
  },
  {
    label: "AKUN",
    items: [
      { href: "/dompet", name: "Dompet bot" },
      { href: "/riwayat", name: "Riwayat trading" },
      { href: "/performa", name: "Performa bot", badge: "Premium", badgeType: "amber" as const },
    ],
  },
  {
    label: "KONTROL",
    items: [
      { href: "/pengaturan", name: "Pengaturan bot" },
      { href: "/notifikasi", name: "Notifikasi" },
      { href: "/bantuan", name: "Bantuan" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      flexShrink: 0,               /* never shrink — fixed width always */
      width: "var(--sidebar-width)",
      height: "100vh",
      position: "sticky",
      top: 0,
      background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border-primary)",
      display: "flex",
      flexDirection: "column",
      zIndex: 40,
      overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{
        padding: "24px 20px 8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Orbis sphere icon */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, var(--emerald-500), rgba(16, 185, 129, 0.15))",
            flexShrink: 0,
          }} />
          <div>
            <div style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}>
              ORBIS
            </div>
            <div style={{
              fontSize: "0.6875rem",
              color: "var(--text-tertiary)",
              letterSpacing: "0.02em",
            }}>
              Solana Trading Bot
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        overflowY: "auto",
        padding: "8px 0",
      }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: "4px" }}>
            {group.label && (
              <div style={{
                padding: "16px 20px 6px",
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>
                {group.label}
              </div>
            )}
            {!group.label && gi > 0 && (
              <div style={{
                margin: "8px 20px",
                borderTop: "1px solid var(--border-primary)",
              }} />
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 20px",
                    fontSize: "0.875rem",
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    textDecoration: "none",
                    background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
                    borderLeft: isActive ? "2px solid var(--emerald-500)" : "2px solid transparent",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--text-primary)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--text-secondary)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className={`badge badge-${item.badgeType || "neutral"}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bot status footer */}
      <div style={{
        padding: "16px 20px",
        borderTop: "1px solid var(--border-primary)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.8125rem",
        }}>
          <span
            className="animate-pulse-dot"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--emerald-500)",
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--text-secondary)" }}>
            Bot aktif
          </span>
          <span style={{ color: "var(--text-tertiary)", marginLeft: "auto", fontSize: "0.75rem" }}>
            2j 14m
          </span>
        </div>
      </div>
    </aside>
  );
}
