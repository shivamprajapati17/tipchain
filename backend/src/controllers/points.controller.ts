import { Request, Response } from "express";
import { pointsService } from "../services/points.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const getPointsLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || "all";
  const token = req.query.token as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const leaderboard = await pointsService.getPointsLeaderboard({ period, token, limit });
  sendSuccess(res, { leaderboard, period });
});

export const getWalletPoints = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const period = (req.query.period as string) || "all";
  const points = await pointsService.getWalletPoints(wallet, period);
  sendSuccess(res, points);
});
