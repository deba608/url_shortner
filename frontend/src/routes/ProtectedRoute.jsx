import { useAuth, RedirectToSignIn } from "@clerk/react";
import Spinner from "@/components/ui/Spinner";

// Gate for authenticated routes. Clerk's useAuth resolves the session; while it
// loads we show a spinner, and unauthenticated users are sent to Clerk sign-in.
export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return children;
}
