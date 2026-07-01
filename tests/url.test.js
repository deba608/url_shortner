// URL service unit tests (create / lookup+cache / expiration update). Prisma and
// Redis are mocked so this runs without external services.

const mockUrlFindUnique = jest.fn();
const mockUrlFindFirst = jest.fn();
const mockUrlFindMany = jest.fn();
const mockUrlCreate = jest.fn();
const mockUrlUpdate = jest.fn();
const mockUrlDelete = jest.fn();

jest.mock("../src/config/database", () => ({
  url: {
    findUnique: (...a) => mockUrlFindUnique(...a),
    findFirst: (...a) => mockUrlFindFirst(...a),
    findMany: (...a) => mockUrlFindMany(...a),
    create: (...a) => mockUrlCreate(...a),
    update: (...a) => mockUrlUpdate(...a),
    delete: (...a) => mockUrlDelete(...a),
  },
}));

const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisDel = jest.fn();
jest.mock("../src/config/redis", () => ({
  get: (...a) => mockRedisGet(...a),
  set: (...a) => mockRedisSet(...a),
  del: (...a) => mockRedisDel(...a),
}));

const urlService = require("../src/services/urlService");

describe("createShortUrl", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a url with a generated short code", async () => {
    mockUrlCreate.mockResolvedValue({ shortCode: "abc123", originalUrl: "https://x.com" });
    const result = await urlService.createShortUrl("https://x.com", undefined, null);
    expect(result.shortCode).toBe("abc123");
    expect(mockUrlCreate).toHaveBeenCalled();
  });

  it("persists expiresAt when provided", async () => {
    const expiresAt = new Date(Date.now() + 86400000);
    mockUrlCreate.mockResolvedValue({ shortCode: "exp123", expiresAt });
    await urlService.createShortUrl("https://x.com", undefined, 1, expiresAt);
    expect(mockUrlCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ expiresAt }) })
    );
  });

  it("rejects a taken custom alias with suggestions", async () => {
    mockUrlFindUnique.mockResolvedValue({ shortCode: "taken" });
    mockUrlFindMany.mockResolvedValue([]); // no suggestion collisions
    await expect(urlService.createShortUrl("https://x.com", "taken", 1)).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});

describe("getUrlByShortCode (cache behaviour)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the cached value on a cache hit without hitting the DB", async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify({ shortCode: "abc", originalUrl: "https://x.com" }));
    const result = await urlService.getUrlByShortCode("abc");
    expect(result.originalUrl).toBe("https://x.com");
    expect(mockUrlFindUnique).not.toHaveBeenCalled();
  });

  it("loads from DB and caches on a miss", async () => {
    mockRedisGet.mockResolvedValue(null);
    mockUrlFindUnique.mockResolvedValue({ shortCode: "abc", originalUrl: "https://x.com", expiresAt: null });
    const result = await urlService.getUrlByShortCode("abc");
    expect(result.originalUrl).toBe("https://x.com");
    expect(mockRedisSet).toHaveBeenCalled();
  });

  it("throws 404 when the short code does not exist", async () => {
    mockRedisGet.mockResolvedValue(null);
    mockUrlFindUnique.mockResolvedValue(null);
    await expect(urlService.getUrlByShortCode("missing")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("falls back to the DB when Redis GET throws (Redis down)", async () => {
    mockRedisGet.mockRejectedValue(new Error("ECONNREFUSED"));
    mockUrlFindUnique.mockResolvedValue({ shortCode: "abc", originalUrl: "https://x.com", expiresAt: null });
    const result = await urlService.getUrlByShortCode("abc");
    expect(result.originalUrl).toBe("https://x.com");
    expect(mockUrlFindUnique).toHaveBeenCalled();
  });

  it("still returns the URL when Redis SET throws on a miss", async () => {
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockRejectedValue(new Error("ECONNREFUSED"));
    mockUrlFindUnique.mockResolvedValue({ shortCode: "abc", originalUrl: "https://x.com", expiresAt: null });
    const result = await urlService.getUrlByShortCode("abc");
    expect(result.originalUrl).toBe("https://x.com");
  });
});

describe("updateExpiration", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates expiry and invalidates the cache", async () => {
    mockUrlFindFirst.mockResolvedValue({ id: 1, shortCode: "abc" });
    const expiresAt = new Date(Date.now() + 86400000);
    mockUrlUpdate.mockResolvedValue({ id: 1, shortCode: "abc", expiresAt });

    const result = await urlService.updateExpiration("1", 1, expiresAt);

    expect(result.expiresAt).toBe(expiresAt);
    expect(mockRedisDel).toHaveBeenCalledWith("abc");
  });

  it("throws 404 when the url is not owned", async () => {
    mockUrlFindFirst.mockResolvedValue(null);
    await expect(urlService.updateExpiration("1", 1, null)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("deleteUrl", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes an owned url and evicts its cache entries", async () => {
    mockUrlFindFirst.mockResolvedValue({ id: 1, shortCode: "abc" });
    mockUrlDelete.mockResolvedValue({ id: 1 });

    const result = await urlService.deleteUrl("1", 1);

    expect(result).toEqual({ id: 1, shortCode: "abc" });
    expect(mockUrlDelete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockRedisDel).toHaveBeenCalledWith("abc"); // redirect cache
    expect(mockRedisDel).toHaveBeenCalledWith("qr:abc"); // qr cache
  });

  it("throws 404 when the url is not owned", async () => {
    mockUrlFindFirst.mockResolvedValue(null);
    await expect(urlService.deleteUrl("1", 1)).rejects.toMatchObject({ statusCode: 404 });
    expect(mockUrlDelete).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric id", async () => {
    await expect(urlService.deleteUrl("abc", 1)).rejects.toMatchObject({ statusCode: 400 });
  });
});
