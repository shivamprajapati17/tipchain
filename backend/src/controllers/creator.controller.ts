import { Request, Response } from "express";
import { creatorService } from "../services/creator.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated, sendDeleted } from "../utils/apiResponse";
import { extractPagination } from "../utils/pagination";
import { prisma } from "../lib/prisma";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const creator = await creatorService.register(req.body);
  sendCreated(res, creator, "Creator profile created successfully");
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const creator = await creatorService.update(wallet, req.body);
  sendSuccess(res, creator, "Profile updated successfully");
});

export const getByUsername = asyncHandler(async (req: Request, res: Response) => {
  const username = req.params.username as string;
  const creator = await creatorService.getByUsername(username);

  const [recentTransactions, topSupporters] = await Promise.all([
    prisma.transaction.findMany({
      where: { receiverWallet: creator.walletAddress },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        senderWallet: true,
        receiverWallet: true,
        amount: true,
        token: true,
        txHash: true,
        message: true,
        createdAt: true,
      },
    }),
    prisma.supporter.findMany({
      where: { creatorWallet: creator.walletAddress },
      orderBy: { totalTipped: "desc" },
      take: 10,
    }),
  ]);

  sendSuccess(res, {
    creator,
    recentTransactions: recentTransactions.map((t: any) => ({
      id: t.id,
      senderWallet: t.senderWallet,
      receiverWallet: t.receiverWallet,
      amount: t.amount.toString(),
      token: t.token,
      txHash: t.txHash,
      message: t.message,
      timestamp: t.createdAt,
    })),
    topSupporters: topSupporters.map((s: any) => ({
      walletAddress: s.walletAddress,
      totalTipped: s.totalTipped.toString(),
      tipCount: s.tipCount,
    })),
  });
});

export const getByWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const creator = await creatorService.getByWallet(wallet);

  const [recentTransactions, topSupporters] = await Promise.all([
    prisma.transaction.findMany({
      where: { receiverWallet: wallet },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.supporter.findMany({
      where: { creatorWallet: wallet },
      orderBy: { totalTipped: "desc" },
      take: 10,
    }),
  ]);

  sendSuccess(res, {
    creator,
    recentTransactions: recentTransactions.map((t: any) => ({
      id: t.id,
      senderWallet: t.senderWallet,
      receiverWallet: t.receiverWallet,
      amount: t.amount.toString(),
      token: t.token,
      txHash: t.txHash,
      message: t.message,
      timestamp: t.createdAt,
    })),
    topSupporters: topSupporters.map((s: any) => ({
      walletAddress: s.walletAddress,
      totalTipped: s.totalTipped.toString(),
      tipCount: s.tipCount,
    })),
  });
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Not authenticated", timestamp: new Date().toISOString() });
    return;
  }
  try {
    const creator = await creatorService.getByWallet(req.user.walletAddress);
    sendSuccess(res, creator);
  } catch {
    sendSuccess(res, null, "Creator profile not found. Please register first.");
  }
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendSuccess(res, null, "Not authenticated");
  }
  const dashboard = await creatorService.getDashboard(req.user.walletAddress);
  sendSuccess(res, dashboard);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return;
  await creatorService.delete(req.user.walletAddress);
  sendDeleted(res, "Creator profile deleted");
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = extractPagination(req);
  const sortBy = req.query.sortBy as string;
  const category = req.query.category as string;

  const result = await creatorService.list({ page, limit, sortBy, category });
  sendSuccess(res, result);
});

export const search = asyncHandler(async (req: Request, res: Response) => {
  const query = (req.query.q as string) || "";
  const { page, limit } = extractPagination(req);
  const category = req.query.category as string;
  const sortBy = req.query.sortBy as string;

  const result = await creatorService.search(query, { page, limit, category, sortBy });
  sendSuccess(res, result);
});

export const getTrending = asyncHandler(async (_req: Request, res: Response) => {
  const trending = await creatorService.getTrending();
  sendSuccess(res, { trending });
});

export const getFeatured = asyncHandler(async (_req: Request, res: Response) => {
  const featured = await creatorService.getFeatured();
  sendSuccess(res, { featured });
});

export const getRecent = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const recent = await creatorService.getRecent(limit);
  sendSuccess(res, { recent });
});

export const getRecommended = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.query.wallet as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const recommended = await creatorService.getRecommended(wallet, limit);
  sendSuccess(res, { recommended });
});
