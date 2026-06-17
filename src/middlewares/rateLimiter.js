const rateLimit = require("express-rate-limit");

// Global limiter — 100 requests per 15 minutes per IP.
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

// Redirect limiter — tighter guard on the hot GET /:shortCode path.
// 20 requests per minute per IP is generous for legitimate users but
// throttles enumeration / abuse scans.
const redirectRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: "Too many redirect requests. Please try again later."
    }
});

module.exports = rateLimiter;
module.exports.redirectRateLimiter = redirectRateLimiter;