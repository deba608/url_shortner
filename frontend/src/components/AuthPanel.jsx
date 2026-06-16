import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { validateEmail, validatePassword } from "@/utils/validators";
import { ROUTES } from "@/utils/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// Slide-in auth panel from the right. Tab-switches between Login and Register.
export default function AuthPanel({ open, onClose, defaultTab = "login", onAuthSuccess }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(defaultTab);
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync tab when defaultTab changes (e.g. navbar opens it on "register")
  useEffect(() => { if (open) setTab(defaultTab); }, [open, defaultTab]);

  // Reset form when switching tabs or closing
  useEffect(() => {
    setForm({ email: "", password: "", confirm: "" });
    setErrors({});
    setServerError("");
  }, [tab, open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validateLogin = () => {
    const next = {
      email: validateEmail(form.email),
      password: form.password ? null : "Password is required",
    };
    setErrors(next);
    return !next.email && !next.password;
  };

  const validateRegister = () => {
    const next = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm: form.password !== form.confirm ? "Passwords do not match" : null,
    };
    setErrors(next);
    return !next.email && !next.password && !next.confirm;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const valid = tab === "login" ? validateLogin() : validateRegister();
    if (!valid) return;
    setLoading(true);
    try {
      if (tab === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register({ email: form.email, password: form.password });
      }
      onClose();
      onAuthSuccess?.();
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setServerError(err.message || (tab === "login" ? "Login failed" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-white dark:bg-gray-950 shadow-2xl animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label={tab === "login" ? "Log in" : "Create account"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <Link to={ROUTES.HOME} onClick={onClose} className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg btn-gradient flex items-center justify-center">
              <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span className="font-black text-lg gradient-text">Shortly</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {/* Tab switcher */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 gap-1 mb-8">
            {["login", "register"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t
                    ? "btn-gradient text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {tab === "login" ? "Welcome back!" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {tab === "login"
                ? "Log in to manage and track your links."
                : "Start shortening URLs in seconds — it's free."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {serverError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {serverError}
              </div>
            )}

            <Input
              id={`panel-email-${tab}`}
              name="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={onChange}
              error={errors.email}
            />
            <Input
              id={`panel-password-${tab}`}
              name="password"
              type="password"
              label="Password"
              placeholder={tab === "register" ? "At least 8 characters" : "Your password"}
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              value={form.password}
              onChange={onChange}
              error={errors.password}
            />
            {tab === "register" && (
              <Input
                id="panel-confirm"
                name="confirm"
                type="password"
                label="Confirm password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={onChange}
                error={errors.confirm}
              />
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              size="lg"
            >
              {tab === "login" ? "Log in" : "Create account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </div>

          {/* Switch tab */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {tab === "login" ? (
              <>Don't have an account?{" "}
                <button onClick={() => setTab("register")} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Sign up free
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => setTab("login")} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Log in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-center text-xs text-gray-400">
            By continuing you agree to our{" "}
            <span className="text-indigo-500 hover:underline cursor-pointer">Terms</span> and{" "}
            <span className="text-indigo-500 hover:underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </>
  );
}
