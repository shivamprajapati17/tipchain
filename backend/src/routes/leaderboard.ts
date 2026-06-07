import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

type SupporterGroup = {
  walletAddress: string;
  _sum: { totalTipped: bigint | null };
  _count: { walletAddress: number };
};

// GET /leaderboard — Top supporters ranked by total amount tipped
router.get("/leaderboard", async (_req: Request, res: Response) => {
  try {
    const limit = Math.min(
      Number(_req.query.limit) || 25,
      100
    );

    const supporters = (await prisma.supporter.groupBy({
      by: ["walletAddress"],
      _sum: {
        totalTipped: true,
      },
      _count: {
        walletAddress: true,
      },
      orderBy: {
        _sum: {
          totalTipped: "desc",
        },
      },
      take: limit,
    })) as unknown as SupporterGroup[];

    const leaderboard = supporters.map((s: SupporterGroup, index: number) => ({
      rank: index + 1,
      walletAddress: s.walletAddress,
      totalTipped: s._sum.totalTipped?.toString() ?? "0",
      tipCount: s._count.walletAddress,
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// GET /leaderboard/:wallet — Get a specific wallet's rank
router.get(
  "/leaderboard/:wallet",
  async (req: Request, res: Response) => {
    try {
      const { wallet } = req.params;

      const stats = await prisma.supporter.aggregate({
        where: { walletAddress: wallet },
        _sum: { totalTipped: true },
        _count: true,
      });

      // Get rank by counting supporters with higher totals
      const rank = await prisma.supporter.groupBy({
        by: ["walletAddress"],
        _sum: { totalTipped: true },
        having: {
          totalTipped: {
            _gt: stats._sum.totalTipped ?? BigInt(0),
          },
        },
      });

      if (!stats._sum.totalTipped) {
        return res.json({
          walletAddress: wallet,
          rank: null,
          totalTipped: "0",
          tipCount: 0,
        });
      }

      res.json({
        walletAddress: wallet,
        rank: rank.length + 1,
        totalTipped: stats._sum.totalTipped.toString(),
        tipCount: stats._count,
      });
    } catch (error) {
      console.error("Error fetching leaderboard rank:", error);
      res.status(500).json({ error: "Failed to fetch rank" });
    }
  }
);

export default router;
