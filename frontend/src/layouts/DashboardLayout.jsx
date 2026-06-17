import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

// Shared chrome for all authenticated pages.
export default function DashboardLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-16 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
