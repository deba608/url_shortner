import { useUrls } from "@/hooks/useUrls";
import UrlCard from "@/components/url/UrlCard";
import Skeleton from "@/components/ui/Skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function MyUrls() {
  useDocumentTitle("My URLs");
  const { urls, loading, error, refetch } = useUrls();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My URLs</h1>
          <p className="text-sm text-gray-500">Manage, share, and track your links.</p>
        </div>
        {!loading && !error && (
          <span className="text-sm text-gray-400">{urls.length} total</span>
        )}
      </div>

      {loading && (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button onClick={refetch} className="mt-2 text-sm font-medium text-indigo-600 hover:underline">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && urls.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-sm text-gray-400">
            You haven't created any URLs yet. Head to the dashboard to shorten one.
          </p>
        </div>
      )}

      {!loading && !error && urls.length > 0 && (
        <div className="flex flex-col gap-4">
          {urls.map((url) => (
            // After delete, refetch to keep stats + list authoritative.
            <UrlCard key={url.id} url={url} onDeleted={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
