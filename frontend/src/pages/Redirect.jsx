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
    <div className="flex min-h-screen flex-col items-center justify-center text-white px-4 relative overflow-hidden bg-transparent">
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-md animate-slide-up text-center">
        {error ? (
          <div>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-float-medium">
              <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-2xl font-black text-white mb-2 tracking-tight">Redirection failed</p>
            <p className="text-base text-gray-400">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-10">
            <div className="relative flex items-center justify-center mt-4">
              {/* Ripple 1 */}
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/40 animate-ping" style={{ animationDuration: '3s' }}></div>
              {/* Ripple 2 */}
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
              
              {/* Floating Glowing Orb */}
              <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-400/40 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.5)] animate-float-slow backdrop-blur-sm">
                <svg className="h-10 w-10 text-indigo-300 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <p className="text-2xl font-black text-white tracking-tight">Taking you there...</p>
              <p className="mt-2 text-base text-gray-400">Please wait while we redirect you to your destination.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
