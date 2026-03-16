"use client";
import { useState, useEffect, useCallback } from "react";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(url: string, defaultValue: T): ApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: null });

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.ok) {
        setState({ data: json.data, loading: false, error: null });
      } else {
        setState({ data: defaultValue, loading: false, error: json.error ?? "Unknown error" });
      }
    } catch (e) {
      setState({ data: defaultValue, loading: false, error: "Network error" });
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
