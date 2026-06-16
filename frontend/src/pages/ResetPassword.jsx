import { useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { validatePassword } from "@/utils/validators";
import { ROUTES, OTP_LENGTH } from "@/utils/constants";
import AuthCard from "@/components/AuthCard";
import OtpInput from "@/components/ui/OtpInput";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [code, setCode] = useState("");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = {
      code: code.length !== OTP_LENGTH ? "Enter the 6-digit code" : null,
      password: validatePassword(form.password),
      confirm: form.password !== form.confirm ? "Passwords do not match" : null,
    };
    setErrors(next);
    return !next.code && !next.password && !next.confirm;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword({ email, code, newPassword: form.password });
      toast("Password reset — you're signed in", "success");
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      toast(err.message || "Reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Guard: needs the email captured on the forgot-password screen.
  if (!email) return <Navigate to={ROUTES.FORGOT_PASSWORD} replace />;

  return (
    <AuthCard
      title="Reset password"
      subtitle={`Enter the code sent to ${email} and choose a new password`}
      footer={
        <Link to={ROUTES.LOGIN} className="font-semibold text-indigo-400 hover:underline">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-300">Verification code</span>
          <OtpInput value={code} onChange={setCode} disabled={loading} autoFocus />
          {errors.code && <p className="text-xs text-red-400">{errors.code}</p>}
        </div>
        <PasswordInput
          id="password" name="password" label="New password" autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password} onChange={onChange} error={errors.password}
        />
        <PasswordInput
          id="confirm" name="confirm" label="Confirm new password" autoComplete="new-password"
          placeholder="Re-enter your password"
          value={form.confirm} onChange={onChange} error={errors.confirm}
        />
        <Button type="submit" loading={loading} className="w-full">
          {loading ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </AuthCard>
  );
}
