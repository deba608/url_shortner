# Analytics Upgrade, QR Customization, Link Editing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add click enrichment (browser/OS/device/country/referrer) with grouped analytics, QR style customization via query params, and owner-only editing of a link's destination.

**Architecture:** Express + Prisma (Postgres) + Redis. Enrichment parsed at click time and stored denormalized on `Click`; analytics reads use `groupBy`. QR endpoint extended with validated query params (stateless). Link edit is a new authed PATCH that busts the redirect cache.

**Tech Stack:** Node/Express, Prisma 7, Redis, Jest (mocked Prisma/Redis — no live DB), `qrcode`, new deps `ua-parser-js`, `geoip-lite`, `sharp`.

## Global Constraints

- Service layer throws `ApiError(status, message)`; controllers wrap handlers in `catchAsync`. Response shape: `{ status: "success", data: {...} }`.
- Tests mock `../src/config/database` and `../src/config/redis` — never hit a live DB/Redis. Follow the mock pattern in `tests/analytics.test.js`.
- Run all tests with `npm test`. Run one file: `npx jest tests/<file> -v`.
- Ownership resolution goes through the existing `findOwnedUrlOr404(urlId, userId, select)` in `src/services/urlService.js`.
- `config.baseUrl` builds public short URLs: `${config.baseUrl}/${shortCode}`.
- Redirect path stays non-blocking: `recordClick` is called with `.catch()` and must never throw into the redirect.

---

### Task 1: Click enrichment schema

**Files:**
- Modify: `prisma/schema.prisma` (the `Click` model)
- Create: migration via `npx prisma migrate dev --name click_enrichment`

**Interfaces:**
- Produces: `Click.browser`, `Click.os`, `Click.device`, `Click.country`, `Click.referrer` — all `String?`.

- [ ] **Step 1: Add columns to the `Click` model**

In `prisma/schema.prisma`, inside `model Click`, after `userAgent String?`:

```prisma
  browser   String?
  os        String?
  device    String?   // "desktop" | "mobile" | "tablet" | "bot"
  country   String?   // ISO country code, e.g. "US"
  referrer  String?
```

- [ ] **Step 2: Generate the migration**

Run: `npx prisma migrate dev --name click_enrichment`
Expected: new migration folder under `prisma/migrations/`, client regenerated, no errors.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add enrichment columns to Click"
```

---

### Task 2: Click enrichment parser utility

**Files:**
- Create: `src/utils/enrichClick.js`
- Test: `tests/enrichClick.test.js`

**Interfaces:**
- Produces: `enrichClick({ userAgent, ipAddress }) -> { browser, os, device, country }`. Pure function, no I/O beyond in-memory lib calls. Returns `null` for any field it can't resolve.

- [ ] **Step 1: Install deps**

Run: `npm install ua-parser-js geoip-lite`
Expected: both added to `package.json` dependencies.

- [ ] **Step 2: Write the failing test**

`tests/enrichClick.test.js`:

```js
const enrichClick = require("../src/utils/enrichClick");

describe("enrichClick", () => {
  it("parses a desktop Chrome UA", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
    const r = enrichClick({ userAgent: ua, ipAddress: null });
    expect(r.browser).toBe("Chrome");
    expect(r.os).toBe("Windows");
    expect(r.device).toBe("desktop");
  });

  it("classifies a mobile UA as mobile", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
    const r = enrichClick({ userAgent: ua, ipAddress: null });
    expect(r.device).toBe("mobile");
  });

  it("flags a bot UA as device 'bot'", () => {
    const r = enrichClick({ userAgent: "Googlebot/2.1 (+http://www.google.com/bot.html)", ipAddress: null });
    expect(r.device).toBe("bot");
  });

  it("returns null fields for missing userAgent", () => {
    const r = enrichClick({ userAgent: null, ipAddress: null });
    expect(r).toEqual({ browser: null, os: null, device: null, country: null });
  });

  it("resolves country from a known public IP", () => {
    // 8.8.8.8 is Google DNS, geoip-lite resolves it to US.
    const r = enrichClick({ userAgent: null, ipAddress: "8.8.8.8" });
    expect(r.country).toBe("US");
  });

  it("returns null country for a private IP", () => {
    const r = enrichClick({ userAgent: null, ipAddress: "192.168.1.1" });
    expect(r.country).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest tests/enrichClick.test.js -v`
Expected: FAIL — `Cannot find module '../src/utils/enrichClick'`.

- [ ] **Step 4: Write the implementation**

`src/utils/enrichClick.js`:

```js
const { UAParser } = require("ua-parser-js");
const geoip = require("geoip-lite");

// Parse a raw user-agent + IP into denormalized analytics fields. Pure and
// defensive: any field that cannot be resolved comes back null. Never throws —
// it runs on the non-blocking click path.
const enrichClick = ({ userAgent, ipAddress }) => {
  let browser = null;
  let os = null;
  let device = null;

  if (userAgent) {
    try {
      const parsed = new UAParser(userAgent).getResult();
      browser = parsed.browser.name || null;
      os = parsed.os.name || null;
      // ua-parser-js reports device.type only for non-desktop (mobile/tablet).
      // Treat a bot-ish UA as "bot", an explicit type as-is, else "desktop".
      if (/bot|crawl|spider|slurp/i.test(userAgent)) {
        device = "bot";
      } else {
        device = parsed.device.type || "desktop";
      }
    } catch {
      // leave fields null on parse failure
    }
  }

  let country = null;
  if (ipAddress) {
    try {
      const geo = geoip.lookup(ipAddress);
      country = geo ? geo.country : null;
    } catch {
      country = null;
    }
  }

  return { browser, os, device, country };
};

module.exports = enrichClick;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest tests/enrichClick.test.js -v`
Expected: PASS (all 6).

- [ ] **Step 6: Commit**

```bash
git add src/utils/enrichClick.js tests/enrichClick.test.js package.json package-lock.json
git commit -m "feat: add click enrichment parser (ua + geoip)"
```

---

### Task 3: Wire enrichment into recordClick

**Files:**
- Modify: `src/services/urlService.js` (`recordClick`)
- Modify: `src/controllers/urlController.js` (`redirectToUrl`)
- Test: `tests/recordClick.test.js`

**Interfaces:**
- Consumes: `enrichClick` from Task 2.
- Produces: new signature `recordClick(urlId, { ipAddress, userAgent, referrer })`. Stores enriched fields + `referrer` on the `Click.create`.

- [ ] **Step 1: Write the failing test**

`tests/recordClick.test.js`:

```js
const mockUrlUpdate = jest.fn();
const mockClickCreate = jest.fn();
const mockTransaction = jest.fn((ops) => Promise.all(ops));

jest.mock("../src/config/database", () => ({
  url: { update: (...a) => mockUrlUpdate(...a) },
  click: { create: (...a) => mockClickCreate(...a) },
  $transaction: (...a) => mockTransaction(...a),
}));
jest.mock("../src/config/redis", () => ({ get: jest.fn(), set: jest.fn(), del: jest.fn() }));

const urlService = require("../src/services/urlService");

describe("recordClick enrichment", () => {
  beforeEach(() => jest.clearAllMocks());

  it("stores browser/os/device/country/referrer on the click", async () => {
    mockUrlUpdate.mockReturnValue({ id: 1 });
    mockClickCreate.mockReturnValue({ id: 1 });

    await urlService.recordClick(1, {
      ipAddress: "8.8.8.8",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      referrer: "https://google.com",
    });

    const arg = mockClickCreate.mock.calls[0][0].data;
    expect(arg).toMatchObject({
      urlId: 1,
      ipAddress: "8.8.8.8",
      browser: "Chrome",
      os: "Windows",
      device: "desktop",
      country: "US",
      referrer: "https://google.com",
    });
  });

  it("passes null referrer through", async () => {
    mockUrlUpdate.mockReturnValue({ id: 2 });
    mockClickCreate.mockReturnValue({ id: 2 });
    await urlService.recordClick(2, { ipAddress: null, userAgent: null, referrer: null });
    const arg = mockClickCreate.mock.calls[0][0].data;
    expect(arg.referrer).toBeNull();
    expect(arg.browser).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/recordClick.test.js -v`
Expected: FAIL — old `recordClick` ignores the options object; `arg.browser` undefined.

- [ ] **Step 3: Update recordClick**

In `src/services/urlService.js`, add near the top imports:

```js
const enrichClick = require("../utils/enrichClick");
```

Replace the whole `recordClick` function with:

```js
const recordClick = async (urlId, { ipAddress, userAgent, referrer } = {}) => {
  const { browser, os, device, country } = enrichClick({ userAgent, ipAddress });

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
```

- [ ] **Step 4: Update the caller**

In `src/controllers/urlController.js`, inside `redirectToUrl`, replace the click-recording block with:

```js
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("user-agent");
  const referrer = req.get("referer") || null;

  urlService.recordClick(url.id, { ipAddress, userAgent, referrer }).catch((err) => {
    logger.error("Failed to record click", { shortCode, error: err.message });
  });
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest tests/recordClick.test.js -v`
Expected: PASS (both).

- [ ] **Step 6: Commit**

```bash
git add src/services/urlService.js src/controllers/urlController.js tests/recordClick.test.js
git commit -m "feat: enrich recorded clicks with ua/geo/referrer"
```

---

### Task 4: Grouped breakdowns in analytics

**Files:**
- Modify: `src/services/urlService.js` (`getUrlAnalytics`)
- Test: `tests/analytics.test.js` (extend existing)

**Interfaces:**
- Produces: `getUrlAnalytics` return gains `byBrowser`, `byOs`, `byDevice`, `byCountry`, `byReferrer` — each `[{ value, count }]` sorted desc, null values mapped to `"unknown"`.

- [ ] **Step 1: Add a groupBy mock and failing test**

In `tests/analytics.test.js`, add `groupBy` to the mocked `click` object:

```js
  click: {
    findFirst: (...a) => mockClickFindFirst(...a),
    count: (...a) => mockClickCount(...a),
    groupBy: (...a) => mockGroupBy(...a),
  },
```

Declare the mock with the others: `const mockGroupBy = jest.fn();`

Add a test inside `describe("getUrlAnalytics", ...)`:

```js
  it("returns grouped breakdowns", async () => {
    mockUrlFindFirst.mockResolvedValue({ id: 1, clicks: 5, createdAt: new Date(), clickHistory: [] });
    mockClickFindFirst.mockResolvedValue(null);
    mockQueryRaw.mockResolvedValue([{ count: 0 }]);
    mockClickCount.mockResolvedValue(0);
    // one resolved array per groupBy call; service maps _count._all -> count
    mockGroupBy
      .mockResolvedValueOnce([{ browser: "Chrome", _count: { _all: 3 } }, { browser: null, _count: { _all: 1 } }]) // byBrowser
      .mockResolvedValueOnce([{ os: "Windows", _count: { _all: 4 } }]) // byOs
      .mockResolvedValueOnce([{ device: "desktop", _count: { _all: 4 } }]) // byDevice
      .mockResolvedValueOnce([{ country: "US", _count: { _all: 4 } }]) // byCountry
      .mockResolvedValueOnce([{ referrer: "google.com", _count: { _all: 2 } }]); // byReferrer

    const result = await urlService.getUrlAnalytics("1", 1);

    expect(result.byBrowser).toEqual([
      { value: "Chrome", count: 3 },
      { value: "unknown", count: 1 },
    ]);
    expect(result.byOs).toEqual([{ value: "Windows", count: 4 }]);
    expect(result.byDevice).toEqual([{ value: "desktop", count: 4 }]);
    expect(result.byCountry).toEqual([{ value: "US", count: 4 }]);
    expect(result.byReferrer).toEqual([{ value: "google.com", count: 2 }]);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/analytics.test.js -v`
Expected: FAIL — `result.byBrowser` undefined.

- [ ] **Step 3: Implement grouped breakdowns**

In `src/services/urlService.js`, add this helper above `getUrlAnalytics`:

```js
// Turn a Prisma groupBy result into [{ value, count }] sorted desc. `field` is
// the grouped column name; null values surface as "unknown".
const mapGroup = (rows, field) =>
  rows
    .map((r) => ({ value: r[field] ?? "unknown", count: r._count._all }))
    .sort((a, b) => b.count - a.count);
```

Inside `getUrlAnalytics`, add these to the existing `Promise.all` array (after `weeklyClicks`):

```js
    prisma.click.groupBy({ by: ["browser"], where: { urlId: url.id }, _count: { _all: true } }),
    prisma.click.groupBy({ by: ["os"], where: { urlId: url.id }, _count: { _all: true } }),
    prisma.click.groupBy({ by: ["device"], where: { urlId: url.id }, _count: { _all: true } }),
    prisma.click.groupBy({ by: ["country"], where: { urlId: url.id }, _count: { _all: true } }),
    prisma.click.groupBy({ by: ["referrer"], where: { urlId: url.id }, _count: { _all: true } }),
```

Update the destructuring to capture them:

```js
  const [lastClick, uniqueRows, dailyClicks, weeklyClicks, bBrowser, bOs, bDevice, bCountry, bReferrer] =
    await Promise.all([
      // ...existing five...
    ]);
```

Add to the returned object:

```js
    byBrowser: mapGroup(bBrowser, "browser"),
    byOs: mapGroup(bOs, "os"),
    byDevice: mapGroup(bDevice, "device"),
    byCountry: mapGroup(bCountry, "country"),
    byReferrer: mapGroup(bReferrer, "referrer"),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/analytics.test.js -v`
Expected: PASS (existing + new).

- [ ] **Step 5: Commit**

```bash
git add src/services/urlService.js tests/analytics.test.js
git commit -m "feat: add grouped analytics breakdowns"
```

---

### Task 5: QR style params — validation + non-logo rendering

**Files:**
- Create: `src/validators/qrValidator.js`
- Modify: `src/services/urlService.js` (`getQrCode`)
- Modify: `src/controllers/urlController.js` (`getQrCode`)
- Test: `tests/qrValidator.test.js`, extend `tests/qrcode.test.js`

**Interfaces:**
- Produces: `parseQrOptions(query) -> { format, size, color, bg, margin, logo }` (throws `ApiError(400)` on bad input). `getQrCode(urlId, userId, options) -> { shortUrl, shortCode, format, payload }` where `payload` is a data URL (json), svg string, or PNG Buffer.

- [ ] **Step 1: Write the failing validator test**

`tests/qrValidator.test.js`:

```js
const { parseQrOptions } = require("../src/validators/qrValidator");

describe("parseQrOptions", () => {
  it("applies defaults for an empty query", () => {
    expect(parseQrOptions({})).toEqual({
      format: "json", size: 300, color: "#000000", bg: "#ffffff", margin: 2, logo: false,
    });
  });

  it("accepts valid overrides", () => {
    const o = parseQrOptions({ format: "png", size: "500", color: "#ff0000", bg: "#00ff00", margin: "4", logo: "true" });
    expect(o).toEqual({ format: "png", size: 500, color: "#ff0000", bg: "#00ff00", margin: 4, logo: true });
  });

  it("clamps size to [100,1000] and margin to [0,10]", () => {
    expect(parseQrOptions({ size: "50" }).size).toBe(100);
    expect(parseQrOptions({ size: "5000" }).size).toBe(1000);
    expect(parseQrOptions({ margin: "99" }).margin).toBe(10);
  });

  it("rejects a bad hex color", () => {
    expect(() => parseQrOptions({ color: "red" })).toThrow(/hex/i);
  });

  it("rejects a non-numeric size", () => {
    expect(() => parseQrOptions({ size: "abc" })).toThrow(/size/i);
  });

  it("rejects logo with svg format", () => {
    expect(() => parseQrOptions({ format: "svg", logo: "true" })).toThrow(/logo/i);
  });

  it("rejects an unknown format", () => {
    expect(() => parseQrOptions({ format: "gif" })).toThrow(/format/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/qrValidator.test.js -v`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the validator**

`src/validators/qrValidator.js`:

```js
const ApiError = require("../utils/ApiError");

const HEX = /^#[0-9a-fA-F]{6}$/;
const FORMATS = ["json", "png", "svg"];

const clampInt = (raw, def, min, max, label) => {
  if (raw === undefined) return def;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) throw new ApiError(400, `Invalid ${label}: must be a number`);
  return Math.min(max, Math.max(min, n));
};

const parseQrOptions = (query = {}) => {
  const format = query.format === undefined ? "json" : String(query.format);
  if (!FORMATS.includes(format)) {
    throw new ApiError(400, `Invalid format: use one of ${FORMATS.join(", ")}`);
  }

  const color = query.color === undefined ? "#000000" : String(query.color);
  if (!HEX.test(color)) throw new ApiError(400, "Invalid color: must be a #RRGGBB hex value");

  const bg = query.bg === undefined ? "#ffffff" : String(query.bg);
  if (!HEX.test(bg)) throw new ApiError(400, "Invalid bg: must be a #RRGGBB hex value");

  const size = clampInt(query.size, 300, 100, 1000, "size");
  const margin = clampInt(query.margin, 2, 0, 10, "margin");
  const logo = query.logo === "true" || query.logo === true;

  if (logo && format === "svg") {
    throw new ApiError(400, "logo only supported with png format");
  }

  return { format, size, color, bg, margin, logo };
};

module.exports = { parseQrOptions };
```

- [ ] **Step 4: Run validator tests**

Run: `npx jest tests/qrValidator.test.js -v`
Expected: PASS (all 7).

- [ ] **Step 5: Rework getQrCode service (no logo yet)**

In `src/services/urlService.js`, add near the top: `const crypto = require("crypto");` (built-in). Replace `getQrCode` with:

```js
// Build a cache key that isolates each distinct style so a custom QR never
// collides with the default one.
const qrCacheKey = (shortCode, options) => {
  const hash = crypto
    .createHash("sha1")
    .update(JSON.stringify(options))
    .digest("hex")
    .slice(0, 12);
  return `${QR_PREFIX}${shortCode}:${hash}`;
};

const getQrCode = async (urlId, userId, options) => {
  const url = await findOwnedUrlOr404(urlId, userId, { id: true, shortCode: true });
  const shortUrl = `${config.baseUrl}/${url.shortCode}`;
  const { format, size, color, bg, margin } = options;

  const cacheKey = qrCacheKey(url.shortCode, options);
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    const payload = format === "png" ? Buffer.from(cached, "base64") : cached;
    return { shortUrl, shortCode: url.shortCode, format, payload };
  }

  const qrOpts = { margin, width: size, color: { dark: color, light: bg } };
  let payload;
  let toCache;
  if (format === "svg") {
    payload = await QRCode.toString(shortUrl, { type: "svg", ...qrOpts });
    toCache = payload;
  } else if (format === "png") {
    payload = await QRCode.toBuffer(shortUrl, { ...qrOpts });
    toCache = payload.toString("base64");
  } else {
    payload = await QRCode.toDataURL(shortUrl, { errorCorrectionLevel: "M", ...qrOpts });
    toCache = payload;
  }

  await redisClient.set(cacheKey, toCache, "EX", QR_CACHE_TTL);
  return { shortUrl, shortCode: url.shortCode, format, payload };
};
```

- [ ] **Step 6: Rework getQrCode controller**

In `src/controllers/urlController.js`, add `const { parseQrOptions } = require("../validators/qrValidator");` to imports. Replace `getQrCode` with:

```js
const getQrCode = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const options = parseQrOptions(req.query);

  const { payload, shortUrl, shortCode, format } = await urlService.getQrCode(id, userId, options);

  if (format === "png") {
    res.set("Content-Type", "image/png");
    return res.send(payload);
  }
  if (format === "svg") {
    res.set("Content-Type", "image/svg+xml");
    return res.send(payload);
  }
  res.json({ status: "success", data: { shortCode, shortUrl, qrCode: payload } });
});
```

- [ ] **Step 7: Extend the QR service test**

Add to `tests/qrcode.test.js` (match its existing mock setup) a test asserting a styled PNG request returns a Buffer payload and that a second identical call hits the cache. If the existing file lacks a `getQrCode` service test harness, add:

```js
  it("returns a png buffer for format=png and caches it", async () => {
    mockFindFirst.mockResolvedValue({ id: 1, shortCode: "abc123" });
    mockRedisGet.mockResolvedValue(null);
    const opts = { format: "png", size: 300, color: "#000000", bg: "#ffffff", margin: 2, logo: false };
    const r = await urlService.getQrCode("1", 1, opts);
    expect(Buffer.isBuffer(r.payload)).toBe(true);
    expect(r.format).toBe("png");
    expect(mockRedisSet).toHaveBeenCalled();
  });
```

(Use the mock variable names already defined at the top of `tests/qrcode.test.js`; add `groupBy`/`set` mocks only if missing.)

- [ ] **Step 8: Run QR tests**

Run: `npx jest tests/qrcode.test.js tests/qrValidator.test.js -v`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/validators/qrValidator.js src/services/urlService.js src/controllers/urlController.js tests/qrValidator.test.js tests/qrcode.test.js
git commit -m "feat: QR customization via query params (color/size/bg/format)"
```

---

### Task 6: QR logo embedding

**Files:**
- Modify: `src/services/urlService.js` (`getQrCode` — logo branch)
- Test: extend `tests/qrcode.test.js`

**Interfaces:**
- Consumes: `options.logo` (bool) from Task 5; `user.avatar`.
- Produces: when `logo && user.avatar`, composite avatar over the PNG center via `sharp`, `errorCorrectionLevel: "H"`. When `logo` but no avatar, render plain PNG (no error).

- [ ] **Step 1: Install sharp**

Run: `npm install sharp`
Expected: added to dependencies.

- [ ] **Step 2: Write the failing test**

Add to `tests/qrcode.test.js`:

```js
  it("still returns a png buffer when logo=true (composited)", async () => {
    mockFindFirst.mockResolvedValue({ id: 1, shortCode: "abc123", userId: "u1" });
    mockUserFindUnique.mockResolvedValue({ avatar: "https://example.com/a.png" });
    mockRedisGet.mockResolvedValue(null);
    const opts = { format: "png", size: 300, color: "#000000", bg: "#ffffff", margin: 2, logo: true };
    const r = await urlService.getQrCode("1", 1, opts);
    expect(Buffer.isBuffer(r.payload)).toBe(true);
  });
```

Mock avatar fetch: the service must fetch the avatar bytes. Stub the fetch layer used (see Step 3). Add a `mockUserFindUnique` to the mocked database `user` object if not present.

- [ ] **Step 3: Implement the logo branch**

In `getQrCode` (service), the ownership select must include `userId`; change it to `{ id: true, shortCode: true, userId: true }`. Before the PNG branch, when `options.logo` is true, fetch the avatar and composite:

```js
// inside getQrCode, replace the png branch body when logo requested:
if (format === "png") {
  const highEcc = options.logo ? { errorCorrectionLevel: "H" } : {};
  let buf = await QRCode.toBuffer(shortUrl, { ...qrOpts, ...highEcc });

  if (options.logo && url.userId) {
    const user = await prisma.user.findUnique({ where: { id: url.userId }, select: { avatar: true } });
    if (user && user.avatar) {
      const sharp = require("sharp");
      const resp = await fetch(user.avatar);
      if (resp.ok) {
        const avatarBuf = Buffer.from(await resp.arrayBuffer());
        const logoSize = Math.round(size * 0.22);
        const logo = await sharp(avatarBuf).resize(logoSize, logoSize, { fit: "cover" }).png().toBuffer();
        const offset = Math.round((size - logoSize) / 2);
        buf = await sharp(buf)
          .composite([{ input: logo, top: offset, left: offset }])
          .png()
          .toBuffer();
      }
    }
  }

  payload = buf;
  toCache = buf.toString("base64");
}
```

(Node 18+ has global `fetch`. Confirm with `node -v` >= 18; the project already targets modern Node.)

- [ ] **Step 4: Run QR tests**

Run: `npx jest tests/qrcode.test.js -v`
Expected: PASS. Mock `fetch` in the test (`global.fetch = jest.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })`) and `sharp` if a real composite is undesirable in unit tests — prefer mocking `sharp` to keep the test pure:

```js
jest.mock("sharp", () => {
  const chain = { resize: () => chain, png: () => chain, composite: () => chain, toBuffer: async () => Buffer.from("x") };
  return jest.fn(() => chain);
});
```

- [ ] **Step 5: Commit**

```bash
git add src/services/urlService.js tests/qrcode.test.js package.json package-lock.json
git commit -m "feat: embed user avatar as QR logo (png only)"
```

---

### Task 7: Link editing — validator + service

**Files:**
- Create: `src/middlewares/validateOriginalUrl.js`
- Modify: `src/services/urlService.js` (add `updateOriginalUrl`, export it)
- Test: `tests/linkEdit.test.js`

**Interfaces:**
- Consumes: `validateUrlFormat` from `src/validators/urlValidator.js`; `findOwnedUrlOr404`.
- Produces: middleware `validateOriginalUrl(req,res,next)` (normalizes + validates `req.body.originalUrl`); `updateOriginalUrl(urlId, userId, originalUrl) -> { id, shortCode, originalUrl }`, busts redirect cache.

- [ ] **Step 1: Write the failing service test**

`tests/linkEdit.test.js`:

```js
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockRedisDel = jest.fn();

jest.mock("../src/config/database", () => ({
  url: { findFirst: (...a) => mockFindFirst(...a), update: (...a) => mockUpdate(...a) },
}));
jest.mock("../src/config/redis", () => ({ get: jest.fn(), set: jest.fn(), del: (...a) => mockRedisDel(...a) }));

const urlService = require("../src/services/urlService");

describe("updateOriginalUrl", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates the target and busts the redirect cache", async () => {
    mockFindFirst.mockResolvedValue({ id: 1, shortCode: "abc123" });
    mockUpdate.mockResolvedValue({ id: 1, shortCode: "abc123", originalUrl: "https://new.example.com" });

    const r = await urlService.updateOriginalUrl("1", "u1", "https://new.example.com");

    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 1 }, data: { originalUrl: "https://new.example.com" } });
    expect(mockRedisDel).toHaveBeenCalledWith("abc123");
    expect(r).toMatchObject({ id: 1, shortCode: "abc123", originalUrl: "https://new.example.com" });
  });

  it("throws 404 for a link the user does not own", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(urlService.updateOriginalUrl("1", "u1", "https://x.com")).rejects.toMatchObject({ statusCode: 404 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/linkEdit.test.js -v`
Expected: FAIL — `updateOriginalUrl is not a function`.

- [ ] **Step 3: Implement the service**

In `src/services/urlService.js`, add:

```js
// Change the destination behind an existing shortCode. Owner-only (anonymous
// links return 404 via findOwnedUrlOr404). shortCode is immutable, so QR codes
// and shared links keep working; click history is preserved.
const updateOriginalUrl = async (urlId, userId, originalUrl) => {
  const url = await findOwnedUrlOr404(urlId, userId, { id: true, shortCode: true });

  const updated = await prisma.url.update({
    where: { id: url.id },
    data: { originalUrl },
  });

  // The cached redirect entry still holds the OLD originalUrl — drop it so the
  // next hit re-reads the new target.
  await redisClient.del(url.shortCode);

  return { id: updated.id, shortCode: updated.shortCode, originalUrl: updated.originalUrl };
};
```

Add `updateOriginalUrl` to `module.exports`.

- [ ] **Step 4: Write the validator middleware**

`src/middlewares/validateOriginalUrl.js`:

```js
const { validateUrlFormat } = require("../validators/urlValidator");

// Validate + normalize req.body.originalUrl for the link-edit PATCH. Mirrors the
// create-time normalization in validateUrl but reads the originalUrl field.
const validateOriginalUrl = (req, res, next) => {
  const { originalUrl } = req.body;

  if (!originalUrl || typeof originalUrl !== "string" || originalUrl.trim() === "") {
    return res.status(400).json({
      status: "error",
      statusCode: 400,
      message: "originalUrl is required",
    });
  }

  let normalized = originalUrl.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized}`;
  }

  validateUrlFormat(normalized);
  req.body.originalUrl = normalized;
  next();
};

module.exports = validateOriginalUrl;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest tests/linkEdit.test.js -v`
Expected: PASS (both).

- [ ] **Step 6: Commit**

```bash
git add src/services/urlService.js src/middlewares/validateOriginalUrl.js tests/linkEdit.test.js
git commit -m "feat: add updateOriginalUrl service + validator"
```

---

### Task 8: Link editing — controller + route

**Files:**
- Modify: `src/controllers/urlController.js` (add `updateOriginalUrl`, export)
- Modify: `src/routes/urlRoutes.js` (add PATCH route)

**Interfaces:**
- Consumes: `urlService.updateOriginalUrl`, `validateOriginalUrl` middleware, `authenticateToken`.
- Produces: `PATCH /api/urls/:id` returning `{ status, data: { id, shortCode, originalUrl, shortUrl } }`.

- [ ] **Step 1: Add the controller**

In `src/controllers/urlController.js`:

```js
const updateOriginalUrl = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { originalUrl } = req.body;

  const updated = await urlService.updateOriginalUrl(id, userId, originalUrl);

  res.json({
    status: "success",
    data: {
      id: updated.id,
      shortCode: updated.shortCode,
      originalUrl: updated.originalUrl,
      shortUrl: `${config.baseUrl}/${updated.shortCode}`,
    },
  });
});
```

Add `updateOriginalUrl` to `module.exports`.

- [ ] **Step 2: Add the route**

In `src/routes/urlRoutes.js`, add near the other authed url routes (BEFORE the `/:shortCode` redirect route so the path doesn't get swallowed), importing the middleware at top: `const validateOriginalUrl = require("../middlewares/validateOriginalUrl");`

```js
/**
 * @swagger
 * /{id}:
 *   patch:
 *     summary: Update the destination URL of a link you own
 *     tags: [URLs]
 *     responses:
 *       200: { description: Updated }
 *       400: { description: Invalid URL }
 *       404: { description: Not found or unauthorized }
 */
router.patch("/:id", authenticateToken, validateOriginalUrl, urlController.updateOriginalUrl);
```

Note: confirm route ordering — the numeric-id PATCH and the `GET /:shortCode` differ by method, so no collision, but keep PATCH above any catch-all.

- [ ] **Step 3: Run the full suite**

Run: `npm test`
Expected: all suites PASS (existing + new). No live DB/Redis needed.

- [ ] **Step 4: Commit**

```bash
git add src/controllers/urlController.js src/routes/urlRoutes.js
git commit -m "feat: add PATCH /:id link-edit route"
```

---

## Self-Review

**Spec coverage:**
- Analytics schema cols → Task 1. Enrichment parser → Task 2. recordClick wiring + referrer → Task 3. Grouped breakdowns → Task 4. ✓
- QR params/validation/render → Task 5. Logo embed → Task 6. Cache-key isolation → Task 5 (`qrCacheKey`). ✓
- Link edit service + cache bust + owner-only 404 → Task 7. Route + controller + validation → Task 8. Stats preserved (no reset) → inherent (same row). ✓

**Placeholder scan:** No TBD/TODO. Every code step shows full code. QR test harness step notes reuse of existing mock names — acceptable since it points to concrete variables in the target file.

**Type consistency:**
- `recordClick(urlId, { ipAddress, userAgent, referrer })` — defined Task 3, called Task 3 controller. ✓
- `enrichClick({ userAgent, ipAddress }) -> { browser, os, device, country }` — Task 2, used Task 3. ✓
- `parseQrOptions(query) -> { format, size, color, bg, margin, logo }` — Task 5, used Task 5 controller + Task 6. ✓
- `getQrCode(urlId, userId, options) -> { shortUrl, shortCode, format, payload }` — Task 5, extended Task 6. ✓
- `updateOriginalUrl(urlId, userId, originalUrl) -> { id, shortCode, originalUrl }` — Task 7, used Task 8. ✓

**Note for implementer:** `redirectRateLimiter` on `GET /:shortCode` is unrelated to the new PATCH. The QR route currently is authed (`req.user.id`); logo fetch relies on global `fetch` (Node 18+).
