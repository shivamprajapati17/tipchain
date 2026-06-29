import { Request, Response } from "express";
import { tipService } from "../services/tip.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated } from "../utils/apiResponse";
import { extractPagination, extractDateRange } from "../utils/pagination";

export const sendTip = asyncHandler(async (req: Request, res: Response) => {
  const result = await tipService.send(req.body);
  sendCreated(res, result, "Tip sent successfully");
});

export const sendSplTip = asyncHandler(async (req: Request, res: Response) => {
  const result = await tipService.sendSpl(req.body);
  sendCreated(res, result, "SPL tip sent successfully");
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = extractPagination(req);
  const token = req.query.token as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  const result = await tipService.getHistory({ page, limit, token, startDate, endDate });
  sendSuccess(res, result);
});

export const getByWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const { page, limit } = extractPagination(req);
  const result = await tipService.getHistory({ page, limit, wallet });
  sendSuccess(res, result);
});

export const getByCreator = asyncHandler(async (req: Request, res: Response) => {
  const creator = req.params.creator as string;
  const { page, limit } = extractPagination(req);
  const result = await tipService.getCreatorTips(creator, { page, limit });
  sendSuccess(res, result);
});

export const getBySupporter = asyncHandler(async (req: Request, res: Response) => {
  const supporter = req.params.supporter as string;
  const { page, limit } = extractPagination(req);
  const result = await tipService.getSupporterTips(supporter, { page, limit });
  sendSuccess(res, result);
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const leaderboard = await tipService.getLeaderboard(limit);
  sendSuccess(res, { leaderboard });
});
