const jwt = require("jsonwebtoken");
const config = require("../config");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // If we want optional auth (e.g. for creating anonymous URLs), we could just next() without setting req.user.
    // However, if the route strictly requires auth, we return 401.
    return res.status(401).json({ error: "Access token is missing" });
  }

  jwt.verify(token, config.jwtSecret || "default_secret", (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, config.jwtSecret || "default_secret", (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};

module.exports = { authenticateToken, optionalAuthenticateToken };
