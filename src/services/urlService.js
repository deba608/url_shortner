const { nanoid } = require("nanoid");
const QRCode = require("qrcode");
const prisma = require("../config/database");
const redisClient = require("../config/redis");
const config = require("../config");
const ApiError = require("../utils/ApiError");
const {
  SHORT_CODE_LENGTH,
  SUGGESTION_COUNT,
  URL_CACHE_TTL,
  QR_CACHE_TTL,
  QR_PREFIX,
} = require("../utils/constants");

const generateSuggestions = async (baseAlias) => {
  const candidates = new Set();

  const strategies = [
    (alias) => `${alias}1`,
    (alias) => `${alias}${new Date().getFullYear()}`,
    (alias) => `${alias}-${nanoid(3)}`,
    (alias) => `${alias}_${nanoid(3)}`,
    (alias) => `${alias}${Math.floor(Math.random() * 90) + 10}`,
  ];

  for (const strategy of strategies) {
    candidates.add(strategy(baseAlias));
  }

  const existing = await prisma.url.findMany({
    where: { shortCode: { in: Array.from(candidates) } },
    select: { shortCode: true },
  });

  const existingSet = new Set(existing.map((e) => e.shortCode));
  const available = Array.from(candidates).filter((s) => !existingSet.has(s));

  while (available.length < SUGGESTION_COUNT) {
    const candidate = `${baseAlias}-${nanoid(3)}`;
    if (!existingSet.has(candidate) && !available.includes(candidate)) {
      available.push(candidate);
    }
  }

  return available.slice(0, SUGGESTION_COUNT);
};

const createShortUrl = async (originalUrl, customAlias, userId, expiresAt) => {
  let shortCode;

  if (customAlias) {
    const existing = await prisma.url.findUnique({
      where: { shortCode: customAlias },
    });

    if (existing) {
      const suggestions = await generateSuggestions(customAlias);
      const error = new ApiError(409, `Alias "${customAlias}" already exists`);
      error.suggestions = suggestions;
      throw error;
    }

    shortCode = customAlias;
  } else {
    shortCode = nanoid(SHORT_CODE_LENGTH);
  }

  try {
    const data = { originalUrl, shortCode };
    if (userId) data.userId = userId;
    if (expiresAt) data.expiresAt = expiresAt;

    const url = await prisma.url.create({
      data,
    });

    return url;
  } catch (err) {
    if (err.code === "P2002" && customAlias) {
      const suggestions = await generateSuggestions(customAlias);
      const error = new ApiError(409, `Alias "${customAlias}" already exists`);
      error.suggestions = suggestions;
      throw error;
    }
    throw err;
  }
};

const getUserUrls = async (userId) => {
  return await prisma.url.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

const getUrlByShortCode = async (shortCode) => {
  // 1. Before querying PostgreSQL, check Redis
  const cachedUrl = await redisClient.get(shortCode);

  // 2. If Redis contains the URL
  if (cachedUrl) {
    console.log("CACHE HIT");
    return JSON.parse(cachedUrl); // Return parsed JSON object immediately
  }

  // 3. If Redis does not contain the URL (CACHE MISS)
  console.log("CACHE MISS");
  const url = await prisma.url.findUnique({
    where: { shortCode },
  });

  if (!url) {
    throw new ApiError(404, "URL not found");
  }

  // 4. Store the result in Redis.
  // Cap the TTL so the cache never outlives the URL's own expiry — otherwise an
  // expired URL could keep serving 410-but-cached data, and conversely a stale
  // entry could survive past expiry. We use min(default TTL, seconds-until-expiry).
  let ttl = URL_CACHE_TTL;
  if (url.expiresAt) {
    const secondsUntilExpiry = Math.floor((new Date(url.expiresAt).getTime() - Date.now()) / 1000);
    ttl = Math.min(ttl, Math.max(secondsUntilExpiry, 1));
  }
  await redisClient.set(shortCode, JSON.stringify(url), "EX", ttl);

  return url;
};

/**
 * Generate (and cache) a QR code for a URL the user owns.
 * The QR encodes the public short URL, not the original destination, so analytics
 * and expiration still apply when the code is scanned.
 *
 * @returns {{ dataUrl: string, shortUrl: string, shortCode: string }}
 */
const getQrCode = async (urlId, userId) => {
  const id = parseInt(urlId, 10);
  if (Number.isNaN(id)) {
    throw new ApiError(400, "Invalid URL id");
  }

  const url = await prisma.url.findFirst({
    where: { id, userId },
    select: { id: true, shortCode: true },
  });

  if (!url) {
    throw new ApiError(404, "URL not found or unauthorized");
  }

  const cacheKey = `${QR_PREFIX}${url.shortCode}`;
  const shortUrl = `${config.baseUrl}/${url.shortCode}`;

  // QR images are deterministic for a given short URL, so caching is safe and cheap.
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return { dataUrl: cached, shortUrl, shortCode: url.shortCode };
  }

  const dataUrl = await QRCode.toDataURL(shortUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
  });

  await redisClient.set(cacheKey, dataUrl, "EX", QR_CACHE_TTL);

  return { dataUrl, shortUrl, shortCode: url.shortCode };
};

/**
 * Update (or clear) the expiration of a URL the user owns.
 * Invalidates the redirect cache so the new expiry takes effect immediately.
 *
 * @param {Date|null} expiresAt absolute expiry, or null to clear it.
 */
const updateExpiration = async (urlId, userId, expiresAt) => {
  const id = parseInt(urlId, 10);
  if (Number.isNaN(id)) {
    throw new ApiError(400, "Invalid URL id");
  }

  const url = await prisma.url.findFirst({
    where: { id, userId },
    select: { id: true, shortCode: true },
  });

  if (!url) {
    throw new ApiError(404, "URL not found or unauthorized");
  }

  const updated = await prisma.url.update({
    where: { id: url.id },
    data: { expiresAt },
  });

  // Invalidate the cached redirect entry so the new expiry is honoured at once.
  await redisClient.del(url.shortCode);

  return updated;
};

/**
 * Delete a URL the user owns. Related Click rows are removed automatically via
 * the onDelete: Cascade relation. Also evicts the redirect + QR cache entries.
 */
const deleteUrl = async (urlId, userId) => {
  const id = parseInt(urlId, 10);
  if (Number.isNaN(id)) {
    throw new ApiError(400, "Invalid URL id");
  }

  const url = await prisma.url.findFirst({
    where: { id, userId },
    select: { id: true, shortCode: true },
  });

  if (!url) {
    throw new ApiError(404, "URL not found or unauthorized");
  }

  await prisma.url.delete({ where: { id: url.id } });

  // Drop any cached entries for this short code so it stops resolving.
  await redisClient.del(url.shortCode);
  await redisClient.del(`${QR_PREFIX}${url.shortCode}`);

  return { id: url.id, shortCode: url.shortCode };
};

const recordClick = async (shortCode, ipAddress, userAgent) => {
  const url = await prisma.url.findUnique({
    where: { shortCode },
  });

  if (!url) return null;

  // Execute click recording and counter increment in a transaction
  const [updatedUrl, clickRecord] = await prisma.$transaction([
    prisma.url.update({
      where: { id: url.id },
      data: { clicks: { increment: 1 } },
    }),
    prisma.click.create({
      data: {
        urlId: url.id,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    }),
  ]);

  return updatedUrl;
};

const getUrlAnalytics = async (urlId, userId) => {
  const url = await prisma.url.findFirst({
    where: {
      id: parseInt(urlId),
      userId: userId, // Ensure user owns the URL
    },
    include: {
      clickHistory: {
        orderBy: { clickedAt: 'desc' },
        take: 100, // Limit history to last 100 clicks
      },
    },
  });

  if (!url) {
    throw new ApiError(404, "URL not found or unauthorized");
  }

  // Time windows for the daily / weekly rollups.
  const now = Date.now();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Run the independent aggregations concurrently to keep latency low.
  const [lastClick, uniqueGroups, dailyClicks, weeklyClicks] = await Promise.all([
    prisma.click.findFirst({
      where: { urlId: url.id },
      orderBy: { clickedAt: "desc" },
    }),
    // Unique visitors approximated by distinct IP address. groupBy returns one
    // row per distinct ipAddress; its length is the unique count.
    prisma.click.groupBy({
      by: ["ipAddress"],
      where: { urlId: url.id },
    }),
    prisma.click.count({
      where: { urlId: url.id, clickedAt: { gte: oneDayAgo } },
    }),
    prisma.click.count({
      where: { urlId: url.id, clickedAt: { gte: sevenDaysAgo } },
    }),
  ]);

  return {
    totalClicks: url.clicks,
    uniqueVisitors: uniqueGroups.length,
    lastAccessed: lastClick ? lastClick.clickedAt : null,
    dailyClicks,
    weeklyClicks,
    createdAt: url.createdAt,
    clickHistory: url.clickHistory,
  };
};

const getTopUrls = async (userId) => {
  const topUrls = await prisma.url.findMany({
    where: { userId: userId },
    orderBy: { clicks: 'desc' },
    take: 10,
    select: {
      id: true,
      originalUrl: true,
      shortCode: true,
      clicks: true,
      createdAt: true,
    },
  });

  return topUrls;
};

module.exports = {
  createShortUrl,
  getUrlByShortCode,
  recordClick,
  getUrlAnalytics,
  getTopUrls,
  getUserUrls,
  getQrCode,
  updateExpiration,
  deleteUrl,
};
