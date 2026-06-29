import { prisma } from "../lib/prisma";
import logger from "../utils/logger";

export async function computeDailyAnalytics(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  try {
    logger.info("Computing daily analytics...");

    // Platform-wide stats
    const [totalTips, tipCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: { createdAt: { gte: yesterday, lt: today } },
        _sum: { amount: true },
      }),
      prisma.transaction.count({
        where: { createdAt: { gte: yesterday, lt: today } },
      }),
    ]);

    // Per-creator analytics
    const creators = await prisma.creator.findMany({
      select: { walletAddress: true },
    });

    for (const creator of creators) {
      const creatorStats = await prisma.transaction.aggregate({
        where: { receiverWallet: creator.walletAddress, createdAt: { gte: yesterday, lt: today } },
        _sum: { amount: true },
        _count: true,
      });

      if (creatorStats._count > 0) {
        // Log per-creator stats (DailyAnalytics table doesn't exist yet)
        logger.info(`Creator ${creator.walletAddress.slice(0, 8)}: ${creatorStats._count} tips, ${creatorStats._sum?.amount?.toString() ?? "0"} total`);
      }
    }

    logger.info(`Daily analytics: ${tipCount} transactions, ${totalTips._sum?.amount?.toString() ?? "0"} total volume`);
  } catch (error) {
    logger.error("Failed to compute daily analytics", { error });
  }
}
