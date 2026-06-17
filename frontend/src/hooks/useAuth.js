import { useAuth as useClerkAuth, useUser, useClerk, useSignIn, useSignUp } from "@clerk/react";

// Thin wrapper around Clerk hooks that re-exposes the same interface the app
// used before. All methods guard on isLoaded before calling Clerk APIs,
// following Clerk's documented best practices for custom UI flows.
export function useAuth() {
  const { isSignedIn, isLoaded: authLoaded } = useClerkAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

  // Login: email + password → Clerk session.
  // Guards on isLoaded before calling signIn to avoid Clerk SDK boot errors.
  const login = async ({ email, password }) => {
    if (!signInLoaded) throw new Error("Clerk is still loading. Please try again.");
    const result = await signIn.create({ identifier: email, password });
    if (result.status === "complete") {
      await setSignInActive({ session: result.createdSessionId });
    } else {
      // Handle multi-factor or other incomplete states
      throw new Error("Sign-in incomplete. Please try again.");
    }
  };

  // Register: email + password → sends Clerk email verification code.
  // Per Clerk docs: always chain off the resource returned by create() (not
  // the closure's signUp, which may be stale after the await). Also check
  // signUp.status after create() — if email_code is configured in the
  // dashboard, Clerk may auto-prepare verification and status will be
  // "missing_requirements" with verifications already populated.
  const register = async ({ email, password }) => {
    if (!signUpLoaded) throw new Error("Clerk is still loading. Please try again.");
    // create() returns the updated SignUp resource
    const su = await signUp.create({ emailAddress: email, password });
    // Only call prepareEmailAddressVerification if not already prepared
    if (su.status !== "complete" && su.verifications?.emailAddress?.status !== "unverified") {
      await su.prepareEmailAddressVerification({ strategy: "email_code" });
    }
    return { email };
  };

  // Verify OTP: Clerk email verification code.
  // Uses the live client sign-up resource (clerk.client?.signUp) since this
  // runs on a different page from register() and the hook's signUp may refer
  // to a different, stale attempt. Falls back to hook's signUp if not set.
  const verifyOtp = async ({ code }) => {
    if (!signUpLoaded) throw new Error("Clerk is still loading. Please try again.");
    const su = clerk.client?.signUp ?? signUp;
    if (!su) throw new Error("No active sign-up session found. Please register again.");
    const result = await su.attemptEmailAddressVerification({ code });
    if (result.status === "complete") {
      await setSignUpActive({ session: result.createdSessionId });
    } else {
      throw new Error("Verification failed. Please try again.");
    }
  };

  // Resend OTP: re-send Clerk verification email against the live sign-up.
  const resendOtp = async () => {
    if (!signUpLoaded) throw new Error("Clerk is still loading. Please try again.");
    const su = clerk.client?.signUp ?? signUp;
    if (!su) throw new Error("No active sign-up session found. Please register again.");
    await su.prepareEmailAddressVerification({ strategy: "email_code" });
  };

  // Forgot password: sends Clerk reset code to email.
  const forgotPassword = async (email) => {
    if (!signInLoaded) throw new Error("Clerk is still loading. Please try again.");
    await signIn.create({ strategy: "reset_password_email_code", identifier: email });
    return {};
  };

  // Reset password: verify reset code + set new password.
  // Uses the live client sign-in resource since this runs on a different page.
  const resetPassword = async ({ code, newPassword }) => {
    if (!signInLoaded) throw new Error("Clerk is still loading. Please try again.");
    const si = clerk.client?.signIn ?? signIn;
    if (!si) throw new Error("No active sign-in session found. Please try forgot password again.");
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
    // initializing is true until ALL clerk contexts have loaded
    initializing: !authLoaded || !signInLoaded || !signUpLoaded,
    user: user
      ? { id: user.id, email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress }
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
