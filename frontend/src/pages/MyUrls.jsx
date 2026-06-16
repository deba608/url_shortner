import { useUrls } from "@/hooks/useUrls";
import UrlCard from "@/components/url/UrlCard";
import Skeleton from "@/components/ui/Skeleton";

export default function MyUrls() {
  const { urls, loading, error, refetch } = useUrls();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">My URLs</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage, share, and track your links.</p>
        </div>
        {!loading && !error && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              {urls.length} {urls.length === 1 ? "link" : "links"}
            </span>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-8 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Try again →
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && urls.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-16 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No links yet</p>
          <p className="mt-1 text-sm text-gray-400">Head to the dashboard to shorten your first URL.</p>
        </div>
      )}

      {/* URL list */}
      {!loading && !error && urls.length > 0 && (
        <div className="flex flex-col gap-3">
          {urls.map((url) => (
            <UrlCard key={url.id} url={url} onDeleted={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
