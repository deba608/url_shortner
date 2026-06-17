import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ROUTES, OTP_LENGTH, OTP_RESEND_COOLDOWN_SEC } from "@/utils/constants";
import AuthCard from "@/components/AuthCard";
import OtpInput from "@/components/ui/OtpInput";
import Button from "@/components/ui/Button";

export default function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(OTP_RESEND_COOLDOWN_SEC);
  const submittedFor = useRef("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (value) => {
    setLoading(true);
    try {
      await verifyOtp({ code: value });
      toast("Email verified — you're all set!", "success");
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      const msg = err?.errors?.[0]?.message || err?.message || "Verification failed";
      toast(msg, "error");
      setCode("");
      submittedFor.current = "";
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when all 6 digits are entered.
  useEffect(() => {
    if (code.length === OTP_LENGTH && !loading && submittedFor.current !== code) {
      submittedFor.current = code;
      submit(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const onResend = async () => {
    try {
      await resendOtp();
      toast("A new code has been sent", "success");
      setCooldown(OTP_RESEND_COOLDOWN_SEC);
    } catch (err) {
      toast(err?.errors?.[0]?.message || err?.message || "Could not resend code", "error");
    }
  };

  if (!email) return <Navigate to={ROUTES.REGISTER} replace />;

  return (
    <AuthCard
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email}`}
      footer={
        <span className="text-gray-400">
          Wrong email?{" "}
          <button onClick={() => navigate(ROUTES.REGISTER)} className="font-semibold text-indigo-400 hover:underline">
            Start over
          </button>
        </span>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); if (code.length === OTP_LENGTH) submit(code); }} className="flex flex-col gap-5">
        <OtpInput value={code} onChange={setCode} disabled={loading} autoFocus />
        <Button type="submit" loading={loading} disabled={code.length !== OTP_LENGTH} className="w-full">
          {loading ? "Verifying…" : "Verify email"}
        </Button>
        <div className="text-center text-sm text-gray-400">
          Didn&apos;t get it?{" "}
          {cooldown > 0 ? (
            <span className="text-gray-500">Resend in {cooldown}s</span>
          ) : (
            <button type="button" onClick={onResend} className="font-semibold text-indigo-400 hover:underline">
              Resend code
            </button>
          )}
        </div>
      </form>
    </AuthCard>
  );
}
