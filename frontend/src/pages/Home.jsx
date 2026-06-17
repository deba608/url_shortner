import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { createShortUrl } from "@/api/urls";
import { validateUrl } from "@/utils/validators";
import { ROUTES } from "@/utils/constants";
import Button from "@/components/ui/Button";

// ── Copy to clipboard helper ─────────────────────────────────
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ── Main component ───────────────────────────────────────────
export default function Home({ onOpenAuth }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [showAlias, setShowAlias] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleShorten = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setCopied(false);

    const { error: urlError, normalised } = validateUrl(url.trim());
    if (urlError) { setError(urlError); return; }

    setLoading(true);
    try {
      const payload = { url: normalised };
      if (customAlias.trim()) payload.customAlias = customAlias.trim();
      const created = await createShortUrl(payload);
      setResult(created);
      setUrl("");
      setCustomAlias("");
      setShowAlias(false);
    } catch (err) {
      const suggestions = err.raw?.response?.data?.suggestions;
      setError(
        suggestions?.length
          ? `${err.message}. Try: ${suggestions.slice(0, 3).join(", ")}`
          : err.message || "Could not shorten URL. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const ok = await copyText(result.shortUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-76px)] md:h-[calc(100vh-84px)] overflow-hidden">
      {/* ── Hero Section ── */}
      <section className="flex-1 flex flex-col justify-center relative px-4 sm:px-6">
        <div className="relative mx-auto max-w-4xl">
          {/* Headline */}
          <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight animate-slide-up delay-100 text-[var(--text-main)]">
            Simple, fast{" "}
            <br className="hidden sm:block" />
            URL shortening.
          </h1>

          {/* Sub */}
          <p className="mt-5 text-center text-base sm:text-lg text-[var(--text-muted)] max-w-xl mx-auto animate-slide-up delay-200">
            Turn long, messy URLs into clean, manageable links. Track your clicks and take control of your links today.
          </p>

          {/* ── URL Shortener Form ── */}
          <div className="mt-10 animate-slide-up delay-300">
            {result ? (
              // ── Result Card ──
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:p-6 animate-bounce-in">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Your short URL is ready!</p>
                    <p className="text-sm text-gray-400 mt-0.5">Click the link to open, or copy it below.</p>
                  </div>
                </div>

                {/* Short URL display */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <a
                    href={result.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 min-w-0 rounded-lg border border-emerald-500/40 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-indigo-400 hover:underline truncate"
                  >
                    {result.shortUrl}
                  </a>
                  <button
                    onClick={handleCopy}
                    className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                      copied
                        ? "bg-emerald-500/30 backdrop-blur-md border-emerald-400/30 text-white shadow-sm"
                        : "bg-indigo-500/30 backdrop-blur-md border-indigo-400/30 text-white hover:bg-indigo-500/40 shadow-sm"
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* CTA row */}
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                  {!isAuthenticated && (
                    <button
                      onClick={() => onOpenAuth?.("register")}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-500/30 backdrop-blur-md border border-indigo-400/30 text-white hover:bg-indigo-500/40 shadow-sm transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Sign up to track clicks
                    </button>
                  )}
                  <button
                    onClick={() => setResult(null)}
                    className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Shorten another →
                  </button>
                </div>
              </div>
            ) : (
              // ── Input Form ──
              <form
                onSubmit={handleShorten}
                className="rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur p-3 sm:p-4 shadow-lg shadow-black/30"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      id="hero-url-input"
                      type="text"
                      placeholder="Paste your long URL here…"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-slate-950 pl-10 pr-4 py-3.5 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-gray-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="whitespace-nowrap"
                  >
                    Shorten URL
                  </Button>
                </div>

                {/* Custom alias toggle */}
                <div className="mt-2 px-1">
                  <button
                    type="button"
                    onClick={() => setShowAlias((s) => !s)}
                    className="text-xs text-indigo-400 hover:underline font-medium"
                  >
                    {showAlias ? "− Hide custom alias" : "+ Add custom alias (optional)"}
                  </button>
                  {showAlias && (
                    <div className="mt-2 animate-slide-up">
                      <input
                        id="hero-alias-input"
                        type="text"
                        placeholder="e.g. my-brand-link"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value.replace(/\s/g, "-").toLowerCase())}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-gray-500"
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <p className="mt-2 px-1 text-sm text-red-400">{error}</p>
                )}

                <p className="mt-3 px-1 text-xs text-gray-400">
                  By shortening, you agree to our{" "}
                  <Link to={ROUTES.TERMS} className="text-indigo-500 cursor-pointer hover:underline">Terms of Service</Link>
                  .
                  {!isAuthenticated && (
                    <>{" "}
                      <button type="button" onClick={() => onOpenAuth?.("login")} className="text-indigo-500 hover:underline">
                        Log in
                      </button>
                      {" "}to track analytics.
                    </>
                  )}
                </p>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">© 2026 Shortly. All rights reserved.</p>
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            Crafted with
            <svg className="h-3 w-3 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            by Dev
          </p>
        </div>
      </footer>
    </div>
  );
}
