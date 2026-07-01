const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const urlRoutes = require("./routes/urlRoutes");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const rateLimiter = require("./middlewares/rateLimiter");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const logger = require("./config/logger");
const prisma = require("./config/database");
const redisClient = require("./config/redis");

const app = express();

// CORS — must be registered before any other middleware so preflight OPTIONS
// requests (sent by the browser for cross-origin POSTs) are answered immediately.
const allowedOrigins = [
  "http://localhost:5173", // Vite dev server (default)
  "http://localhost:5174", // Vite dev server (fallback port)
  "http://localhost:3000", // direct access / Swagger UI
  "https://shortly-devv.vercel.app", // production frontend
  process.env.FRONTEND_URL, // overrideable via env var
].filter(Boolean);

// Match ONLY this project's own Vercel preview deploys, e.g.
// shortly-devv-git-<branch>-<scope>.vercel.app or shortly-devv-<hash>.vercel.app.
// A blanket *.vercel.app allowlist would let any Vercel-hosted site make
// credentialed cross-origin calls — too broad for a cookie-auth API.
const VERCEL_PREVIEW = /^https:\/\/shortly-devv(-[a-z0-9-]+)?\.vercel\.app$/;

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl, Postman, server-to-server
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (origin.startsWith("http://localhost:")) return cb(null, true);
      if (VERCEL_PREVIEW.test(origin)) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);

// Security headers (X-Content-Type-Options, X-Frame-Options, etc.).
// Content-Security-Policy is intentionally omitted — the API serves JSON and
// Swagger UI (which needs inline scripts). Configure CSP on the frontend instead.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(cookieParser());

// Request logging: pipe morgan's HTTP access logs through winston so all logs
// share one structured pipeline. Skip the noisy health-check route.
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => req.url === "/health",
  })
);

app.use(rateLimiter);

app.get("/", (req, res) => {
  res.send("URL Shortener API is running");
});

/**
 * Liveness + readiness probe. Checks the two critical dependencies (Postgres and
 * Redis) and reports per-dependency status. Returns 503 if anything is down so
 * orchestrators (Render, k8s) can pull the instance out of rotation.
 */
app.get("/health", async (req, res) => {
  const checks = { database: "down", redis: "down" };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "up";
  } catch (err) {
    logger.error("Health check: database unreachable", { error: err.message });
  }

  try {
    const pong = await redisClient.ping();
    if (pong === "PONG") checks.redis = "up";
  } catch (err) {
    logger.error("Health check: redis unreachable", { error: err.message });
  }

  const healthy = Object.values(checks).every((s) => s === "up");
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "UP" : "DEGRADED",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks,
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/", urlRoutes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;
