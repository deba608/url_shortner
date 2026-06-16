import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

// Shared chrome for all authenticated pages. Rendered once around a group of
// nested routes via <Outlet/>, so the navbar doesn't unmount on navigation.
export default function DashboardLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
