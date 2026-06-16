const { resolveExpiration, isExpired } = require("../src/validators/expirationValidator");
const ApiError = require("../src/utils/ApiError");

describe("resolveExpiration", () => {
  it("returns undefined when nothing is provided", () => {
    expect(resolveExpiration({})).toBeUndefined();
  });

  it("returns null when explicitly cleared", () => {
    expect(resolveExpiration({ expiresIn: null })).toBeNull();
    expect(resolveExpiration({ expiresAt: null })).toBeNull();
  });

  it("resolves a preset to a future date", () => {
    const before = Date.now();
    const result = resolveExpiration({ expiresIn: "7d" });
    const expected = before + 7 * 24 * 60 * 60 * 1000;
    expect(result).toBeInstanceOf(Date);
    expect(Math.abs(result.getTime() - expected)).toBeLessThan(2000);
  });

  it("resolves a numeric day count", () => {
    const result = resolveExpiration({ expiresIn: 30 });
    const expected = Date.now() + 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs(result.getTime() - expected)).toBeLessThan(2000);
  });

  it("resolves a numeric string day count", () => {
    const result = resolveExpiration({ expiresIn: "5" });
    expect(result).toBeInstanceOf(Date);
  });

  it("accepts a valid future ISO date for expiresAt", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const result = resolveExpiration({ expiresAt: future });
    expect(result.toISOString()).toBe(future);
  });

  it("rejects providing both expiresIn and expiresAt", () => {
    expect(() => resolveExpiration({ expiresIn: "7d", expiresAt: new Date().toISOString() }))
      .toThrow(ApiError);
  });

  it("rejects a non-positive number of days", () => {
    expect(() => resolveExpiration({ expiresIn: 0 })).toThrow(ApiError);
    expect(() => resolveExpiration({ expiresIn: -3 })).toThrow(ApiError);
  });

  it("rejects an unknown preset", () => {
    expect(() => resolveExpiration({ expiresIn: "1y" })).toThrow(ApiError);
  });

  it("rejects an exceedingly large day count", () => {
    expect(() => resolveExpiration({ expiresIn: 999999 })).toThrow(ApiError);
  });

  it("rejects an invalid date string", () => {
    expect(() => resolveExpiration({ expiresAt: "not-a-date" })).toThrow(ApiError);
  });

  it("rejects a past date", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(() => resolveExpiration({ expiresAt: past })).toThrow(ApiError);
  });
});

describe("isExpired", () => {
  it("is false when there is no expiry", () => {
    expect(isExpired({ expiresAt: null })).toBe(false);
    expect(isExpired({})).toBe(false);
  });

  it("is false for a future expiry", () => {
    expect(isExpired({ expiresAt: new Date(Date.now() + 60_000) })).toBe(false);
  });

  it("is true for a past expiry", () => {
    expect(isExpired({ expiresAt: new Date(Date.now() - 60_000) })).toBe(true);
  });
});
