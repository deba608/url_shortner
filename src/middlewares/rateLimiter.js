const rateLimit = require("express-rate-limit");

//max 100 requests within 15 minutes

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,

    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

module.exports = rateLimiter;