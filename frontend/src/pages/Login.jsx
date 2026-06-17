import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ROUTES } from "@/utils/constants";
import Logo from "@/components/Logo";
import { wakeUpServer } from "@/api/ping";

const features = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: "Custom short links",
    desc: "Create memorable aliases for any URL.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Real-time analytics",
    desc: "Track clicks, locations, and devices.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 4H1m18-4h2M5 16H3m16 4h2M9 4h1m-1 0h.01M15 4h-1m1 0h.01" />
      </svg>
    ),
    title: "QR codes",
    desc: "Auto-generate scannable QR for every link.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Link expiration",
    desc: "Set links to expire automatically.",
  },
];

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverWaking, setServerWaking] = useState(false);

  // Proactively wake up the Render backend as soon as the login page mounts.
  useEffect(() => {
    wakeUpServer();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast("Please fill in all fields.", "error");
      return;
    }

    setLoading(true);
    setServerWaking(true);
    const wakingTimer = setTimeout(() => setServerWaking(false), 12_000);

    try {
      await login(email, password);
      clearTimeout(wakingTimer);
      toast("Welcome back! 🎉", "success");
      navigate(from, { replace: true });
    } catch (err) {
      clearTimeout(wakingTimer);
      toast(err?.message || "Invalid email or password.", "error");
      setLoading(false);
      setServerWaking(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-76px)] md:min-h-[calc(100vh-84px)] relative justify-center py-12 md:py-0">

      {/* ── Main content wrapper to limit width and reduce empty space ── */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center">
        {/* ── Left panel — feature showcase ────────────────────── */}
        <div className="hidden lg:flex lg:flex-1 flex-col justify-center p-12 xl:p-16 relative">
          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 -z-10 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <Logo size="lg" />

          <div className="flex flex-col gap-10 mt-12 mb-12">
            <div>
              <h2 className="text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight text-white">
                The smarter way to<br />
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  share your links.
                </span>
              </h2>
              <p className="mt-4 text-base text-gray-400 max-w-sm leading-relaxed">
                Shorten, brand, and track every link — all from one powerful dashboard.
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-4">
              {features.map(({ icon, title, desc }, i) => (
                <li
                  key={title}
                  className="flex items-start gap-4 animate-slide-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-600">© 2026 Shortly. All rights reserved.</p>
        </div>

        {/* ── Right panel — auth ───────────────────────────────── */}
        <div className="flex lg:flex-1 flex-col items-center justify-center p-6 sm:p-10 lg:p-12 w-full max-w-lg mx-auto">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <Logo size="md" />
          </div>

          <div
            className="w-full animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            {/* Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Welcome back
                </h1>
                <p className="mt-1.5 text-sm text-gray-400">
                  Sign in to manage your short links.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                      </svg>
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>
                        {serverWaking ? "Waking up server…" : "Signing you in…"}
                      </span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              {/* Security note */}
              <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
                <svg className="h-3.5 w-3.5 flex-shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Your data is encrypted and secure.</span>
              </div>
            </div>

            {/* Footer links */}
            <p className="mt-6 text-center text-xs text-gray-500">
              Don't have an account?{" "}
              <Link to={ROUTES.REGISTER} className="text-indigo-400 hover:underline hover:text-indigo-300 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
