import { prisma } from "../lib/prisma";
import logger from "../utils/logger";

export async function computeLeaderboard(): Promise<void> {
  try {
    logger.info("Computing leaderboard...");

    const supporters = await prisma.supporter.groupBy({
      by: ["walletAddress"],
      _sum: { totalTipped: true },
      _count: { walletAddress: true },
      orderBy: { _sum: { totalTipped: "desc" } },
      take: 100,
    });

    const leaderboard = supporters.map((s: any, index: number) => ({
      rank: index + 1,
      walletAddress: s.walletAddress,
      totalTipped: (s._sum.totalTipped ?? BigInt(0)).toString(),
      tipCount: s._count.walletAddress,
    }));

    // Store in Redis if available
    try {
      const { cacheSet } = await import("../lib/redis");
      await cacheSet("leaderboard:global", leaderboard, 300);
    } catch {
      // Redis not available, skip caching
    }

    logger.info(`Leaderboard computed: ${leaderboard.length} supporters`);
  } catch (error) {
    logger.error("Failed to compute leaderboard", { error });
  }
}
