import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";

const LinkIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const ChartIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const HomeIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navLinkClass = ({ isActive }) =>
    `nav-link flex items-center gap-2 text-sm font-medium py-1 transition-colors ${
      isActive
        ? "text-indigo-400"
        : "text-gray-400 hover:text-gray-200"
    }`;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6">
        <div className="mx-auto mt-4 max-w-6xl">
          <nav
            className={`flex items-center justify-between rounded-full px-5 sm:px-6 h-14 md:h-16 transition-all duration-300 ${
              scrolled
                ? "bg-black/20 border border-white/10 shadow-lg backdrop-blur-xl"
                : "bg-black/10 border border-white/5 shadow-md backdrop-blur-xl"
            }`}
          >
            <Logo size="md" />

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              {isAuthenticated ? (
                <>
                  <NavLink to={ROUTES.DASHBOARD} className={navLinkClass} end>
                    Dashboard
                  </NavLink>
                  <NavLink to={ROUTES.URLS} className={navLinkClass}>
                    My URLs
                  </NavLink>
                </>
              ) : null}
            </div>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-3">
              <Show when="signed-out">
                <SignInButton />
                <SignUpButton />
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>

            {/* Mobile right side */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="rounded-xl p-2 text-gray-400 hover:bg-white/10 transition-colors"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                <div className="flex flex-col gap-1.5 w-5">
                  <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
                  <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
                  <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
                </div>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Spacer so content isn't hidden behind fixed navbar */}
      <div className="h-[76px] md:h-[84px]" />

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden drawer-overlay cursor-pointer"
          onClick={() => setMobileOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setMobileOpen(false); }}
        />
      )}
      <div
        className={`fixed top-auto left-0 right-0 z-30 md:hidden transition-all duration-300 px-4 sm:px-6 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none -translate-y-4"
        }`}
        style={{ top: "80px" }}
      >
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="p-4 flex flex-col gap-1">
            <Show when="signed-in">
              <NavLink to={ROUTES.DASHBOARD} className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-indigo-500/10 text-indigo-400"
                  : "text-gray-300 hover:bg-white/5"
                }`
              } end>
                <HomeIcon /><span>Dashboard</span>
              </NavLink>
              <NavLink to={ROUTES.URLS} className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-indigo-500/10 text-indigo-400"
                  : "text-gray-300 hover:bg-white/5"
                }`
              }>
                <LinkIcon /><span>My URLs</span>
              </NavLink>
              <div className="mt-2 border-t border-white/10 pt-3 px-2 flex justify-center">
                <UserButton />
              </div>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Log in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-full mt-2 flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-indigo-400 bg-indigo-500/10 transition-colors"
                >
                  <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Sign up free
                </button>
              </SignUpButton>
            </Show>
          </div>
        </div>
      </div>
    </>
  );
}
