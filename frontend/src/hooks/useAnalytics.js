import { useState, useEffect, useCallback } from "react";
import { getUrlAnalytics } from "@/api/urls";

export function useAnalytics(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUrlAnalytics(id, { signal });
      if (!signal.aborted) setData(result);
    } catch (err) {
      if (err?.name !== "AbortError" && !signal.aborted) {
        setError(err.message || "Failed to load analytics");
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    fetchAnalytics(controller.signal);
    return () => controller.abort();
  }, [fetchAnalytics]);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    fetchAnalytics(controller.signal);
    return () => controller.abort();
  }, [fetchAnalytics]);

  return { data, loading, error, refetch };
}
