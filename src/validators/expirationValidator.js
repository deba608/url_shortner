const ApiError = require("../utils/ApiError");
const { EXPIRATION_PRESETS, MAX_EXPIRATION_DAYS } = require("../utils/constants");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Resolve an expiration input into an absolute Date (or null for "never expires").
 *
 * Accepts ONE of:
 *   - expiresIn: a preset string ("7d", "30d", "90d") or a positive number of days
 *   - expiresAt: an absolute ISO-8601 date string / Date in the future
 *
 * Passing `null` explicitly for either field clears the expiration (returns null).
 *
 * @returns {Date|null} the absolute expiry instant, or null if there is none.
 */
const resolveExpiration = ({ expiresIn, expiresAt } = {}) => {
  // Nothing supplied -> no expiration set / unchanged is handled by caller.
  if (expiresIn === undefined && expiresAt === undefined) {
    return undefined; // signals "not provided"
  }

  // Explicit clear.
  if (expiresIn === null || expiresAt === null) {
    return null;
  }

  if (expiresIn !== undefined && expiresAt !== undefined) {
    throw new ApiError(400, "Provide either 'expiresIn' or 'expiresAt', not both");
  }

  if (expiresIn !== undefined) {
    let days;

    if (typeof expiresIn === "string" && EXPIRATION_PRESETS[expiresIn] !== undefined) {
      days = EXPIRATION_PRESETS[expiresIn];
    } else if (typeof expiresIn === "number" || /^\d+$/.test(String(expiresIn))) {
      days = Number(expiresIn);
    } else {
      throw new ApiError(
        400,
        `Invalid 'expiresIn'. Use a preset (${Object.keys(EXPIRATION_PRESETS).join(", ")}) or a number of days`
      );
    }

    if (!Number.isFinite(days) || days <= 0) {
      throw new ApiError(400, "'expiresIn' must be a positive number of days");
    }
    if (days > MAX_EXPIRATION_DAYS) {
      throw new ApiError(400, `'expiresIn' cannot exceed ${MAX_EXPIRATION_DAYS} days`);
    }

    return new Date(Date.now() + days * MS_PER_DAY);
  }

  // expiresAt path
  const date = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "'expiresAt' must be a valid ISO-8601 date");
  }
  if (date.getTime() <= Date.now()) {
    throw new ApiError(400, "'expiresAt' must be a date in the future");
  }
  if (date.getTime() > Date.now() + MAX_EXPIRATION_DAYS * MS_PER_DAY) {
    throw new ApiError(400, `'expiresAt' cannot be more than ${MAX_EXPIRATION_DAYS} days away`);
  }

  return date;
};

/** Returns true if the given url record is currently expired. */
const isExpired = (url) => {
  if (!url || !url.expiresAt) return false;
  return new Date(url.expiresAt).getTime() <= Date.now();
};

module.exports = { resolveExpiration, isExpired };
