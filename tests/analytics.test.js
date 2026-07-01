// Analytics aggregation unit tests. Prisma and Redis are mocked so the suite
// runs without a live database — we verify the shape and the aggregation wiring.

const mockUrlFindFirst = jest.fn();
const mockUrlFindMany = jest.fn();
const mockClickFindFirst = jest.fn();
const mockClickCount = jest.fn();
const mockClickGroupBy = jest.fn();
const mockQueryRaw = jest.fn();

jest.mock("../src/config/database", () => ({
  url: {
    findFirst: (...a) => mockUrlFindFirst(...a),
    findMany: (...a) => mockUrlFindMany(...a),
  },
  click: {
    findFirst: (...a) => mockClickFindFirst(...a),
    count: (...a) => mockClickCount(...a),
    groupBy: (...a) => mockClickGroupBy(...a),
  },
  $queryRaw: (...a) => mockQueryRaw(...a),
}));

jest.mock("../src/config/redis", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

const urlService = require("../src/services/urlService");

describe("getUrlAnalytics", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws 404 when the url is not found or not owned", async () => {
    mockUrlFindFirst.mockResolvedValue(null);
    await expect(urlService.getUrlAnalytics("1", 1)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("aggregates total, unique, daily, weekly, and grouped breakdowns", async () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    mockUrlFindFirst.mockResolvedValue({
      id: 1,
      clicks: 10,
      createdAt,
      clickHistory: [{ id: 1 }, { id: 2 }],
    });
    mockClickFindFirst.mockResolvedValue({ clickedAt: new Date("2026-06-16T00:00:00Z") });
    // COUNT(DISTINCT ipAddress) -> uniqueVisitors = 2
    mockQueryRaw.mockResolvedValue([{ count: 2 }]);
    // count is called twice: daily then weekly
    mockClickCount.mockResolvedValueOnce(3).mockResolvedValueOnce(7);
    // groupBy responses for browser, os, device, country, referrer
    mockClickGroupBy.mockResolvedValue([
      { browser: "Chrome", _count: { _all: 5 } },
      { browser: "Firefox", _count: { _all: 3 } },
    ]);

    const result = await urlService.getUrlAnalytics("1", 1);

    expect(result).toMatchObject({
      totalClicks: 10,
      uniqueVisitors: 2,
      dailyClicks: 3,
      weeklyClicks: 7,
      createdAt,
    });
    expect(result.lastAccessed).toEqual(new Date("2026-06-16T00:00:00Z"));
    expect(result.clickHistory).toHaveLength(2);
    // Grouped breakdowns present and sorted desc by count
    expect(result.byBrowser).toBeDefined();
    expect(result.byOs).toBeDefined();
    expect(result.byDevice).toBeDefined();
    expect(result.byCountry).toBeDefined();
    expect(result.byReferrer).toBeDefined();
    expect(mockClickCount).toHaveBeenCalledTimes(2);
    // groupBy called 5 times (browser, os, device, country, referrer)
    expect(mockClickGroupBy).toHaveBeenCalledTimes(5);
  });

  it("reports null lastAccessed when there are no clicks", async () => {
    mockUrlFindFirst.mockResolvedValue({ id: 1, clicks: 0, createdAt: new Date(), clickHistory: [] });
    mockClickFindFirst.mockResolvedValue(null);
    mockQueryRaw.mockResolvedValue([{ count: 0 }]);
    mockClickCount.mockResolvedValue(0);
    mockClickGroupBy.mockResolvedValue([]);

    const result = await urlService.getUrlAnalytics("1", 1);
    expect(result.lastAccessed).toBeNull();
    expect(result.uniqueVisitors).toBe(0);
  });
});

describe("getTopUrls", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns urls ordered by clicks, limited to 10", async () => {
    mockUrlFindMany.mockResolvedValue([{ id: 1, clicks: 99 }]);
    const result = await urlService.getTopUrls(1);

    expect(result).toEqual([{ id: 1, clicks: 99 }]);
    expect(mockUrlFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 1 },
        orderBy: { clicks: "desc" },
        take: 10,
      })
    );
  });
});
