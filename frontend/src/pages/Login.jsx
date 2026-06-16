import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { validateEmail, validatePassword } from "@/utils/validators";
import { ROUTES } from "@/utils/constants";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function Login({ onOpenAuth }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
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

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = name === "email" ? validateEmail(value) : value ? null : "Password is required";
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back!"
      subtitle="Log in to manage your short links."
      footer={
        <>
          Don't have an account?{" "}
           <Link to={ROUTES.REGISTER} className="font-semibold text-indigo-400 hover:underline">
             Sign up free
           </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {serverError}
          </div>
        )}
        <Input
          id="email" name="email" type="email" label="Email address"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email} onChange={onChange} onBlur={handleBlur} error={errors.email}
        />
        <Input
          id="password" name="password" type="password" label="Password"
          placeholder="Your password"
          autoComplete="current-password"
          value={form.password} onChange={onChange} onBlur={handleBlur} error={errors.password}
        />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
