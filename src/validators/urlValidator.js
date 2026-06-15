const ApiError = require("../utils/ApiError");
const { ALIAS_MIN_LENGTH, ALIAS_MAX_LENGTH, ALIAS_PATTERN } = require("../utils/constants");

const validateUrlFormat = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    throw new ApiError(400, "Invalid URL format");
  }
};

const validateCustomAlias = (alias) => {
  if (!alias || typeof alias !== "string") {
    return undefined;
  }

  const trimmed = alias.trim();

  if (trimmed.length < ALIAS_MIN_LENGTH) {
    throw new ApiError(400, `Custom alias must be at least ${ALIAS_MIN_LENGTH} characters`);
  }

  if (trimmed.length > ALIAS_MAX_LENGTH) {
    throw new ApiError(400, `Custom alias must be at most ${ALIAS_MAX_LENGTH} characters`);
  }

  if (!ALIAS_PATTERN.test(trimmed)) {
    throw new ApiError(400, "Custom alias can only contain letters, numbers, hyphens, and underscores");
  }

  return trimmed;
};

module.exports = { validateUrlFormat, validateCustomAlias };
