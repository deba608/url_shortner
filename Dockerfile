# ── Stage 1: deps ──────────────────────────────────────────────────
# Install only production dependencies first — this layer is cached
# as long as package-lock.json doesn't change, so redeploys that only
# touch source files skip the slow npm install entirely.
FROM node:20-alpine AS deps

# Prisma needs OpenSSL on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy lockfiles FIRST so Docker cache is invalidated only when deps change
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# --omit=dev skips devDependencies (jest, nodemon, etc.) → smaller image
# --prefer-offline uses the npm cache if available
RUN npm ci --omit=dev && npx prisma generate

# ── Stage 2: runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

# Copy pre-built deps from Stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated

# Copy source (changes on every deploy, but npm install is already cached)
COPY . .

EXPOSE 3000

# migrate deploy is fast (no-op if schema matches); then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
