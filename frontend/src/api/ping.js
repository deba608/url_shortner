/**
 * wakeUpServer — silently pings the backend health endpoint as soon as the
 * app loads. On Render's free tier, the server sleeps after 15 min of
 * inactivity and takes 30–50 s to wake up. By pinging immediately on page
 * load, we ensure the backend is warm before the user ever clicks "Sign in".
 *
 * Failures are intentionally swallowed — this is a best-effort warm-up, not
 * a required request.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, "").replace(/\/api$/, "")
  : "";

export function wakeUpServer() {
  // Only ping in production (DEV uses a local server that never sleeps)
  if (import.meta.env.DEV) return;

  const healthUrl = `${API_BASE_URL}/health`;

  fetch(healthUrl, {
    method: "GET",
    credentials: "include",
    // Short timeout — we only want to wake it, not wait for it
    signal: AbortSignal.timeout?.(30_000),
  }).catch(() => {
    // Silently ignore — server may still be waking up; real requests will retry
  });
}
