import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";

// Placeholder protected page — proves auth + route protection + logout work.
// Real dashboard (stats, recent URLs, create form) lands in Phase 3.
export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Signed in as <span className="font-medium">{user?.email}</span>
          </p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Log out
        </Button>
      </div>
      <p className="mt-10 rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400 dark:border-gray-700">
        Phase 2 ✓ — you're authenticated. Stats &amp; URL management arrive in Phase 3.
      </p>
    </main>
  );
}
