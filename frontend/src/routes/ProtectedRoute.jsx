import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import { ROUTES } from "@/utils/constants";

// Gate for authenticated routes. Uses custom useAuth.
// Unauthenticated users are redirected to our custom /login
// page so the "from" location is preserved.
export default function ProtectedRoute({ children }) {
  const { initializing, isAuthenticated } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the attempted URL so Login can redirect back after auth
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
}
