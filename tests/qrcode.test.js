// Unit test for QR generation that mocks Prisma and Redis so it runs without
// a live database or cache server.

const mockFindFirst = jest.fn();
jest.mock("../src/config/database", () => ({
  url: { findFirst: (...args) => mockFindFirst(...args) },
}));

const mockGet = jest.fn();
const mockSet = jest.fn();
jest.mock("../src/config/redis", () => ({
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
  del: jest.fn(),
}));

const urlService = require("../src/services/urlService");
const ApiError = require("../src/utils/ApiError");

describe("getQrCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects a non-numeric id", async () => {
    await expect(urlService.getQrCode("abc", 1)).rejects.toThrow(ApiError);
  });

  it("throws 404 when the url is not found / not owned", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(urlService.getQrCode("1", 1)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("generates and caches a PNG data URL on a cache miss", async () => {
    mockFindFirst.mockResolvedValue({ id: 1, shortCode: "abc123" });
    mockGet.mockResolvedValue(null);

    const result = await urlService.getQrCode("1", 1);

    expect(result.shortCode).toBe("abc123");
    expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(result.shortUrl).toContain("abc123");
    // Should have written the generated QR to cache.
    expect(mockSet).toHaveBeenCalledTimes(1);
  });

  it("returns the cached data URL on a cache hit without regenerating", async () => {
    mockFindFirst.mockResolvedValue({ id: 2, shortCode: "cached1" });
    mockGet.mockResolvedValue("data:image/png;base64,CACHED==");

    const result = await urlService.getQrCode("2", 1);

    expect(result.dataUrl).toBe("data:image/png;base64,CACHED==");
    expect(mockSet).not.toHaveBeenCalled();
  });
});
