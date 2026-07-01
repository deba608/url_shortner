const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config").jwtSecret;
const prisma = require("../config/database");

// A session token is stale if it was issued (iat, seconds) before the user's
// last password change — this is how a password reset logs out old sessions.
// Returns true when the token must be rejected.
const isSessionStale = async (decoded) => {
  if (!decoded?.id) return false;
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { passwordChangedAt: true },
  });
  if (!user) return true; // user gone → token invalid
  if (!user.passwordChangedAt) return false;
  return decoded.iat * 1000 < new Date(user.passwordChangedAt).getTime();
};

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
const authenticateToken = async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (await isSessionStale(decoded)) {
      return res.status(401).json({ error: "Unauthorized: Session expired" });
    }
    req.user = decoded; // { id: "user-id", ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// For routes where auth is optional
const optionalAuthenticateToken = async (req, res, next) => {
  const token = getToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (!(await isSessionStale(decoded))) {
        req.user = decoded;
      }
    } catch (err) {
      // Ignore invalid token for optional routes
    }
  }
  next();
};

module.exports = { authenticateToken, optionalAuthenticateToken };
