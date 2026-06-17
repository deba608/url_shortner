import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSignIn, useSignUp } from "@clerk/react";
import { validateEmail, validatePassword } from "@/utils/validators";
import { ROUTES } from "@/utils/constants";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AuthPanel({ open, onClose, defaultTab = "login", onAuthSuccess }) {
  const { isLoaded: isLoadedSignIn, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: isLoadedSignUp, signUp, setActive: setActiveSignUp } = useSignUp();
  
  const navigate = useNavigate();
  const panelRef = useRef(null);
  
  const [tab, setTab] = useState(defaultTab);
  const [form, setForm] = useState({ email: "", password: "", confirm: "", code: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open) setTab(defaultTab); }, [open, defaultTab]);

  useEffect(() => {
    setForm({ email: "", password: "", confirm: "", code: "" });
    setErrors({});
    setServerError("");
  }, [tab, open]);

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

  useEffect(() => {
    if (open && panelRef.current) panelRef.current.focus();
  }, [open]);

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

  const onSubmit = async (e, type) => {
    e.preventDefault();
    setServerError("");
    if (!isLoadedSignIn || !isLoadedSignUp) return;

    if (type === "verify") {
      if (!form.code) {
        setErrors({ code: "Code is required" });
        return;
      }
      setLoading(true);
      try {
        const result = await signUp.attemptEmailAddressVerification({ code: form.code });
        if (result.status === "complete") {
          await setActiveSignUp({ session: result.createdSessionId });
          onClose();
          onAuthSuccess?.();
          navigate(ROUTES.DASHBOARD, { replace: true });
        } else {
          setServerError("Verification incomplete. Please check your details.");
        }
      } catch (err) {
        setServerError(err.errors?.[0]?.longMessage || err.message || "Verification failed");
      } finally {
        setLoading(false);
      }
      return;
    }

    const valid = type === "login" ? validateLogin() : validateRegister();
    if (!valid) return;
    setLoading(true);

    try {
      if (type === "login") {
        const result = await signIn.create({
          identifier: form.email,
          password: form.password,
        });
        if (result.status === "complete") {
          await setActiveSignIn({ session: result.createdSessionId });
          onClose();
          onAuthSuccess?.();
          navigate(ROUTES.DASHBOARD, { replace: true });
        } else {
          setServerError("Additional verification required. This UI currently supports simple passwords.");
        }
      } else {
        await signUp.create({
          emailAddress: form.email,
          password: form.password,
        });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setTab("verify");
      }
    } catch (err) {
      setServerError(err.errors?.[0]?.longMessage || err.message || (type === "login" ? "Login failed" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={panelRef}
          tabIndex={-1}
          className="w-full max-w-md flex flex-col bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl animate-scale-in pointer-events-auto outline-none"
          role="dialog"
          aria-modal="true"
          aria-label={tab === "login" ? "Log in" : tab === "register" ? "Create account" : "Verify Email"}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
            <Logo size="sm" onClick={onClose} />
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 px-6 py-4">
            {tab !== "verify" && (
              <div className="flex rounded-md border border-white/10 p-1 gap-1 mb-6 bg-slate-950/50">
                {["login", "register"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-1.5 rounded text-sm font-semibold transition-all border border-transparent ${
                      tab === t
                        ? "bg-indigo-500/30 backdrop-blur-md border-indigo-400/30 text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {t === "login" ? "Log in" : "Sign up"}
                  </button>
                ))}
              </div>
            )}

            {serverError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 mb-4">
                {serverError}
              </div>
            )}

            <div className="relative w-full overflow-hidden">
              <div
                className="flex w-[300%] transition-transform duration-300 ease-in-out"
                style={{ 
                  transform: tab === "login" ? "translateX(0%)" : 
                             tab === "register" ? "translateX(-33.333%)" : 
                             "translateX(-66.666%)" 
                }}
              >
                {/* LOGIN */}
                <div className="w-1/3 flex-shrink-0 px-1">
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold text-white">Welcome back!</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Log in to manage and track your links.
                    </p>
                  </div>
                  <form onSubmit={(e) => onSubmit(e, "login")} className="flex flex-col gap-4" noValidate>
                    <Input
                      id="panel-email-login"
                      name="email"
                      type="email"
                      label="Email address"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={form.email}
                      onChange={onChange}
                      error={tab === "login" ? errors.email : null}
                    />
                    <Input
                      id="panel-password-login"
                      name="password"
                      type="password"
                      label="Password"
                      placeholder="Your password"
                      autoComplete="current-password"
                      value={form.password}
                      onChange={onChange}
                      error={tab === "login" ? errors.password : null}
                    />
                    <Button
                      type="submit"
                      loading={loading && tab === "login"}
                      className="w-full mt-2"
                      size="lg"
                    >
                      Log in
                    </Button>
                  </form>
                </div>

                {/* REGISTER */}
                <div className="w-1/3 flex-shrink-0 px-1">
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold text-white">Create your account</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Start shortening URLs in seconds — it's free.
                    </p>
                  </div>
                  <form onSubmit={(e) => onSubmit(e, "register")} className="flex flex-col gap-4" noValidate>
                    <Input
                      id="panel-email-register"
                      name="email"
                      type="email"
                      label="Email address"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={form.email}
                      onChange={onChange}
                      error={tab === "register" ? errors.email : null}
                    />
                    <Input
                      id="panel-password-register"
                      name="password"
                      type="password"
                      label="Password"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={onChange}
                      error={tab === "register" ? errors.password : null}
                    />
                    <Input
                      id="panel-confirm"
                      name="confirm"
                      type="password"
                      label="Confirm password"
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      value={form.confirm}
                      onChange={onChange}
                      error={tab === "register" ? errors.confirm : null}
                    />
                    <Button
                      type="submit"
                      loading={loading && tab === "register"}
                      className="w-full mt-2"
                      size="lg"
                    >
                      Create account
                    </Button>
                  </form>
                </div>

                {/* VERIFY */}
                <div className="w-1/3 flex-shrink-0 px-1">
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold text-white">Verify your email</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      We sent a 6-digit code to <strong className="text-white">{form.email}</strong>
                    </p>
                  </div>
                  <form onSubmit={(e) => onSubmit(e, "verify")} className="flex flex-col gap-4" noValidate>
                    <Input
                      id="panel-code-verify"
                      name="code"
                      type="text"
                      label="Verification code"
                      placeholder="123456"
                      autoComplete="one-time-code"
                      value={form.code}
                      onChange={onChange}
                      error={tab === "verify" ? errors.code : null}
                    />
                    <Button
                      type="submit"
                      loading={loading && tab === "verify"}
                      className="w-full mt-2"
                      size="lg"
                    >
                      Verify email
                    </Button>
                    <button 
                      type="button" 
                      onClick={() => setTab("register")} 
                      className="text-sm text-gray-400 hover:text-white mt-2 transition-colors"
                    >
                      Back to sign up
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {tab !== "verify" && (
              <>
                <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-gray-500">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <p className="text-center text-sm text-gray-400 mb-2">
                  {tab === "login" ? (
                    <>Don't have an account?{" "}
                      <button onClick={() => setTab("register")} className="font-semibold text-indigo-400 hover:underline">
                        Sign up free
                      </button>
                    </>
                  ) : (
                    <>Already have an account?{" "}
                      <button onClick={() => setTab("login")} className="font-semibold text-indigo-400 hover:underline">
                        Log in
                      </button>
                    </>
                  )}
                </p>
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t border-white/10 flex-shrink-0">
            <p className="text-center text-xs text-gray-500">
              By continuing you agree to our{" "}
              <Link to={ROUTES.TERMS} className="text-indigo-400 hover:underline cursor-pointer">Terms</Link> and{" "}
              <Link to={ROUTES.PRIVACY} className="text-indigo-400 hover:underline cursor-pointer">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
