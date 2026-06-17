const jwt = require("jsonwebtoken");
const config = require("../config");

const SECRET = config.jwtSecret; // required by validateEnv at boot — no fallback

// Read the JWT from the HTTP-only cookie first, then fall back to the
// Authorization: Bearer header. Supporting both lets cookie-based browser
// sessions and token-based clients (Swagger, curl, mobile) coexist.
function extractToken(req) {
  if (req.cookies && req.cookies[config.cookie.name]) {
    return req.cookies[config.cookie.name];
  }
  const authHeader = req.headers["authorization"];
  return authHeader ? authHeader.split(" ")[1] : null;
}

const authenticateToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: "Invalid or expired session" });
    req.user = user;
    next();
  });
};

const optionalAuthenticateToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  jwt.verify(token, SECRET, (err, user) => {
    if (!err) req.user = user;
    next();
  });
};

module.exports = { authenticateToken, optionalAuthenticateToken };
