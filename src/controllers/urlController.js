const urlService = require("../services/urlService");
const catchAsync = require("../utils/catchAsync");
const config = require("../config");

const createShortUrl = catchAsync(async (req, res) => {
  const { url, customAlias } = req.body;
  const result = await urlService.createShortUrl(url, customAlias);

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

module.exports = {
  createShortUrl,
  redirectToUrl,
  getUrlStats,
};
