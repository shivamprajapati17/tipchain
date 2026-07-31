import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { getEnv } from "./config/env";
import { getCorsOptions } from "./config/cors";
import routes from "./routes/index";
import { errorHandler } from "./middleware/error.middleware";
import { httpLogger } from "./middleware/logger.middleware";
import { apiLimiter } from "./middleware/rateLimiter.middleware";
import { generateRequestId } from "./utils/crypto";

const app = express();
const env = getEnv();

// ─── Global Middleware ───────────────────────────────────────────────────────
// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(cors(getCorsOptions()));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Request ID
app.use((req, _res, next) => {
  req.requestId = generateRequestId();
  next();
});

// HTTP logging
app.use(httpLogger);

// Global rate limiting
app.use(apiLimiter);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || "0.1.0",
  });
});

// Metrics endpoint
app.get("/metrics", (_req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + "MB",
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + "MB",
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
    },
    uptime: process.uptime(),
    pid: process.pid,
    nodeVersion: process.version,
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/v1", routes);
// Also mount routes at root for backward compatibility
app.use(routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    timestamp: new Date().toISOString(),
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

export { app };
export default app;
