import { useState } from "react";
import { Link } from "react-router-dom";
import Skeleton from "@/components/ui/Skeleton";
import QrModal from "@/components/url/QrModal";
import { formatDate, truncate } from "@/utils/format";
import { ROUTES } from "@/utils/constants";

export default function RecentUrls({ urls, loading, error, onRetry }) {
  const [qrUrl, setQrUrl] = useState(null);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-white">Recent URLs</h2>
            <p className="text-xs text-gray-400">Your 5 latest short links</p>
          </div>
        </div>
        <Link
          to={ROUTES.URLS}
          className="text-sm font-medium text-indigo-400 hover:underline flex items-center gap-1"
        >
          View all
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="px-6 py-4">
        {loading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="py-8 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={onRetry} className="mt-2 text-sm font-medium text-indigo-400 hover:underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && urls.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-slate-800 flex items-center justify-center">
              <svg className="h-7 w-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-300">No links yet</p>
            <p className="text-xs text-gray-500 mt-1">Shorten your first URL above!</p>
          </div>
        )}

        {!loading && !error && urls.length > 0 && (
          <ul className="divide-y divide-white/5">
            {urls.slice(0, 5).map((u) => (
              <li key={u.id} className="flex items-center gap-4 py-3.5 hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors">
                <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={u.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-indigo-400 hover:underline"
                  >
                    /{u.shortCode}
                  </a>
                  <p className="truncate text-xs text-gray-500 mt-0.5">{truncate(u.originalUrl, 55)}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-4 text-right">
                  <button
                    onClick={() => setQrUrl({ id: u.id, shortCode: u.shortCode })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                    title="View QR Code"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </button>
                  <div>
                    <p className="text-sm font-bold text-white">{u.clicks}</p>
                    <p className="text-xs text-gray-500">{formatDate(u.createdAt)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {qrUrl && (
        <QrModal
          urlId={qrUrl.id}
          shortCode={qrUrl.shortCode}
          open={!!qrUrl}
          onClose={() => setQrUrl(null)}
        />
      )}
    </div>
  );
}
