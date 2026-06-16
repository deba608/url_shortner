import { useState, useEffect, useCallback } from "react";
import { getUrlAnalytics } from "@/api/urls";

// Fetches analytics for a single URL with loading / error / refetch.
export function useAnalytics(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getUrlAnalytics(id));
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, loading, error, refetch: fetchAnalytics };
}
