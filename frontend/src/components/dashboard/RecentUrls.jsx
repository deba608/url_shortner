import { Link } from "react-router-dom";
import Skeleton from "@/components/ui/Skeleton";
import { formatDate, truncate } from "@/utils/format";
import { ROUTES } from "@/utils/constants";

export default function RecentUrls({ urls, loading, error, onRetry }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Recent URLs</h2>
            <p className="text-xs text-gray-400">Your 5 latest short links</p>
          </div>
        </div>
        <Link
          to={ROUTES.URLS}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
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
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            <button onClick={onRetry} className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && urls.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No links yet</p>
            <p className="text-xs text-gray-400 mt-1">Shorten your first URL above!</p>
          </div>
        )}

        {!loading && !error && urls.length > 0 && (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {urls.slice(0, 5).map((u) => (
              <li key={u.id} className="flex items-center gap-4 py-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 -mx-2 px-2 rounded-xl transition-colors">
                {/* Icon */}
                <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <a
                    href={u.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    /{u.shortCode}
                  </a>
                  <p className="truncate text-xs text-gray-400 mt-0.5">{truncate(u.originalUrl, 55)}</p>
                </div>
                {/* Stats */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{u.clicks}</p>
                  <p className="text-xs text-gray-400">{formatDate(u.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
