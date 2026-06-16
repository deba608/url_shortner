import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

// Layout for public pages (landing, login redirect, etc.)
// The Home page is rendered via AppRoutes directly — it receives onOpenAuth as a prop.
// This layout just ensures the Navbar is present on public pages too.
export default function PublicLayout({ onOpenAuth }) {
  return (
    <div className="min-h-screen">
      <Navbar onOpenAuth={onOpenAuth} />
      <Outlet context={{ onOpenAuth }} />
    </div>
  );
}
