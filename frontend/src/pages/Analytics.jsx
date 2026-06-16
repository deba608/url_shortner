import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ROUTES } from "@/utils/constants";
import { formatDateTime, buildDailySeries } from "@/utils/format";
import StatCard from "@/components/dashboard/StatCard";
import ClicksChart from "@/components/analytics/ClicksChart";
import Skeleton from "@/components/ui/Skeleton";
import Card from "@/components/ui/Card";

export default function Analytics() {
  const { id } = useParams();
  const { data, loading, error, refetch } = useAnalytics(id);

  // Derive the 7-day series from clickHistory once per data change.
  const series = useMemo(() => buildDailySeries(data?.clickHistory, 7), [data]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to={ROUTES.URLS} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          ← Back to My URLs
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Analytics</h1>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 text-center dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button onClick={refetch} className="mt-2 text-sm font-medium text-indigo-600 hover:underline">
            Try again
          </button>
        </Card>
      )}

      {!error && (
        <>
          {/* Headline metrics */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Clicks" value={data?.totalClicks ?? 0} loading={loading} />
            <StatCard label="Unique Visitors" value={data?.uniqueVisitors ?? 0} loading={loading} />
            <StatCard label="Last 24 hours" value={data?.dailyClicks ?? 0} loading={loading} />
            <StatCard label="Last 7 days" value={data?.weeklyClicks ?? 0} loading={loading} />
          </div>

          {/* Last accessed */}
          <Card>
            <p className="text-sm text-gray-500">Last accessed</p>
            {loading ? (
              <Skeleton className="mt-2 h-6 w-48" />
            ) : (
              <p className="mt-1 text-lg font-medium">{formatDateTime(data?.lastAccessed)}</p>
            )}
          </Card>

          {/* Trend chart */}
          {loading ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : (
            <ClicksChart data={series} />
          )}
        </>
      )}
    </div>
  );
}
