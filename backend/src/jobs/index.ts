import cron from "node-cron";
import logger from "../utils/logger";
import { getEnv, isProduction } from "../config/env";
import { computeDailyAnalytics } from "./analytics.job";
import { computeLeaderboard } from "./leaderboard.job";
import { cleanupOldData } from "./cleanup.job";

export { computeDailyAnalytics, computeLeaderboard, cleanupOldData };

/**
 * Initialize all scheduled jobs
 */
export function initializeJobs(): void {
  if (!isProduction() && process.env.RUN_CRON !== "true") {
    logger.info("Cron jobs disabled in development. Set RUN_CRON=true to enable.");
    return;
  }

  logger.info("Initializing scheduled jobs...");

  // Daily analytics at 00:05
  cron.schedule("5 0 * * *", async () => {
    logger.info("Cron: Running daily analytics computation");
    await computeDailyAnalytics();
  });

  // Leaderboard refresh every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    logger.info("Cron: Refreshing leaderboard");
    await computeLeaderboard();
  });

  // Cleanup old data daily at 03:00
  cron.schedule("0 3 * * *", async () => {
    logger.info("Cron: Running cleanup");
    await cleanupOldData();
  });

  // Run initial computations on startup
  if (isProduction()) {
    setTimeout(async () => {
      await computeLeaderboard();
    }, 30000); // 30 seconds after startup
  }

  logger.info("Scheduled jobs initialized");
}
