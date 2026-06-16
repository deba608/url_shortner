import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

// Convenience hook so components do `const { user, login } = useAuth()` instead
// of importing the context object everywhere. Also guards against use outside
// the provider, which would otherwise fail with a confusing null error.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
