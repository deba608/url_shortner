const catchAsync = require("../utils/catchAsync");
const authService = require("../services/authService");
const { setAuthCookie, clearAuthCookie } = require("../utils/cookies");

// Shape an authenticated response: set the HTTP-only cookie AND return the token
// in the body so both cookie-based and Bearer-based clients work.
function sendSession(res, status, { user, token }, extra = {}) {
  setAuthCookie(res, token);
  res.status(status).json({ status: "success", data: { user, token, ...extra } });
}

const register = catchAsync(async (req, res) => {
  const { email, devCode } = await authService.register(req.body);
  res.status(201).json({
    status: "success",
    message: "Verification code sent. Please check your email.",
    data: { email, requiresVerification: true, ...(devCode ? { devCode } : {}) },
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const session = await authService.verifyEmail(req.body);
  sendSession(res, 200, session);
});

const resendVerification = catchAsync(async (req, res) => {
  const { email, devCode } = await authService.resendVerification(req.body);
  res.json({
    status: "success",
    message: "A new code has been sent.",
    data: { email, ...(devCode ? { devCode } : {}) },
  });
});

const login = catchAsync(async (req, res) => {
  const session = await authService.login(req.body);
  sendSession(res, 200, session);
});

const forgotPassword = catchAsync(async (req, res) => {
  const { devCode } = await authService.forgotPassword(req.body);
  // Always generic — never reveal whether the email exists.
  res.json({
    status: "success",
    message: "If an account exists for that email, a reset code has been sent.",
    data: { ...(devCode ? { devCode } : {}) },
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const session = await authService.resetPassword(req.body);
  sendSession(res, 200, session);
});

const me = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json({ status: "success", data: { user } });
});

const logout = catchAsync(async (req, res) => {
  clearAuthCookie(res);
  res.json({ status: "success", message: "Logged out" });
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  me,
  logout,
};
