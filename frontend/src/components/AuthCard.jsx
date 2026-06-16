import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";
import ThemeToggle from "@/components/ThemeToggle";

// Shell for Login/Register pages when accessed directly via URL (not via drawer).
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex hero-bg">
      {/* Left decorative panel (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)" }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Link to={ROUTES.HOME} className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span className="text-2xl font-black">Shortly</span>
          </Link>
          <h2 className="text-4xl font-black leading-tight mb-4">
            Shorten. Share.<br />Track everything.
          </h2>
          <p className="text-indigo-100 text-lg leading-relaxed max-w-xs">
            Create branded short links, QR codes, and detailed analytics — all in one place.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[["10K+", "Links"], ["99.9%", "Uptime"], ["< 100ms", "Speed"]].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl font-black">{v}</p>
                <p className="text-sm text-indigo-200">{l}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Decorative orb */}
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 lg:border-none">
          <Link to={ROUTES.HOME} className="lg:hidden flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg btn-gradient flex items-center justify-center">
              <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span className="font-black gradient-text">Shortly</span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm animate-slide-up">
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
            <div className="mt-6">{children}</div>
            {footer && (
              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
