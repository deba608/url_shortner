import { useAuth as useClerkAuth, useUser, useClerk, useSignIn, useSignUp } from "@clerk/react";

// Thin wrapper around Clerk hooks that re-exposes the same interface the app
// used before, so pages call useAuth() and never import Clerk directly.
export function useAuth() {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
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

  // Register: email + password → sends Clerk email verification code
  // Returns { email } so callers can navigate to the verify screen.
  const register = async ({ email, password }) => {
    await signUp.create({ emailAddress: email, password });
    await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    return { email };
  };

  // Verify OTP: Clerk email verification code
  const verifyOtp = async ({ code }) => {
    const result = await signUp.attemptEmailAddressVerification({ code });
    if (result.status === "complete") {
      await setSignUpActive({ session: result.createdSessionId });
    } else {
      throw new Error("Verification failed. Please try again.");
    }
  };

  // Resend OTP: re-send Clerk verification email
  const resendOtp = async () => {
    await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
  };

  // Forgot password: sends Clerk reset code to email
  const forgotPassword = async (email) => {
    await signIn.create({ strategy: "reset_password_email_code", identifier: email });
    return {};
  };

  // Reset password: verify reset code + set new password
  const resetPassword = async ({ code, newPassword }) => {
    const result = await signIn.attemptFirstFactor({
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

  const logout = () => signOut();

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
