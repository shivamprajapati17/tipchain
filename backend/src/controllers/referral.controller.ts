import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { referralService } from "../services/referral.service";

export const getReferralStats = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const stats = await referralService.getReferralStats(wallet);
  sendSuccess(res, stats);
});

export const createReferralCode = asyncHandler(async (req: Request, res: Response) => {
  const { creatorWallet } = req.body;
  const code = await referralService.createReferralCode(creatorWallet);
  sendSuccess(res, code, "Referral code created", 201);
});

export const trackReferralCode = asyncHandler(async (req: Request, res: Response) => {
  const code = req.params.code as string;
  const wallet = req.query.wallet as string | undefined;
  const referral = await referralService.trackReferralCode(code, wallet);
  sendSuccess(res, referral);
});
