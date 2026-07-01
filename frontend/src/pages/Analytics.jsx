import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ROUTES } from "@/utils/constants";
import { formatDateTime, buildDailySeries } from "@/utils/format";
import ClicksChart from "@/components/analytics/ClicksChart";
import BreakdownPanel from "@/components/analytics/BreakdownPanel";
import Skeleton from "@/components/ui/Skeleton";

function MetricCard({ label, value, loading, icon, color = "indigo" }) {
  const colors = {
    indigo: "from-indigo-500 to-violet-600",
    emerald: "from-emerald-400 to-teal-500",
    amber: "from-amber-400 to-orange-500",
    pink: "from-pink-500 to-rose-600",
  };
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white flex-shrink-0`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20 mt-1" />
      ) : (
        <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{value}</p>
      )}
    </div>
  );
}

export default function Analytics() {
  const { id } = useParams();
  const { data, loading, error, refetch } = useAnalytics(id);
  const series = useMemo(() => buildDailySeries(data?.clickHistory, 7), [data]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Breadcrumb + title */}
      <div>
        <Link
          to={ROUTES.URLS}
          className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          My URLs
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Click performance for this link</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={refetch} className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Try again
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              label="Total Clicks"
              value={data?.totalClicks ?? 0}
              loading={loading}
              color="indigo"
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>}
            />
            <MetricCard
              label="Unique Visitors"
              value={data?.uniqueVisitors ?? 0}
              loading={loading}
              color="emerald"
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <MetricCard
              label="Last 24 Hours"
              value={data?.dailyClicks ?? 0}
              loading={loading}
              color="amber"
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <MetricCard
              label="Last 7 Days"
              value={data?.weeklyClicks ?? 0}
              loading={loading}
              color="pink"
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
          </div>

          {/* Last accessed */}
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Last Accessed</p>
            {loading ? (
              <Skeleton className="h-7 w-52" />
            ) : (
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatDateTime(data?.lastAccessed)}
              </p>
            )}
          </div>

          {/* Chart */}
          {loading ? (
            <Skeleton className="h-72 w-full rounded-2xl" />
          ) : (
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 overflow-hidden">
              <div className="px-5 pt-5 pb-2">
                <p className="font-bold text-gray-900 dark:text-gray-100">Click Trend — Last 7 Days</p>
                <p className="text-xs text-gray-400 mt-0.5">Daily breakdown of link clicks</p>
              </div>
              <ClicksChart data={series} />
            </div>
          )}

          {/* Grouped breakdowns */}
          {!loading && data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <BreakdownPanel title="Browser" items={data.byBrowser} />
              <BreakdownPanel title="OS" items={data.byOs} />
              <BreakdownPanel title="Device" items={data.byDevice} />
              <BreakdownPanel title="Country" items={data.byCountry} />
              <BreakdownPanel title="Referrer" items={data.byReferrer} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
