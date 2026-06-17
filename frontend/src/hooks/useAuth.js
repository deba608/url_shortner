import { useAuth as useClerkAuth, useUser, useClerk, useSignIn, useSignUp } from "@clerk/react";

// Thin wrapper around Clerk hooks that re-exposes the same interface the app
// used before, so pages call useAuth() and never import Clerk directly.
export function useAuth() {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();

  // Login: email + password → Clerk session
  const login = async ({ email, password }) => {
    const result = await signIn.create({ identifier: email, password });
    if (result.status === "complete") {
      await setSignInActive({ session: result.createdSessionId });
    } else {
      throw new Error("Sign-in incomplete. Please try again.");
    }
  };

  // Register: email + password → sends Clerk email verification code.
  // We chain off the resource returned by create() (not the closure's signUp,
  // which is stale after the await) so prepareEmailAddressVerification reliably
  // runs against the freshly-created sign-up. Returns { email } for the caller.
  const register = async ({ email, password }) => {
    console.log("[AUTH] register: start", email);
    const su = await signUp.create({ emailAddress: email, password });
    console.log("[AUTH] register: create done", su?.status, "missing=", su?.missingFields);
    await su.prepareEmailAddressVerification({ strategy: "email_code" });
    console.log("[AUTH] register: prepare done", su?.verifications?.emailAddress?.status);
    return { email };
  };

  // Verify OTP: Clerk email verification code. Uses the live client sign-up
  // resource, since this runs on a different page from register().
  const verifyOtp = async ({ code }) => {
    const su = clerk.client?.signUp ?? signUp;
    const result = await su.attemptEmailAddressVerification({ code });
    if (result.status === "complete") {
      await setSignUpActive({ session: result.createdSessionId });
    } else {
      throw new Error("Verification failed. Please try again.");
    }
  };

  // Resend OTP: re-send Clerk verification email against the live sign-up.
  const resendOtp = async () => {
    const su = clerk.client?.signUp ?? signUp;
    await su.prepareEmailAddressVerification({ strategy: "email_code" });
  };

  // Forgot password: sends Clerk reset code to email
  const forgotPassword = async (email) => {
    await signIn.create({ strategy: "reset_password_email_code", identifier: email });
    return {};
  };

  // Reset password: verify reset code + set new password. Uses the live client
  // sign-in resource, since this runs on a different page from forgotPassword().
  const resetPassword = async ({ code, newPassword }) => {
    const si = clerk.client?.signIn ?? signIn;
    const result = await si.attemptFirstFactor({
      strategy: "reset_password_email_code",
      code,
      password: newPassword,
    });
    if (result.status === "complete") {
      await setSignInActive({ session: result.createdSessionId });
    } else {
      throw new Error("Reset failed. Please try again.");
    }
  };

  const logout = () => clerk.signOut();

  return {
    isAuthenticated: !!isSignedIn,
    initializing: !isLoaded,
    user: user
      ? { id: user.id, email: user.emailAddresses[0]?.emailAddress }
      : null,
    login,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    logout,
  };
}
