import { useState } from "react";
import { createShortUrl } from "@/api/urls";
import { useToast } from "@/hooks/useToast";
import { validateUrl } from "@/utils/validators";
import { useClipboard } from "@/hooks/useClipboard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function CreateUrlForm({ onCreated }) {
  const { toast } = useToast();
  const { copy } = useClipboard();
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [showAlias, setShowAlias] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (shortUrl) => {
    const ok = await copy(shortUrl);
    if (ok) {
      setCopied(true);
      toast("Copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast("Copy failed", "error");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

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
      toast("Short URL created!", "success");
      onCreated?.();
    } catch (err) {
      const suggestions = err.raw?.response?.data?.suggestions;
      setError(
        suggestions?.length
          ? `${err.message}. Try: ${suggestions.join(", ")}`
          : err.message || "Could not shorten URL"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-white">Shorten a URL</h2>
          <p className="text-xs text-gray-400">Create a new short link instantly</p>
        </div>
      </div>

      <div className="p-6">
        {result ? (
          // Result state
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 animate-bounce-in">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded bg-emerald-500/20 flex items-center justify-center">
                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-emerald-400">Link created!</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-0 rounded-lg border border-emerald-500/30 bg-slate-950 px-3 py-2 text-sm font-semibold text-indigo-400 hover:underline truncate"
              >
                {result.shortUrl}
              </a>
              <button
                onClick={() => handleCopy(result.shortUrl)}
                className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setResult(null)}
              className="mt-3 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              + Shorten another
            </button>
          </div>
        ) : (
          // Form
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  id="dashboard-url-input"
                  type="text"
                  placeholder="https://example.com/very/long/url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-gray-500"
                />
              </div>
              <Button type="submit" loading={loading} className="sm:w-auto w-full whitespace-nowrap">
                Shorten
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAlias((s) => !s)}
                className="text-xs text-indigo-400 hover:underline font-medium"
              >
                {showAlias ? "− Hide custom alias" : "+ Custom alias (optional)"}
              </button>
            </div>

            {showAlias && (
              <div className="animate-slide-up">
                <Input
                  id="dashboard-alias-input"
                  type="text"
                  placeholder="my-custom-link"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value.replace(/\s/g, "-").toLowerCase())}
                  hint="Letters, numbers, and hyphens only"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
