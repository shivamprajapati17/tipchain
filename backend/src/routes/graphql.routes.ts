import { Router, Request, Response } from "express";
import { apiLimiter } from "../middleware/rateLimiter.middleware";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * Simple REST-to-GraphQL bridge.
 * In production, replace with Apollo Server.
 * 
 * POST /api/graphql
 * Simple GraphQL-like query endpoint
 */
router.post("/api/graphql", apiLimiter, async (req: Request, res: Response) => {
  const { query, variables } = req.body;

  if (!query || typeof query !== "string") {
    res.status(400).json({ errors: [{ message: "Must provide a query" }] });
    return;
  }

  try {
    const result = await executeGraphQL(query, variables);
    res.json(result);
  } catch (err: any) {
    res.json({
      errors: [{ message: err.message || "GraphQL execution error" }],
    });
  }
});

/**
 * Minimal GraphQL query executor.
 * Supports basic queries for Creators, Transactions, and Supporters.
 */
async function executeGraphQL(
  query: string,
  variables?: Record<string, any>
): Promise<any> {
  const data: Record<string, any> = {};

  // Simple query parsing — extract top-level fields
  const creatorMatch = query.match(/creators?\s*\{([^}]+)\}/);
  const txMatch = query.match(/transactions?\s*\{([^}]+)\}/);
  const supporterMatch = query.match(/supporters?\s*\{([^}]+)\}/);
  const leaderboardMatch = query.match(/leaderboard\s*\{([^}]+)\}/);

  // Parse wallet filter from variables
  const wallet = variables?.wallet;

  if (creatorMatch) {
    const fields = creatorMatch[1].split(",").map(f => f.trim());
    if (wallet) {
      const creator = await prisma.creator.findUnique({
        where: { walletAddress: wallet },
      });
      data.creator = creator ? pickFields(creator, fields) : null;
    } else {
      const creators = await prisma.creator.findMany({ take: 20 });
      data.creators = creators.map(c => pickFields(c, fields));
    }
  }

  if (txMatch) {
    const fields = txMatch[1].split(",").map(f => f.trim());
    const where: any = {};
    if (wallet) {
      where.OR = [{ senderWallet: wallet }, { receiverWallet: wallet }];
    }
    const txs = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    data.transactions = txs.map(tx => ({
      ...pickFields(tx, fields),
      amount: tx.amount?.toString(),
    }));
  }

  if (supporterMatch) {
    const fields = supporterMatch[1].split(",").map(f => f.trim());
    const where: any = {};
    if (wallet) where.walletAddress = wallet;
    const supporters = await prisma.supporter.findMany({
      where,
      orderBy: { totalTipped: "desc" },
      take: 20,
    });
    data.supporters = supporters.map(s => ({
      ...pickFields(s, fields),
      totalTipped: s.totalTipped?.toString(),
    }));
  }

  if (leaderboardMatch) {
    const supporters = await prisma.supporter.groupBy({
      by: ["walletAddress"],
      _sum: { totalTipped: true },
      _count: { walletAddress: true },
      orderBy: { _sum: { totalTipped: "desc" } },
      take: 25,
    });

    data.leaderboard = supporters.map((s, i) => ({
      rank: i + 1,
      walletAddress: s.walletAddress,
      totalTipped: (s._sum.totalTipped ?? BigInt(0)).toString(),
      tipCount: s._count.walletAddress,
    }));
  }

  return { data };
}

function pickFields(obj: any, fields: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const field of fields) {
    const clean = field.replace(/\(.*?\)/g, "").trim();
    if (clean && !clean.includes(" ") && obj[clean] !== undefined) {
      result[clean] = obj[clean];
    }
  }
  return result;
}

export default router;
