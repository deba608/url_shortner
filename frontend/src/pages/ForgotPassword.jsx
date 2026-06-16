import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { validateEmail } from "@/utils/validators";
import { ROUTES } from "@/utils/constants";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    setError(err);
    if (err) return;

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      // Always generic — the backend never reveals whether the email exists.
      toast("If an account exists, a reset code has been sent", "success");
      if (res?.devCode) toast(`Dev code: ${res.devCode}`, "info", 8000);
      navigate(ROUTES.RESET_PASSWORD, { state: { email: email.trim(), devCode: res?.devCode } });
    } catch (err2) {
      toast(err2.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset code"
      footer={
        <Link to={ROUTES.LOGIN} className="font-semibold text-indigo-400 hover:underline">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          id="email" name="email" type="email" label="Email" autoComplete="email"
          placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} error={error}
        />
        <Button type="submit" loading={loading} className="w-full">
          {loading ? "Sending…" : "Send reset code"}
        </Button>
      </form>
    </AuthCard>
  );
}
