import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class SupporterRepository {
  async findByWallet(wallet: string) {
    return prisma.supporter.findMany({
      where: { walletAddress: wallet },
      include: {
        creator: {
          select: { username: true, avatarUrl: true, bio: true },
        },
      },
      orderBy: { totalTipped: "desc" },
    });
  }

  async findTopSupporters(creatorWallet: string, limit = 10) {
    return prisma.supporter.findMany({
      where: { creatorWallet },
      orderBy: { totalTipped: "desc" },
      take: limit,
    });
  }

  async getLeaderboard(limit = 25) {
    const supporters = await prisma.supporter.groupBy({
      by: ["walletAddress"],
      _sum: { totalTipped: true },
      _count: { walletAddress: true },
      orderBy: { _sum: { totalTipped: "desc" } },
      take: limit,
    });

    return supporters.map((s: any, index: number) => ({
      rank: index + 1,
      walletAddress: s.walletAddress,
      totalTipped: s._sum.totalTipped?.toString() ?? "0",
      tipCount: s._count.walletAddress,
    }));
  }

  async getRank(wallet: string) {
    const stats = await prisma.supporter.aggregate({
      where: { walletAddress: wallet },
      _sum: { totalTipped: true },
      _count: true,
    });

    const totalTipped = stats._sum?.totalTipped;
    if (!totalTipped) return { rank: null, totalTipped: "0", tipCount: 0 };

    const higher = await prisma.supporter.groupBy({
      by: ["walletAddress"],
      _sum: { totalTipped: true },
      having: { totalTipped: { _gt: totalTipped } } as any,
    });

    return {
      rank: higher.length + 1,
      totalTipped: totalTipped.toString(),
      tipCount: typeof stats._count === "number" ? stats._count : 0,
    };
  }
}

export const supporterRepository = new SupporterRepository();
