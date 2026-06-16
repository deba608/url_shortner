const winston = require("winston");

const isProduction = process.env.NODE_ENV === "production";

// In production we emit structured JSON (one object per line) so log aggregators
// (Render logs, Datadog, CloudWatch, etc.) can parse and index fields. In
// development we use a colourised, human-readable format.
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${rest}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  format: isProduction ? productionFormat : developmentFormat,
  transports: [new winston.transports.Console()],
  // Don't crash the process on a logging error.
  exitOnError: false,
});

module.exports = logger;
