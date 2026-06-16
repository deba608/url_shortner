import { Link } from "react-router-dom";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { formatDate, truncate } from "@/utils/format";
import { ROUTES, RECENT_URLS_LIMIT, TRUNCATE_DASHBOARD_LENGTH } from "@/utils/constants";

export default function RecentUrls({ urls, loading, error, onRetry }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent URLs</h2>
        <Link to={ROUTES.URLS} aria-label="View all URLs" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          View all →
        </Link>
      </div>

      <div className="mt-4">
        {loading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="py-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={onRetry} className="mt-2 text-sm text-indigo-600 hover:underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && urls.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            No URLs yet — shorten your first one above.
          </p>
        )}

        {!loading && !error && urls.length > 0 && (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {urls.slice(0, RECENT_URLS_LIMIT).map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <a
                    href={u.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    /{u.shortCode}
                  </a>
                  <p className="truncate text-xs text-gray-500">{truncate(u.originalUrl, TRUNCATE_DASHBOARD_LENGTH)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium">{u.clicks} clicks</p>
                  <p className="text-xs text-gray-400">{formatDate(u.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
