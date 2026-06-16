import axiosClient from "@/api/axiosClient";

// Auth endpoints. The backend wraps payloads in { status, data }, so we unwrap
// `.data.data`. Errors are already normalised by the axiosClient interceptor.
const unwrap = (res) => res.data?.data ?? res.data;

// POST /auth/register -> { email, requiresVerification, devCode? }  (no session)
export const registerRequest = async (payload) =>
  unwrap(await axiosClient.post("/auth/register", payload));

// POST /auth/verify-otp -> { user, token }  (session)
export const verifyOtpRequest = async (payload) =>
  unwrap(await axiosClient.post("/auth/verify-otp", payload));

// POST /auth/resend-otp -> { email, devCode? }
export const resendOtpRequest = async (email) =>
  unwrap(await axiosClient.post("/auth/resend-otp", { email }));

// POST /auth/login -> { user, token }  (session) | 403 requiresVerification
export const loginRequest = async (payload) =>
  unwrap(await axiosClient.post("/auth/login", payload));

// POST /auth/forgot-password -> { devCode? }  (always generic)
export const forgotPasswordRequest = async (email) =>
  unwrap(await axiosClient.post("/auth/forgot-password", { email }));

// POST /auth/reset-password -> { user, token }  (session)
export const resetPasswordRequest = async (payload) =>
  unwrap(await axiosClient.post("/auth/reset-password", payload));

// GET /auth/me -> user
export const meRequest = async () => {
  const data = unwrap(await axiosClient.get("/auth/me"));
  return data.user;
};

// POST /auth/logout
export const logoutRequest = async () => axiosClient.post("/auth/logout");
