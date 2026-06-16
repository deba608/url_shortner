import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { validateEmail, validatePassword } from "@/utils/validators";
import { ROUTES } from "@/utils/constants";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
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
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await register({ email: form.email.trim(), password: form.password });
      toast("Verification code sent to your email", "success");
      // Dev mode surfaces the code so the flow is demoable without real email.
      if (res?.devCode) toast(`Dev code: ${res.devCode}`, "info", 8000);
      navigate(ROUTES.VERIFY_OTP, { state: { email: res.email, devCode: res.devCode } });
    } catch (err) {
      toast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start shortening in seconds"
      footer={
        <>
          Already have an account?{" "}
          <Link to={ROUTES.LOGIN} className="font-semibold text-indigo-400 hover:underline">
            Sign in
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
          id="password" name="password" autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password} onChange={onChange} error={errors.password}
          hint="Use 8+ characters with a mix of letters and numbers."
        />
        <PasswordInput
          id="confirm" name="confirm" label="Confirm password" autoComplete="new-password"
          placeholder="Re-enter your password"
          value={form.confirm} onChange={onChange} error={errors.confirm}
        />
        <Button type="submit" loading={loading} className="w-full">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
