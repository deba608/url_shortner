import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, BRAND_NAME } from "@/utils/constants";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ThemeToggle";

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive
      ? "text-indigo-600 dark:text-indigo-400"
      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: ROUTES.DASHBOARD, label: "Dashboard", end: true },
    { to: ROUTES.URLS, label: "My URLs", end: false },
  ];

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link to={ROUTES.DASHBOARD} className="text-lg font-bold">
          {BRAND_NAME}
        </Link>

        <button
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:hidden"
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div
          className={`${
            mobileOpen ? "flex" : "hidden"
          } absolute left-0 right-0 top-full z-50 flex-col gap-4 border-b border-gray-200 bg-white px-6 pb-4 pt-2 dark:border-gray-800 dark:bg-gray-950 sm:static sm:flex sm:flex-row sm:items-center sm:gap-6 sm:border-0 sm:bg-transparent sm:p-0 sm:dark:bg-transparent`}
        >
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} end={l.end} onClick={() => setMobileOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <span className="hidden text-sm text-gray-400 sm:inline">{user?.email}</span>
          <ThemeToggle />
          <Button variant="secondary" onClick={logout} className="px-3 py-1.5 text-xs">
            Log out
          </Button>
        </div>
      </nav>
    </header>
  );
}
