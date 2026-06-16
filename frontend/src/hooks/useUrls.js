import { useState, useEffect, useCallback } from "react";
import { getUserUrls } from "@/api/urls";

// Encapsulates fetching the user's URLs with explicit loading/error/refetch.
// (A deliberate "hand-rolled" version — Phase 5 notes where React Query would
// replace this with caching + background refresh for free.)
export function useUrls() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUrls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserUrls();
      setUrls(data);
    } catch (err) {
      setError(err.message || "Failed to load URLs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  return { urls, loading, error, refetch: fetchUrls };
}
