const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";

// For strictly protected routes
const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;

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
  const token = req.cookies?.token;

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
