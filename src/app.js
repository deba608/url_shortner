const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const urlRoutes = require("./routes/urlRoutes");
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
  "http://localhost:5173", // Vite dev server
  "http://localhost:3000", // direct access / Swagger UI
  process.env.FRONTEND_URL, // production frontend URL (set in prod .env)
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no Origin header (curl, Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
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

const { clerkMiddleware } = require("@clerk/express");

// Apply Clerk middleware globally. This checks the request for a valid Clerk token
// and populates req.auth if one is found. It does not block unauthenticated requests.
app.use(clerkMiddleware());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/", urlRoutes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;
