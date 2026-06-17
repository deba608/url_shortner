const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";

// Pull the JWT from the cookie OR the Authorization: Bearer header. The Bearer
// path is what works cross-site (Vercel frontend → Render API), where the
// browser won't send the third-party cookie.
const getToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
};

// For strictly protected routes
const authenticateToken = (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id: "user-id", ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// For routes where auth is optional
const optionalAuthenticateToken = (req, res, next) => {
  const token = getToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Ignore invalid token for optional routes
    }
  }
  next();
};

module.exports = { authenticateToken, optionalAuthenticateToken };
