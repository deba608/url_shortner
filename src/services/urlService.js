const { nanoid } = require("nanoid");
const prisma = require("../config/database");
const redisClient = require("../config/redis");
const ApiError = require("../utils/ApiError");
const { SHORT_CODE_LENGTH, SUGGESTION_COUNT } = require("../utils/constants");

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

const createShortUrl = async (originalUrl, customAlias, userId) => {
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

  // 4. Store the result in Redis with a TTL of 1 hour (3600 seconds)
  // Note: We use the ioredis string argument format ("EX", 3600)
  await redisClient.set(shortCode, JSON.stringify(url), "EX", 3600);

  return url;
};

const incrementClicks = async (shortCode) => {
  const url = await prisma.url.update({
    where: { shortCode },
    data: {
      clicks: { increment: 1 },
    },
  });

  return url;
};

module.exports = {
  createShortUrl,
  getUrlByShortCode,
  incrementClicks,
  getUserUrls,
};
