import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import Spinner from "@/components/ui/Spinner";

// Preflight the short code before navigating away from the SPA. A blind
// window.location.replace() can't observe a 404/410 — the browser would just
// land on the backend's error response. By resolving first we can surface a
// friendly message (not found / expired) and only navigate on success.
export default function Redirect() {
  const { shortCode } = useParams();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shortCode) return;

    let cancelled = false;

    const resolve = async () => {
      try {
        await axiosClient.get(`/stats/${shortCode}`);
        if (cancelled) return;

        // Confirmed to exist → hand off to the backend's redirect route.
        const apiBaseUrl = axiosClient.defaults.baseURL || "";
        const targetUrl = apiBaseUrl
          ? `${apiBaseUrl.replace(/\/+$/, "")}/${shortCode}`
          : `/${shortCode}`;
        window.location.replace(targetUrl);
      } catch (err) {
        if (cancelled) return;
        if (err.status === 404) {
          setError("This short URL doesn't exist or has been deleted.");
        } else if (err.status === 410) {
          setError("This short URL has expired.");
        } else {
          setError(err.message || "Redirection failed. Please try again.");
        }
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [shortCode]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white px-4">
      {error ? (
        <div className="text-center">
          <p className="text-red-400 font-semibold mb-2">Redirection failed</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center animate-pulse">
            <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <Spinner className="h-5 w-5 text-indigo-500" />
          <p className="text-sm text-gray-400">Redirecting you to your destination...</p>
        </div>
      )}
    </div>
  );
}
