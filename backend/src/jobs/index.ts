import cron from "node-cron";
import logger from "../utils/logger";
import { getEnv, isProduction } from "../config/env";
import { cleanupOldData } from "./cleanup.job";

export { cleanupOldData };

/**
 * Initialize all scheduled jobs
 */
export function initializeJobs(): void {
  if (!isProduction() && process.env.RUN_CRON !== "true") {
    logger.info("Cron jobs disabled in development. Set RUN_CRON=true to enable.");
    return;
  }

  logger.info("Initializing scheduled jobs...");

  // Cleanup old data daily at 03:00
  cron.schedule("0 3 * * *", async () => {
    logger.info("Cron: Running cleanup");
    await cleanupOldData();
  });

  logger.info("Scheduled jobs initialized");
}
