const { validateUrlFormat, validateCustomAlias } = require("../validators/urlValidator");

const validateUrl = (req, res, next) => {
  const { url, customAlias } = req.body;

  if (!url || typeof url !== "string" || url.trim() === "") {
    return res.status(400).json({
      status: "error",
      statusCode: 400,
      message: "URL is required",
    });
  }

  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `http://${normalizedUrl}`;
  }

  req.body.url = normalizedUrl;
  validateUrlFormat(req.body.url);

  if (customAlias !== undefined) {
    req.body.customAlias = validateCustomAlias(customAlias);
  }

  next();
};

module.exports = validateUrl;
