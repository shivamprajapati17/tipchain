import { Request, Response } from "express";
import { analyticsService } from "../services/analytics.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { extractPagination, extractDateRange } from "../utils/pagination";

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const overview = await analyticsService.getOverview(wallet);
  sendSuccess(res, { overview });
});

export const getRevenue = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const days = Math.min(Number(req.query.days) || 30, 365);
  const result = await analyticsService.getRevenue(wallet, days);
  sendSuccess(res, result);
});

export const getTipAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const result = await analyticsService.getTipAnalytics(wallet);
  sendSuccess(res, result);
});

export const getGrowth = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const result = await analyticsService.getGrowth(wallet);
  sendSuccess(res, result);
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const days = Math.min(Number(req.query.days) || 90, 365);
  const csv = await analyticsService.exportCsv(wallet, days);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="tipchain-export-${wallet.slice(0, 8)}.csv"`);
  res.send(csv);
});
