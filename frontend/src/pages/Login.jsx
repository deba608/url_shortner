import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ROUTES } from "@/utils/constants";
import Logo from "@/components/Logo";
import { wakeUpServer } from "@/api/ping";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

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
  const { loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Send access_token to backend to verify with Google's tokeninfo
        await loginWithGoogle(tokenResponse.access_token);
        toast("Welcome to Shortly! 🎉", "success");
        navigate(from, { replace: true });
      } catch (err) {
        toast(err?.message || "Authentication failed. Please try again.", "error");
        setLoading(false);
      }
    },
    onError: () => {
      toast("Google sign-in was cancelled or failed.", "error");
      setLoading(false);
    },
  });

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background ambient glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="absolute -bottom-20 left-1/3 h-[300px] w-[300px] rounded-full bg-indigo-800/10 blur-[80px]" />
      </div>

      {/* ── Main content wrapper to limit width and reduce empty space ── */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center">
        {/* ── Left panel — feature showcase ────────────────────── */}
        <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 xl:p-16 relative">
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
              <div className="mb-8">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Welcome back
                </h1>
                <p className="mt-1.5 text-sm text-gray-400">
                  Sign in to manage your short links.
                </p>
              </div>

              {/* Divider with OR */}
              <div className="flex items-center mb-6">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="px-3 text-xs text-gray-500 uppercase tracking-widest">
                  Continue with
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              {/* Google Sign-in button */}
              <button
                id="google-signin-btn"
                onClick={() => {
                  if (!loading) {
                    setLoading(true);
                    googleLogin();
                  }
                }}
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/8 px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/15 hover:border-white/25 hover:shadow-lg hover:shadow-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Signing you in…</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon />
                    <span>Continue with Google</span>
                    <svg
                      className="ml-auto h-4 w-4 text-gray-500 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              {/* Security note */}
              <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
                <svg className="h-3.5 w-3.5 flex-shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Your data is encrypted and never shared.</span>
              </div>
            </div>

            {/* Footer links */}
            <p className="mt-6 text-center text-xs text-gray-500">
              By continuing, you agree to our{" "}
              <Link to={ROUTES.TERMS} className="text-indigo-400 hover:underline hover:text-indigo-300 transition-colors">
                Terms
              </Link>{" "}
              &{" "}
              <Link to={ROUTES.PRIVACY} className="text-indigo-400 hover:underline hover:text-indigo-300 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
