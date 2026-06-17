import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { ROUTES } from "@/utils/constants";
import Logo from "@/components/Logo";
import axiosClient from "@/api/axiosClient";

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast("Invalid or missing reset token.", "error");
      return;
    }

    if (!password) {
      toast("Please enter a new password.", "error");
      return;
    }

    if (password.length < 6) {
      toast("Password must be at least 6 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      toast("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post("/api/auth/reset-password", { token, password });
      setDone(true);
      toast("Password reset successfully! You can now log in.", "success");
      setTimeout(() => navigate(ROUTES.LOGIN), 2000);
    } catch (err) {
      toast(err?.message || "Failed to reset password.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/40 max-w-md w-full mx-4 text-center">
          <div className="h-14 w-14 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-gray-400 mb-6">This reset link is invalid or has expired.</p>
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-indigo-400 hover:underline text-sm">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#020617]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="absolute -bottom-20 left-1/3 h-[300px] w-[300px] rounded-full bg-indigo-800/10 blur-[80px]" />
      </div>

      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center">
        <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 xl:p-16 relative">
          <div className="absolute inset-0 -z-10 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
          <Logo size="lg" />
          <div>
            <h2 className="text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight text-white">
              Set a new<br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">password.</span>
            </h2>
            <p className="mt-4 text-base text-gray-400 max-w-sm leading-relaxed">
              Choose a strong password you haven't used before.
            </p>
          </div>
          <p className="text-xs text-gray-600">© 2026 Shortly. All rights reserved.</p>
        </div>

        <div className="flex lg:flex-1 flex-col items-center justify-center p-6 sm:p-10 lg:p-12 w-full max-w-lg mx-auto">
          <div className="mb-10 lg:hidden"><Logo size="md" /></div>

          <div className="w-full animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
              <div className="mb-6">
                <h1 className="text-2xl font-black text-white tracking-tight">Reset your password</h1>
                <p className="mt-1.5 text-sm text-gray-400">
                  {done ? "Password updated!" : "Enter your new password below."}
                </p>
              </div>

              {!done ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block" htmlFor="password">
                      New Password
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

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block" htmlFor="confirmPassword">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </span>
                      <input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 rounded-xl bg-indigo-500/30 backdrop-blur-md border border-indigo-400/30 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-500/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Resetting…</span>
                      </>
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Your password has been updated.</p>
                  <Link to={ROUTES.LOGIN} className="text-indigo-400 hover:underline text-sm">
                    Go to login
                  </Link>
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
              <Link to={ROUTES.LOGIN} className="text-indigo-400 hover:underline hover:text-indigo-300 transition-colors">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
