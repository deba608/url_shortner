import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ROUTES } from "@/utils/constants";
import AuthCard from "@/components/AuthCard";
import Spinner from "@/components/ui/Spinner";

export default function Login() {
  const { loginWithGoogle, initializing } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast("Welcome!", "success");
      navigate(from, { replace: true });
    } catch (err) {
      toast("Authentication failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    toast("Google authentication failed", "error");
  };

  return (
    <AuthCard
      title="Shorten. Track. Analyze."
      subtitle="Create and manage links with real-time analytics."
      footer={
        <div className="text-center text-xs text-gray-400">
          By continuing, you agree to our{" "}
          <Link to={ROUTES.TERMS} className="text-indigo-400 hover:underline">
            Terms
          </Link>{" "}
          &{" "}
          <Link to={ROUTES.PRIVACY} className="text-indigo-400 hover:underline">
            Privacy Policy
          </Link>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center gap-6 py-4">
        {loading || initializing ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner className="h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-gray-400">Signing you in...</p>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              theme="filled_black"
              shape="pill"
              text="continue_with"
              size="large"
              width="100%"
            />
          </div>
        )}
      </div>
    </AuthCard>
  );
}
