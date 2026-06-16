module.exports = {
  SHORT_CODE_LENGTH: 6,
  ALIAS_MIN_LENGTH: 3,
  ALIAS_MAX_LENGTH: 20,
  SUGGESTION_COUNT: 5,
  ALIAS_PATTERN: /^[a-zA-Z0-9_-]+$/,

  // URL cache TTL in seconds (used for the shortCode -> url lookup cache)
  URL_CACHE_TTL: 3600,

  // QR code generation / caching
  QR_CACHE_TTL: 86400, // 24h
  QR_PREFIX: "qr:", // Redis key prefix for cached QR data URLs

  // Expiration presets accepted by the `expiresIn` shorthand (in days)
  EXPIRATION_PRESETS: {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  },
  MAX_EXPIRATION_DAYS: 3650, // hard ceiling: ~10 years
};
