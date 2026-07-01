# Improvements

Audit of the URL-shortener API (Express + Prisma + Redis). Ordered by priority.
Checkbox = done.

## 🔴 Security (high)

- [ ] **1. User enumeration via auth responses.**
  `forgotPassword` returns `404 "No account found with that email"`, `register`
  returns `"An account with this email already exists"`, and `login` timing
  differs for unknown vs known email. All leak which emails are registered.
  **Fix:** `forgot-password` always returns generic `200` success regardless of
  whether the email exists. Keep register's message but consider generic.
  Files: `src/controllers/authController.js`.

- [ ] **2. Password-reset tokens are not single-use / not invalidated.**
  Reset uses a stateless 1h JWT. After a password change the old reset token
  (and any issued JWT session token) stays valid for its full lifetime. A leaked
  reset link works repeatedly for an hour.
  **Fix:** add `passwordChangedAt` to `User`; reject reset/session tokens issued
  before it. Or store a one-time reset token hash in DB and delete on use.
  Files: `prisma/schema.prisma`, `authController.js`, `authMiddleware.js`.

- [ ] **3. Hardcoded JWT_SECRET fallback.**
  `const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev"` in
  `authController.js` and `authMiddleware.js`. If the env var is ever missing in
  prod, tokens are signed with a public string → full auth bypass.
  **Fix:** require `JWT_SECRET` in `validateEnv`, drop the fallback (or only
  allow fallback when `NODE_ENV !== production`). Single source of the secret.
  Files: `src/config/validateEnv.js`, `authController.js`, `authMiddleware.js`.

- [ ] **4. No rate limiting on auth routes.**
  `/login` (brute force), `/forgot-password` (email-bomb + enumeration) only
  hit the global 100/15min limiter. Too loose.
  **Fix:** dedicated stricter limiter on `/api/auth/login`, `/forgot-password`,
  `/reset-password` (e.g. 5–10 / 15min per IP).
  Files: `src/middlewares/rateLimiter.js`, `src/routes/authRoutes.js`.

- [ ] **5. CORS allows every `*.vercel.app` with credentials.**
  `origin.endsWith(".vercel.app")` + `credentials: true` lets any Vercel-hosted
  site make authenticated cross-origin calls. Broad for a credentialed API.
  **Fix:** restrict to the known project's preview pattern or an allowlist.
  Files: `src/app.js`.

- [ ] **6. Weak password policy (min 6 chars).**
  **Fix:** raise to >= 8 and centralize the rule.
  Files: `authController.js`.

## 🟡 Consistency / quality (medium)

- [ ] **7. authController diverges from the app's error pattern.**
  Rest of app uses `catchAsync` + `ApiError` + `{status,message}` shape. Auth
  uses manual `try/catch` and `res.status().json({ error })`. Inconsistent
  client contract + duplicated validation.
  **Fix:** migrate auth to `catchAsync`/`ApiError`, move validation to a
  validator module.

- [ ] **8. Redundant DB read on the hot redirect path.**
  `redirectToUrl` calls `getUrlByShortCode` (cached) then `recordClick` runs a
  second uncached `findUnique` on the same shortCode for every click.
  **Fix:** pass the already-fetched `url.id` into `recordClick`.
  Files: `urlController.js`, `urlService.js`.

- [ ] **9. Duplicated ownership-lookup boilerplate.**
  `getQrCode`, `updateExpiration`, `deleteUrl` repeat: parseInt → NaN check →
  `findFirst({id,userId})` → 404. `getUrlAnalytics` uses `parseInt` w/o radix.
  **Fix:** extract a `findOwnedUrlOr404(urlId, userId, select)` helper.
  Files: `urlService.js`.

- [ ] **10. Dead code in createShortUrl controller.**
  `const expiry = resolved === undefined ? undefined : resolved;` == `resolved`.
  Files: `urlController.js`.

## 🟢 Missing / nice-to-have (low)

- [ ] **11. No auth tests.** Tests cover url/analytics/qr/email/redis/expiration
  but not register/login/forgot/reset. Add `tests/auth.test.js`.

- [ ] **12. Analytics `uniqueVisitors` loads all click rows via groupBy** just to
  take `.length`. At scale prefer a distinct-count query. Add `Click.clickedAt`
  index for the daily/weekly `count` queries.
  Files: `prisma/schema.prisma`, `urlService.js`.
