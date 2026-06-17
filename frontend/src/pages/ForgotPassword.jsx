import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { ROUTES } from "@/utils/constants";
import Logo from "@/components/Logo";
import axiosClient from "@/api/axiosClient";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast("Please enter your email address.", "error");
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post("/api/auth/forgot-password", { email });
      setSent(true);
      toast("Reset link sent! Please check your email inbox.", "success");
    } catch (err) {
      toast(err?.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

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
              Forgot your<br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">password?</span>
            </h2>
            <p className="mt-4 text-base text-gray-400 max-w-sm leading-relaxed">
              No worries. Enter your email and we'll send you a reset link.
            </p>
          </div>
          <p className="text-xs text-gray-600">© 2026 Shortly. All rights reserved.</p>
        </div>

        <div className="flex lg:flex-1 flex-col items-center justify-center p-6 sm:p-10 lg:p-12 w-full max-w-lg mx-auto">
          <div className="mb-10 lg:hidden"><Logo size="md" /></div>

          <div className="w-full animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
              <div className="mb-6">
                <h1 className="text-2xl font-black text-white tracking-tight">Reset password</h1>
                <p className="mt-1.5 text-sm text-gray-400">
                  {sent ? "Check your email for the reset link." : "Enter your email to receive a reset link."}
                </p>
              </div>

              {!sent ? (
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 rounded-xl bg-indigo-500/30 backdrop-blur-md border border-indigo-400/30 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-500/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Sending…</span>
                      </>
                    ) : (
                      <span>Send Reset Link</span>
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
                  <p className="text-sm text-gray-400">
                    A reset link has been sent to <strong className="text-white">{email}</strong>. Please check your inbox (and spam folder).
                  </p>
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
