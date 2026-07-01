# Design: Analytics upgrade, QR customization, Link editing

Date: 2026-07-02
Status: Approved (design), pending spec review

Three independent features for the URL-shortener API (Express + Prisma + Redis).
Each ships as its own vertical slice. Order below is also the recommended build order.

---

## Feature 1 — Click analytics upgrade

Enrich each recorded click with browser, OS, device, country, and referrer, then
expose grouped breakdowns in the analytics endpoint.

### Dependencies (new)

- `ua-parser-js` — parse `userAgent` → browser / OS / device type.
- `geoip-lite` — offline MaxMind lookup, IP → country. No network on the click path.

### Schema — add nullable columns to `Click`

```prisma
model Click {
  // ...existing fields...
  browser   String?
  os        String?
  device    String?   // "desktop" | "mobile" | "tablet" | "bot"
  country   String?   // ISO country code, e.g. "US"
  referrer  String?
}
```

Migration adds nullable columns. Existing rows remain `null` (acceptable — old
clicks were captured before enrichment). No backfill.

### Write path — `recordClick`

Change signature from positional to an options object to avoid positional creep:

```js
recordClick(urlId, { ipAddress, userAgent, referrer })
```

Inside `recordClick`, before the transaction:

- Parse `userAgent` with `ua-parser-js` → `browser` (name), `os` (name),
  `device` (`type` or `"desktop"` when undefined; `"bot"` when parser flags a bot).
- Look up `ipAddress` with `geoip-lite` → `country` (null when private/unknown IP).
- Store all five enriched fields (plus existing `ipAddress`, `userAgent`) on the
  `Click.create`.

Controller (`redirectToUrl`) passes `referrer` from `req.get("referer")`. The
redirect stays non-blocking — enrichment happens inside the already-`.catch()`ed
async `recordClick` call, so parse/lookup errors never block or fail the redirect.

### Read path — `getUrlAnalytics`

Add grouped breakdowns, each via `prisma.click.groupBy`:

```js
prisma.click.groupBy({ by: ["browser"], where: { urlId }, _count: { _all: true } })
// repeat for: os, device, country, referrer
```

Add these to the existing `Promise.all` alongside the current aggregations.
Map each result to `[{ value, count }]`, sorted desc by count. Null values keep
their group (label `"unknown"` in the mapped output).

Response gains:

```json
{
  "byBrowser":  [{ "value": "Chrome", "count": 42 }],
  "byOs":       [{ "value": "Windows", "count": 30 }],
  "byDevice":   [{ "value": "desktop", "count": 55 }],
  "byCountry":  [{ "value": "US", "count": 20 }],
  "byReferrer": [{ "value": "google.com", "count": 12 }]
}
```

Bots (`device: "bot"`) are still counted but surface as their own device group so
real traffic stays readable.

---

## Feature 2 — QR customization

Extend the existing `GET /api/urls/:id/qr` endpoint with style query params. No
schema change; owner-only (unchanged).

### Dependencies (new)

- `sharp` — composite a logo over the PNG. Only used when `logo=true`.

### Query params

| param    | values                     | default              |
|----------|----------------------------|----------------------|
| `format` | `png` \| `svg` \| `json`   | `json` (data URL)    |
| `size`   | int px, clamp 100–1000      | 300                  |
| `color`  | hex (dark modules)          | `#000000`            |
| `bg`     | hex (light modules)         | `#ffffff`            |
| `margin` | int 0–10                    | 2                    |
| `logo`   | `true` (centers user avatar)| off                  |

### Validation

- `color` / `bg`: hex regex `^#([0-9a-fA-F]{6})$` → `ApiError(400)` on mismatch.
- `size` / `margin`: parse int, clamp to range (out-of-range clamps, not errors;
  non-numeric → 400).
- `logo=true` with `format=svg` → `ApiError(400, "logo only supported with png")`.
- Validate before rendering.

### Render

- `svg` → `QRCode.toString(shortUrl, { type: "svg", color, width, margin })`,
  `Content-Type: image/svg+xml`.
- `png` → `QRCode.toBuffer(shortUrl, { color, width, margin })`, direct buffer
  (replaces the current base64-split hack in the controller).
- `json` → `QRCode.toDataURL(...)` (current behavior).

`color` maps to `{ color: { dark: color, light: bg } }`.

### Logo embed

Only when `logo=true` AND `user.avatar` is set (fetch avatar in service). Composite
avatar over PNG center with `sharp`. Raise `errorCorrectionLevel` to `"H"` when logo
on (center coverage). SVG + logo unsupported (400 above). If `logo=true` but user
has no avatar → ignore logo, render plain (no error).

### Cache

Current key is `qr:{shortCode}` — collides across styles. New key includes a hash of
all style params:

```
qr:{shortCode}:{stableHashOf(format,size,color,bg,margin,logo)}
```

Default (no params) still resolves to a stable key so the common case stays cached.

---

## Feature 3 — Link editing

Change `originalUrl` behind an existing shortCode. Owner-only, authenticated.
shortCode is immutable (QR codes and shared links keep working).

### Route

```
PATCH /api/urls/:id      (authenticateToken, validateUrl)
body: { originalUrl }
```

Reuse the existing `validateUrl` middleware for URL-format checks (same rule as
create).

### Service — `updateOriginalUrl(urlId, userId, originalUrl)`

- `findOwnedUrlOr404(urlId, userId, { id: true, shortCode: true })` — anonymous
  links (no `userId`) return 404, not editable (matches decision).
- `prisma.url.update({ where: { id }, data: { originalUrl } })`.
- **Invalidate redirect cache**: `redisClient.del(shortCode)` — critical; the
  cached entry holds the old `originalUrl` and would keep redirecting there.
- No QR cache bust: shortCode unchanged, QR still encodes the same short URL.

### Response

```json
{ "status": "success",
  "data": { "id": 1, "shortCode": "abc123",
            "originalUrl": "https://new.example.com",
            "shortUrl": "https://host/abc123" } }
```

### Behavior notes

- Click history and analytics are preserved (same `Url` row). Editing the target
  does NOT reset stats — matches common shortener behavior.

---

## Testing

- **Feature 1:** unit test `recordClick` enrichment (mock UA strings → expected
  browser/os/device; known IP → country; private IP → null). Analytics test
  asserts the new grouped arrays present and correctly counted.
- **Feature 2:** endpoint tests per format (png buffer content-type, svg
  content-type, json data URL); validation tests (bad hex → 400, svg+logo → 400,
  size clamps); cache-key isolation (styled vs default don't collide).
- **Feature 3:** owner can edit → new redirect target; anon link → 404; non-owner
  → 404; cache invalidated after edit (next redirect uses new target); stats
  preserved across edit.

Follow existing test patterns in `tests/`.

## Out of scope (YAGNI)

- Time-series / per-day click charts (existing daily/weekly counts stay as-is).
- QR style persistence in DB (stateless query params only).
- Edit tokens for anonymous links (owner-only per decision).
- Custom fonts / gradients in QR.
