"use client";

import { useEffect, useState, useCallback } from "react";

type TradingMode = "DEMO" | "REAL";

interface TradingModeState {
  mode: TradingMode;
  isDemo: boolean;
  loading: boolean;
  error: string | null;
  switchMode: (nextMode: TradingMode) => Promise<void>;
}

const STORAGE_KEY = "orbis.tradingMode";

export function useTradingMode(userId: string = "default"): TradingModeState {
  const [mode, setMode] = useState<TradingMode>(() => {
    if (typeof window === "undefined") return "DEMO";
    const stored = window.localStorage.getItem(STORAGE_KEY) as TradingMode | null;
    return stored === "REAL" ? "REAL" : "DEMO";
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFromServer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/config?userId=${encodeURIComponent(userId)}`);
      const json = await res.json();
      if (json.ok && json.data) {
        const serverMode = (json.data.trading_mode as TradingMode | undefined) ?? "DEMO";
        setMode(serverMode);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, serverMode);
        }
      } else {
        setError(json.error ?? "Gagal memuat mode trading");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  const switchMode = useCallback(
    async (nextMode: TradingMode) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, tradingMode: nextMode }),
        });
        const json = await res.json();
        if (!json.ok) {
          setError(json.error ?? "Gagal mengganti mode trading");
        } else {
          setMode(nextMode);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, nextMode);
          }
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return {
    mode,
    isDemo: mode === "DEMO",
    loading,
    error,
    switchMode,
  };
}

