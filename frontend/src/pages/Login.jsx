import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { validateEmail } from "@/utils/validators";
import { ROUTES } from "@/utils/constants";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = {
      email: validateEmail(form.email),
      password: form.password ? null : "Password is required",
    };
    setErrors(next);
    return !next.email && !next.password;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      toast("Welcome back!", "success");
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err?.errors?.[0]?.message || err?.message || "Login failed";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to manage your links"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to={ROUTES.REGISTER} className="font-semibold text-indigo-400 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          id="email" name="email" type="email" label="Email" autoComplete="email"
          placeholder="you@example.com"
          value={form.email} onChange={onChange} error={errors.email}
        />
        <PasswordInput
          id="password" name="password" autoComplete="current-password"
          placeholder="••••••••"
          value={form.password} onChange={onChange} error={errors.password}
          labelAction={
            <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs font-medium text-indigo-400 hover:underline">
              Forgot password?
            </Link>
          }
        />
        <Button type="submit" loading={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
