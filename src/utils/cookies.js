const config = require("../config");

// Centralised auth-cookie helpers so the attributes are identical on set + clear
// (a mismatch is the classic reason a "logout" cookie clear silently fails).
const baseOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  path: "/",
});

function setAuthCookie(res, token) {
  res.cookie(config.cookie.name, token, {
    ...baseOptions(),
    maxAge: config.cookie.maxAgeMs,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(config.cookie.name, baseOptions());
}

module.exports = { setAuthCookie, clearAuthCookie };
