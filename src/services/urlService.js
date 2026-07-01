const { nanoid } = require("nanoid");
const QRCode = require("qrcode");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");
const crypto = require("crypto");
const sharp = require("sharp");
const prisma = require("../config/database");
const redisClient = require("../config/redis");
const logger = require("../config/logger");
const config = require("../config");
const ApiError = require("../utils/ApiError");
const {
  SHORT_CODE_LENGTH,
  SUGGESTION_COUNT,
  URL_CACHE_TTL,
  QR_CACHE_TTL,
  QR_PREFIX,
} = require("../utils/constants");

/**
 * Resolve a URL the given user owns, or throw. Centralizes the parseInt + NaN
 * guard + ownership `findFirst` + 404 that several handlers repeated.
 *
 * @param {string|number} urlId  raw id from the request params
 * @param {string} userId        owner id
 * @param {object} [select]      optional Prisma `select` projection
 * @returns the matching url row
 */
const findOwnedUrlOr404 = async (urlId, userId, select) => {
  const id = parseInt(urlId, 10);
  if (Number.isNaN(id)) {
    throw new ApiError(400, "Invalid URL id");
  }

  const url = await prisma.url.findFirst({
    where: { id, userId },
    ...(select ? { select } : {}),
  });

  if (!url) {
    throw new ApiError(404, "URL not found or unauthorized");
  }

  return url;
};

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
  // 1. Before querying PostgreSQL, check Redis. The cache is an optimization,
  // not a dependency — if Redis is down, log and fall through to the database so
  // redirects keep working (availability on the hot path).
  let cachedUrl = null;
  try {
    cachedUrl = await redisClient.get(shortCode);
  } catch (err) {
    logger.error("Redis GET failed; falling back to DB", { shortCode, error: err.message });
  }

  // 2. If Redis contains the URL
  if (cachedUrl) {
    logger.debug("Redirect cache hit", { shortCode });
    return JSON.parse(cachedUrl); // Return parsed JSON object immediately
  }

  // 3. If Redis does not contain the URL (CACHE MISS)
  logger.debug("Redirect cache miss", { shortCode });
  const url = await prisma.url.findUnique({
    where: { shortCode },
  });

  if (!url) {
    throw new ApiError(404, "URL not found");
  }

  // 4. Store the result in Redis. Best-effort — a cache write failure must not
  // fail the redirect.
  // Cap the TTL so the cache never outlives the URL's own expiry — otherwise an
  // expired URL could keep serving 410-but-cached data, and conversely a stale
  // entry could survive past expiry. We use min(default TTL, seconds-until-expiry).
  let ttl = URL_CACHE_TTL;
  if (url.expiresAt) {
    const secondsUntilExpiry = Math.floor((new Date(url.expiresAt).getTime() - Date.now()) / 1000);
    ttl = Math.min(ttl, Math.max(secondsUntilExpiry, 1));
  }
  try {
    await redisClient.set(shortCode, JSON.stringify(url), "EX", ttl);
  } catch (err) {
    logger.error("Redis SET failed; serving uncached", { shortCode, error: err.message });
  }

  return url;
};

/**
 * Stable hash of QR style params for cache-key isolation so styled QR codes
 * don't collide with unstyled ones.
 */
const qrStyleHash = (opts) => {
  const h = crypto.createHash("md5");
  h.update(`${opts.format}|${opts.size}|${opts.color}|${opts.bg}|${opts.margin}|${opts.logo}`);
  return h.digest("hex").slice(0, 8);
};

/**
 * Parse and validate QR customization query params.
 *
 * @param {object} query - req.query
 * @returns {{ format, size, color, bg, margin, logo }}
 */
const parseQrOptions = (query) => {
  const opts = {};

  opts.format = query.format || "json";
  if (!["json", "png", "svg"].includes(opts.format)) {
    throw new ApiError(400, "format must be one of: json, png, svg");
  }

  const parsedSize = parseInt(query.size, 10);
  opts.size = Number.isNaN(parsedSize) ? 300 : Math.min(1000, Math.max(100, parsedSize));

  if (query.color && !/^#([0-9a-fA-F]{6})$/.test(query.color)) {
    throw new ApiError(400, "color must be a hex string like #000000");
  }
  opts.color = query.color || "#000000";

  if (query.bg && !/^#([0-9a-fA-F]{6})$/.test(query.bg)) {
    throw new ApiError(400, "bg must be a hex string like #ffffff");
  }
  opts.bg = query.bg || "#ffffff";

  const parsedMargin = parseInt(query.margin, 10);
  opts.margin = Number.isNaN(parsedMargin) ? 2 : Math.min(10, Math.max(0, parsedMargin));

  opts.logo = query.logo === "true";

  if (opts.logo && opts.format === "svg") {
    throw new ApiError(400, "logo only supported with png");
  }

  return opts;
};

/**
 * Generate (and cache) a QR code for a URL the user owns.
 * The QR encodes the public short URL, not the original destination, so analytics
 * and expiration still apply when the code is scanned.
 *
 * Accepts optional style query params: format, size, color, bg, margin, logo.
 *
 * @returns {{ dataUrl?: string, shortUrl: string, shortCode: string, buffer?: Buffer, contentType?: string }}
 */
const getQrCode = async (urlId, userId, query = {}) => {
  const url = await findOwnedUrlOr404(urlId, userId, { id: true, shortCode: true });

  const opts = parseQrOptions(query);
  const shortUrl = `${config.baseUrl}/${url.shortCode}`;

  // Cache key includes a hash of all style params so styled codes are isolated.
  const cacheKey = `${QR_PREFIX}${url.shortCode}:${qrStyleHash(opts)}`;

  // QR images are deterministic for a given (short URL + style), so caching is safe.
  const cached = await redisClient.get(cacheKey);
  if (cached && opts.format !== "svg") {
    // Only cache-return json and png; svg is generated fresh (small size, rare).
    if (opts.format === "json") {
      return { dataUrl: cached, shortUrl, shortCode: url.shortCode };
    }
    if (opts.format === "png") {
      return { buffer: Buffer.from(cached, "base64"), shortUrl, shortCode: url.shortCode, contentType: "image/png" };
    }
  }

  const qrConfig = {
    errorCorrectionLevel: opts.logo ? "H" : "M",
    margin: opts.margin,
    width: opts.size,
    color: { dark: opts.color, light: opts.bg },
  };

  let result;
  if (opts.format === "svg") {
    const svg = await QRCode.toString(shortUrl, { ...qrConfig, type: "svg" });
    result = { buffer: Buffer.from(svg), shortUrl, shortCode: url.shortCode, contentType: "image/svg+xml" };
    // SVGs are small — still cacheable.
    await redisClient.set(cacheKey, svg, "EX", QR_CACHE_TTL).catch(() => {});
    return result;
  }

  if (opts.format === "png") {
    let pngBuffer = await QRCode.toBuffer(shortUrl, qrConfig);

    // Optionally composite user avatar over the center of the QR.
    if (opts.logo) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatar: true },
      });

      if (user?.avatar) {
        const logoSize = Math.round(opts.size * 0.2);
        try {
          const logoBuffer = await sharp(Buffer.from(user.avatar.split(",")[1], "base64"))
            .resize(logoSize, logoSize)
            .toBuffer();
          const composite = await sharp(pngBuffer)
            .composite([{
              input: logoBuffer,
              gravity: "center",
            }])
            .png()
            .toBuffer();
          pngBuffer = composite;
        } catch {
          // Ignore logo composite errors — serve plain QR.
        }
      }
    }

    await redisClient.set(cacheKey, pngBuffer.toString("base64"), "EX", QR_CACHE_TTL).catch(() => {});
    return { buffer: pngBuffer, shortUrl, shortCode: url.shortCode, contentType: "image/png" };
  }

  // Default: json / data URL
  const dataUrl = await QRCode.toDataURL(shortUrl, qrConfig);
  await redisClient.set(cacheKey, dataUrl, "EX", QR_CACHE_TTL).catch(() => {});
  return { dataUrl, shortUrl, shortCode: url.shortCode };
};

/**
 * Update (or clear) the expiration of a URL the user owns.
 * Invalidates the redirect cache so the new expiry takes effect immediately.
 *
 * @param {Date|null} expiresAt absolute expiry, or null to clear it.
 */
const updateExpiration = async (urlId, userId, expiresAt) => {
  const url = await findOwnedUrlOr404(urlId, userId, { id: true, shortCode: true });

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
  const url = await findOwnedUrlOr404(urlId, userId, { id: true, shortCode: true });

  await prisma.url.delete({ where: { id: url.id } });

  // Drop any cached entries for this short code so it stops resolving.
  await redisClient.del(url.shortCode);
  await redisClient.del(`${QR_PREFIX}${url.shortCode}`);

  return { id: url.id, shortCode: url.shortCode };
};

const recordClick = async (urlId, { ipAddress, userAgent, referrer } = {}) => {
  // Enrich click data with browser, OS, device, country from the raw data.
  const ua = userAgent ? new UAParser(userAgent) : null;
  const browser = ua ? ua.getBrowser().name || null : null;
  const os = ua ? ua.getOS().name || null : null;
  let device = ua ? ua.getDevice().type || "desktop" : null;
  // ua-parser-js may return "bot" from the device type when the UA matches a crawler list
  if (ua && ua.getUA().toLowerCase().includes("bot")) device = "bot";
  const country = ipAddress ? (geoip.lookup(ipAddress)?.country ?? null) : null;

  const [updatedUrl] = await prisma.$transaction([
    prisma.url.update({
      where: { id: urlId },
      data: { clicks: { increment: 1 } },
    }),
    prisma.click.create({
      data: {
        urlId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        referrer: referrer || null,
        browser,
        os,
        device,
        country,
      },
    }),
  ]);

  return updatedUrl;
};

const getUrlAnalytics = async (urlId, userId) => {
  const url = await prisma.url.findFirst({
    where: {
      id: parseInt(urlId, 10),
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

  const groupByField = async (field) => {
    const rows = await prisma.click.groupBy({
      by: [field],
      where: { urlId: url.id },
      _count: { _all: true },
    });
    return rows
      .map((r) => ({ value: r[field] || "unknown", count: r._count._all }))
      .sort((a, b) => b.count - a.count);
  };

  // Run all aggregations concurrently to keep latency low.
  const [lastClick, uniqueRows, dailyClicks, weeklyClicks, byBrowser, byOs, byDevice, byCountry, byReferrer] = await Promise.all([
    prisma.click.findFirst({
      where: { urlId: url.id },
      orderBy: { clickedAt: "desc" },
    }),
    // Unique visitors ≈ distinct IP addresses. COUNT(DISTINCT ...) does the work
    // in the DB and returns a single number, instead of shipping one row per IP.
    prisma.$queryRaw`SELECT COUNT(DISTINCT "ipAddress")::int AS count FROM "Click" WHERE "urlId" = ${url.id}`,
    prisma.click.count({
      where: { urlId: url.id, clickedAt: { gte: oneDayAgo } },
    }),
    prisma.click.count({
      where: { urlId: url.id, clickedAt: { gte: sevenDaysAgo } },
    }),
    groupByField("browser"),
    groupByField("os"),
    groupByField("device"),
    groupByField("country"),
    groupByField("referrer"),
  ]);

  return {
    totalClicks: url.clicks,
    uniqueVisitors: uniqueRows[0]?.count ?? 0,
    lastAccessed: lastClick ? lastClick.clickedAt : null,
    dailyClicks,
    weeklyClicks,
    createdAt: url.createdAt,
    clickHistory: url.clickHistory,
    byBrowser,
    byOs,
    byDevice,
    byCountry,
    byReferrer,
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

/**
 * Change the destination URL behind an existing shortCode. Owner-only.
 * shortCode is immutable (QR codes and shared links keep working).
 * Click history and analytics are preserved.
 * Invalidates the redirect cache so the new URL takes effect immediately.
 */
const updateOriginalUrl = async (urlId, userId, originalUrl) => {
  const url = await findOwnedUrlOr404(urlId, userId, { id: true, shortCode: true });

  const updated = await prisma.url.update({
    where: { id: url.id },
    data: { originalUrl },
  });

  // Invalidate the cached redirect entry so the new URL is served at once.
  await redisClient.del(url.shortCode);

  return updated;
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
  updateOriginalUrl,
  deleteUrl,
};
