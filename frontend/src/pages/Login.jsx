import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { validateEmail, validatePassword } from "@/utils/validators";
import { ROUTES } from "@/utils/constants";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // If the user was redirected here by ProtectedRoute, send them back afterward.
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };
    setErrors(next);
    return !next.email && !next.password;
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
      setServerError(err.message || "Login failed");
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
          No account?{" "}
          <Link to={ROUTES.REGISTER} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {serverError}
          </p>
        )}
        <Input
          id="email" name="email" type="email" label="Email" autoComplete="email"
          value={form.email} onChange={onChange} error={errors.email}
        />
        <Input
          id="password" name="password" type="password" label="Password" autoComplete="current-password"
          value={form.password} onChange={onChange} error={errors.password}
        />
        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
