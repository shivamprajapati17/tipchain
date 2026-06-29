import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { badgeService } from "../services/badge.service";

export const getAllBadges = asyncHandler(async (_req: Request, res: Response) => {
  const badges = await badgeService.getAllBadges();
  sendSuccess(res, { badges });
});

export const getSupporterBadges = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const badges = await badgeService.getSupporterBadges(wallet);
  sendSuccess(res, { wallet, badges });
});

export const awardBadge = asyncHandler(async (req: Request, res: Response) => {
  const award = await badgeService.awardBadge(req.body);
  sendSuccess(res, award, "Badge awarded", 201);
});
