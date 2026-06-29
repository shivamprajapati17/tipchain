import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { extractPagination } from "../utils/pagination";
import { analyticsService } from "../services/analytics.service";
import { prisma } from "../lib/prisma";

export const getPlatformAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const platform = await analyticsService.getPlatform();
  sendSuccess(res, { platform });
});

export const listCreators = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = extractPagination(req, 50, 200);
  const skip = (page - 1) * limit;

  const [creators, total] = await Promise.all([
    prisma.creator.findMany({
      orderBy: { totalTips: "desc" },
      skip,
      take: limit,
    }),
    prisma.creator.count(),
  ]);

  sendSuccess(res, {
    total,
    page,
    limit,
    creators: creators.map((c: any) => ({
      walletAddress: c.walletAddress,
      username: c.username,
      bio: c.bio,
      totalTips: c.totalTips.toString(),
      supporterCount: c.supporterCount,
      createdAt: c.createdAt,
    })),
  });
});

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const oneHourAgo = new Date(Date.now() - 3600000);
  const oneDayAgo = new Date(Date.now() - 86400000);

  const [recentTx, recentSenders] = await Promise.all([
    prisma.transaction.count({ where: { createdAt: { gte: oneHourAgo } } }),
    prisma.transaction.findMany({
      where: { createdAt: { gte: oneDayAgo } },
      select: { senderWallet: true },
      distinct: ["senderWallet"],
    }),
  ]);

  sendSuccess(res, {
    status: "healthy",
    uptime: process.uptime(),
    recentTxPerHour: recentTx,
    activeWallets24h: recentSenders.length,
    timestamp: new Date().toISOString(),
  });
});
