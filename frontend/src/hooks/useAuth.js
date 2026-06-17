import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

// Consume the shared auth context. Guards against use outside the provider.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
