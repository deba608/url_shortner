import { useAuth as useClerkAuth } from "@clerk/react";
import { Navigate, useLocation } from "react-router-dom";
import Spinner from "@/components/ui/Spinner";
import { ROUTES } from "@/utils/constants";

// Gate for authenticated routes. Uses Clerk's useAuth directly for a fast
// isLoaded check. Unauthenticated users are redirected to our custom /login
// page (not Clerk's hosted UI) so the "from" location is preserved.
export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    // Preserve the attempted URL so Login can redirect back after auth
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
}
