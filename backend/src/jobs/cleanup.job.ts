import { prisma } from "../lib/prisma";
import logger from "../utils/logger";

export async function cleanupOldData(): Promise<void> {
  try {
    logger.info("Running cleanup job...");

    // Delete transactions without txHash older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deletedTx = await prisma.transaction.deleteMany({
      where: {
        txHash: null,
        createdAt: { lt: sevenDaysAgo },
      },
    });
    logger.info(`Deleted ${deletedTx.count} stale transactions`);

    logger.info("Cleanup job completed");
  } catch (error) {
    logger.error("Cleanup job failed", { error });
  }
}
