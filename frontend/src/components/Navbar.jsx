import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
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

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link to={ROUTES.DASHBOARD} className="text-lg font-bold">
          Shortly
        </Link>
        <div className="flex items-center gap-6">
          <NavLink to={ROUTES.DASHBOARD} className={linkClass} end>
            Dashboard
          </NavLink>
          <NavLink to={ROUTES.URLS} className={linkClass}>
            My URLs
          </NavLink>
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
