const { requireAuth } = require("@clerk/express");

// For strictly protected routes, use Clerk's requireAuth()
const authenticateToken = requireAuth();

// For routes where auth is optional, the clerkMiddleware() applied globally in app.js
// already populates req.auth. We just pass the request through.
const optionalAuthenticateToken = (req, res, next) => next();

module.exports = { authenticateToken, optionalAuthenticateToken };
