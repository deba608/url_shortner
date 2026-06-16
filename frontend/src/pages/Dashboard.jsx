import { useMemo } from "react";
import { useUrls } from "@/hooks/useUrls";
import StatCard from "@/components/dashboard/StatCard";
import CreateUrlForm from "@/components/dashboard/CreateUrlForm";
import RecentUrls from "@/components/dashboard/RecentUrls";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const { urls, loading, error, refetch } = useUrls();

  // Derive headline stats from the already-fetched list — no extra request.
  const totalClicks = useMemo(
    () => urls.reduce((sum, u) => sum + (u.clicks || 0), 0),
    [urls]
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500">Create and track your short links.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total URLs" value={urls.length} loading={loading} />
        <StatCard label="Total Clicks" value={totalClicks} loading={loading} />
      </div>

      {/* Create */}
      <CreateUrlForm onCreated={refetch} />

      {/* Recent */}
      <RecentUrls urls={urls} loading={loading} error={error} onRetry={refetch} />
    </div>
  );
}
