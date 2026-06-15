# URL Shortener

A simple URL shortener built with Express, Prisma (PostgreSQL), and nanoid.

## Setup

```bash
npm install
cp .env.example .env   # configure your DATABASE_URL
npx prisma migrate dev
npm start
```

## API

- `POST /shorten` — `{ "url": "https://example.com" }` → returns `{ shortCode, shortUrl }`
- `GET /:shortCode` — redirects to the original URL
- `GET /` — health check

## Stack

- **Express** — web framework
- **Prisma 7** — ORM (PostgreSQL via `@prisma/adapter-pg`)
- **nanoid** — short code generation
