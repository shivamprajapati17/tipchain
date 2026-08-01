import app from "./app";
import { getEnv } from "./config/env";
import logger from "./utils/logger";

const env = getEnv();

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

export { app };
export default app;
