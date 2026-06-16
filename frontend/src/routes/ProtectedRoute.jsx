import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";

// Gate for authenticated-only routes. Renders children if logged in, otherwise
// redirects to /login while remembering where the user was headed (so we can
// return them there after a successful login).
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  // Wait for the stored token to be validated before deciding — otherwise a hard
  // refresh on a protected page would briefly redirect an authenticated user.
  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
}
