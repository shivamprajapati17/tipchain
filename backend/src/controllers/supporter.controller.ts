import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { extractPagination } from "../utils/pagination";
import { supporterRepository } from "../repositories/supporter.repository";
import { userRepository } from "../repositories/user.repository";
import { prisma } from "../lib/prisma";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const creator = await userRepository.findByWalletWithDetails(wallet);
  if (!creator) {
    const created = await userRepository.upsert(wallet);
    return sendSuccess(res, {
      profile: {
        walletAddress: created.walletAddress,
        username: created.username,
        bio: created.bio,
        avatarUrl: created.avatarUrl,
        reputation: 0,
        totalTipped: "0",
        totalTips: 0,
        createdAt: created.createdAt,
        badges: [],
        favoriteCreators: [],
        following: 0,
        recentActivity: [],
      },
    });
  }

  const [favoriteCreators, activity] = await Promise.all([
    prisma.supporter.findMany({
      where: { walletAddress: wallet },
      orderBy: { totalTipped: "desc" },
      take: 10,
      include: {
        creator: { select: { username: true, avatarUrl: true, bio: true } },
      },
    }),
    userRepository.getActivity(wallet),
  ]);

  return sendSuccess(res, {
    profile: {
      walletAddress: creator.walletAddress,
      username: creator.displayName,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      reputation: creator.reputation,
      totalTipped: creator.totalTipped.toString(),
      totalTips: creator.tipCount,
      createdAt: creator.createdAt,
      badges: [],
      favoriteCreators: favoriteCreators.map((s: any) => ({
        username: s.creator.username,
        avatarUrl: s.creator.avatarUrl,
        totalTipped: s.totalTipped.toString(),
        tipCount: s.tipCount,
      })),
      following: 0,
      recentActivity: activity.slice(0, 10),
    },
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const { bio, avatarUrl } = req.body;
  const user = await userRepository.update(wallet, {
    ...(bio !== undefined && { bio }),
    ...(avatarUrl !== undefined && { avatarUrl }),
  });
  sendSuccess(res, {
    walletAddress: user.walletAddress,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  });
});

export const getActivity = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const activity = await userRepository.getActivity(wallet, limit);
  sendSuccess(res, { wallet, activity });
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const leaderboard = await supporterRepository.getLeaderboard(limit);
  sendSuccess(res, { leaderboard });
});
