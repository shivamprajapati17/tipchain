import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { getEnv, isProduction } from "./config/env";
import { getCorsOptions } from "./config/cors";
import routes from "./routes/index";
import { errorHandler } from "./middleware/error.middleware";
import { httpLogger } from "./middleware/logger.middleware";
import { apiLimiter } from "./middleware/rateLimiter.middleware";
import { generateRequestId } from "./utils/crypto";
import logger from "./utils/logger";

const app = express();
const env = getEnv();

// ─── Global Middleware ───────────────────────────────────────────────────────
// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

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

// Metrics endpoint (for Railway monitoring)
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

// ─── Server Start ────────────────────────────────────────────────────────────
const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`========================================`);
  logger.info(`  TipChain API Server`);
  logger.info(`  Environment: ${env.NODE_ENV}`);
  logger.info(`  Port: ${env.PORT}`);
  logger.info(`  Host: ${env.HOST}`);
  logger.info(`  Health: http://localhost:${env.PORT}/health`);
  logger.info(`  API:    http://localhost:${env.PORT}/api/v1`);
  logger.info(`========================================`);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info("HTTP server closed");

    const { disconnectPrisma } = await import("./lib/prisma");
    await disconnectPrisma();

    const { disconnectRedis } = await import("./lib/redis");
    await disconnectRedis();

    logger.info("Graceful shutdown complete");
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error.message, stack: error.stack });
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled rejection", { error: reason?.message, stack: reason?.stack });
});

export default app;
