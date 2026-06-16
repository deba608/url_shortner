import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

// Shared chrome for all authenticated pages.
// onOpenAuth is passed from AppRoutes so the navbar auth buttons work.
export default function DashboardLayout({ onOpenAuth }) {
  return (
    <div className="min-h-screen">
      <Navbar onOpenAuth={onOpenAuth} />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-24 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
