import { useState, useEffect, useCallback } from "react";
import { getUserUrls } from "@/api/urls";

export function useUrls() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUrls = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserUrls({ signal });
      if (!signal.aborted) setUrls(data);
    } catch (err) {
      if (err?.name !== "AbortError" && !signal.aborted) {
        setError(err.message || "Failed to load URLs");
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchUrls(controller.signal);
    return () => controller.abort();
  }, [fetchUrls]);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    fetchUrls(controller.signal);
    return () => controller.abort();
  }, [fetchUrls]);

  return { urls, loading, error, refetch };
}
