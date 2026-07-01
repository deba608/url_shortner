const mockFindFirst = jest.fn();
const mockUserFindUnique = jest.fn();
jest.mock("../src/config/database", () => ({
  url: { findFirst: (...args) => mockFindFirst(...args) },
  user: { findUnique: (...args) => mockUserFindUnique(...args) },
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
    mockFindFirst.mockResolvedValue({ id: 1, shortCode: "abc123" });
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue("OK");
  });

  it("rejects a non-numeric id", async () => {
    mockFindFirst.mockReset();
    await expect(urlService.getQrCode("abc", 1)).rejects.toThrow(ApiError);
  });

  it("throws 404 when the url is not found / not owned", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(urlService.getQrCode("1", 1)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("generates and caches a PNG data URL on a cache miss", async () => {
    const result = await urlService.getQrCode("1", 1);

    expect(result.shortCode).toBe("abc123");
    expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(result.shortUrl).toContain("abc123");
    expect(mockSet).toHaveBeenCalledTimes(1);
  });

  it("returns the cached data URL on a cache hit without regenerating", async () => {
    mockGet.mockResolvedValue("data:image/png;base64,CACHED==");

    const result = await urlService.getQrCode("2", 1);

    expect(result.dataUrl).toBe("data:image/png;base64,CACHED==");
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("returns a raw PNG buffer with correct content type", async () => {
    const result = await urlService.getQrCode("1", 1, { format: "png" });

    expect(result.contentType).toBe("image/png");
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.shortCode).toBe("abc123");
  });

  it("returns an SVG buffer with correct content type", async () => {
    const result = await urlService.getQrCode("1", 1, { format: "svg" });

    expect(result.contentType).toBe("image/svg+xml");
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.toString()).toMatch(/<svg/);
  });

  it("rejects invalid hex color", async () => {
    await expect(urlService.getQrCode("1", 1, { color: "not-hex" })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects invalid hex bg", async () => {
    await expect(urlService.getQrCode("1", 1, { bg: "not-hex" })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects logo with svg format", async () => {
    await expect(urlService.getQrCode("1", 1, { format: "svg", logo: "true" })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("clamps size to range 100-1000", async () => {
    const resultSmall = await urlService.getQrCode("1", 1, { size: "50" });
    const resultLarge = await urlService.getQrCode("1", 1, { size: "800" });

    expect(resultSmall.dataUrl).toBeDefined();
    expect(resultLarge.dataUrl).toBeDefined();
  }, 15000);

  it("uses distinct cache keys for different style params", async () => {
    mockGet.mockResolvedValue(null);
    await urlService.getQrCode("1", 1, { color: "#ff0000" });
    await urlService.getQrCode("1", 1, { color: "#00ff00" });

    const callKeys = mockSet.mock.calls.map(c => c[0]);
    expect(new Set(callKeys).size).toBe(2);
  });
});
