const urlService = require("../services/urlService");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const config = require("../config");
const logger = require("../config/logger");
const { resolveExpiration, isExpired } = require("../validators/expirationValidator");

const createShortUrl = catchAsync(async (req, res) => {
  const { url, customAlias, expiresIn, expiresAt } = req.body;
  const userId = req.user ? req.user.id : null;

  // resolveExpiration returns: Date (set), null (clear), or undefined (not provided).
  const resolved = resolveExpiration({ expiresIn, expiresAt });
  const expiry = resolved === undefined ? undefined : resolved;

  const result = await urlService.createShortUrl(url, customAlias, userId, expiry);

  res.status(201).json({
    status: "success",
    data: {
      shortCode: result.shortCode,
      shortUrl: `${config.baseUrl}/${result.shortCode}`,
      expiresAt: result.expiresAt || null,
    },
  });
});

const redirectToUrl = catchAsync(async (req, res) => {
  const { shortCode } = req.params;
  const url = await urlService.getUrlByShortCode(shortCode);

  // Expiration gate: an expired link must not redirect. 410 Gone tells clients
  // (and crawlers) the resource existed but is permanently unavailable.
  if (isExpired(url)) {
    throw new ApiError(410, "This short URL has expired");
  }

  // Extract IP and User-Agent
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  // Asynchronously record the click without blocking the redirect response
  urlService.recordClick(shortCode, ipAddress, userAgent).catch(err => {
    logger.error("Failed to record click", { shortCode, error: err.message });
  });

  res.redirect(url.originalUrl);
});

const getUrlStats = catchAsync(async (req, res) => {
  const { shortCode } = req.params;
  const url = await urlService.getUrlByShortCode(shortCode);

  res.json({
    status: "success",
    data: {
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
    },
  });
});

const getUserUrls = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const urls = await urlService.getUserUrls(userId);

  res.json({
    status: "success",
    data: urls.map(url => ({
      ...url,
      shortUrl: `${config.baseUrl}/${url.shortCode}`
    }))
  });
});

const getUrlAnalytics = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const analytics = await urlService.getUrlAnalytics(id, userId);

  res.json({
    status: "success",
    data: analytics,
  });
});

const getTopUrls = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const topUrls = await urlService.getTopUrls(userId);

  res.json({
    status: "success",
    data: topUrls,
  });
});

const getQrCode = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const { dataUrl, shortUrl, shortCode } = await urlService.getQrCode(id, userId);

  // ?format=png streams the raw image; default returns the base64 data URL as JSON.
  if (req.query.format === "png") {
    const base64 = dataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
    res.set("Content-Type", "image/png");
    return res.send(buffer);
  }

  res.json({
    status: "success",
    data: { shortCode, shortUrl, qrCode: dataUrl },
  });
});

const updateExpiration = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { expiresIn, expiresAt } = req.body;

  const resolved = resolveExpiration({ expiresIn, expiresAt });
  if (resolved === undefined) {
    throw new ApiError(400, "Provide 'expiresIn' or 'expiresAt' (use null to clear expiration)");
  }

  const updated = await urlService.updateExpiration(id, userId, resolved);

  res.json({
    status: "success",
    data: {
      id: updated.id,
      shortCode: updated.shortCode,
      expiresAt: updated.expiresAt || null,
    },
  });
});

const deleteUrl = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const deleted = await urlService.deleteUrl(id, userId);

  res.json({
    status: "success",
    data: { id: deleted.id, shortCode: deleted.shortCode },
  });
});

module.exports = {
  createShortUrl,
  redirectToUrl,
  getUrlStats,
  getUserUrls,
  getUrlAnalytics,
  getTopUrls,
  getQrCode,
  updateExpiration,
  deleteUrl,
};
