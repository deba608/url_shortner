import { useMemo } from "react";
import { useUrls } from "@/hooks/useUrls";
import CreateUrlForm from "@/components/dashboard/CreateUrlForm";
import RecentUrls from "@/components/dashboard/RecentUrls";
import Skeleton from "@/components/ui/Skeleton";

function StatCard({ label, value, icon, loading, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-500/10 text-indigo-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    pink: "bg-pink-500/10 text-pink-400",
  };
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-5 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-24" />
          ) : (
            <p className="mt-1 text-3xl font-black text-white">{value}</p>
          )}
        </div>
        <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { urls, loading, error, refetch } = useUrls();

  const totalClicks = useMemo(
    () => urls.reduce((sum, u) => sum + (u.clicks || 0), 0),
    [urls]
  );

  const activeToday = useMemo(() => {
    const today = new Date().toDateString();
    return urls.filter((u) => new Date(u.createdAt).toDateString() === today).length;
  }, [urls]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Create and track your short links.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total URLs"
          value={urls.length}
          loading={loading}
          color="indigo"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        />
        <StatCard
          label="Total Clicks"
          value={totalClicks}
          loading={loading}
          color="emerald"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
          }
        />
        <StatCard
          label="Created Today"
          value={activeToday}
          loading={loading}
          color="amber"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Avg. Clicks"
          value={urls.length ? Math.round(totalClicks / urls.length) : 0}
          loading={loading}
          color="pink"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* Create URL */}
      <CreateUrlForm onCreated={refetch} />

      {/* Recent */}
      <RecentUrls urls={urls} loading={loading} error={error} onRetry={refetch} />
    </div>
  );
}
