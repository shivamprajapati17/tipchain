import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const requestNonce = asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress } = req.body;
  const result = await authService.requestNonce(walletAddress);
  sendSuccess(res, result, "Nonce generated successfully");
});

export const verifySignature = asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress, signature, nonce } = req.body;
  const tokens = await authService.verifySignature(walletAddress, signature, nonce);
  sendSuccess(res, tokens, "Authentication successful");
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  const tokens = await authService.refreshAccessToken(token);
  sendSuccess(res, tokens, "Token refreshed successfully");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const { prisma } = require("../lib/prisma");
  if (!req.user) {
    return sendSuccess(res, null, "Not authenticated");
  }
  const creator = await prisma.creator.findUnique({
    where: { id: req.user.id },
  });
  if (!creator) {
    return sendSuccess(res, null, "Profile not found");
  }
  sendSuccess(res, {
    id: creator.id,
    walletAddress: creator.walletAddress,
    username: creator.username,
    bio: creator.bio,
    avatarUrl: creator.avatarUrl,
    totalTips: creator.totalTips.toString(),
    supporterCount: creator.supporterCount,
    createdAt: creator.createdAt,
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, null, "Logged out successfully");
});
