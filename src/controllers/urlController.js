const urlService = require("../services/urlService");
const catchAsync = require("../utils/catchAsync");
const config = require("../config");

const createShortUrl = catchAsync(async (req, res) => {
  const { url, customAlias } = req.body;
  const userId = req.user ? req.user.id : null;
  const result = await urlService.createShortUrl(url, customAlias, userId);

  res.status(201).json({
    status: "success",
    data: {
      shortCode: result.shortCode,
      shortUrl: `${config.baseUrl}/${result.shortCode}`,
    },
  });
});

const redirectToUrl = catchAsync(async (req, res) => {
  const { shortCode } = req.params;
  const url = await urlService.getUrlByShortCode(shortCode);
  await urlService.incrementClicks(shortCode);

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

module.exports = {
  createShortUrl,
  redirectToUrl,
  getUrlStats,
  getUserUrls,
};
