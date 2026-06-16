import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

// Single metric tile (e.g. "Total URLs"). Shows a skeleton while loading so the
// dashboard layout stays stable.
export default function StatCard({ label, value, loading }) {
  return (
    <Card>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="mt-2 text-3xl font-semibold dark:text-gray-100">{value}</p>
      )}
    </Card>
  );
}
