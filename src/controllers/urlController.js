const urlService = require("../services/urlService");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const config = require("../config");
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
    console.error("Failed to record click:", err);
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

module.exports = {
  createShortUrl,
  redirectToUrl,
  getUrlStats,
  getUserUrls,
  getUrlAnalytics,
  getTopUrls,
};
