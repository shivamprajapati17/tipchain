import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendDeleted } from "../utils/apiResponse";
import { membershipService } from "../services/membership.service";

function formatTier(tier: any) {
  const priceInSol = Number(tier.priceSol || 0) / 1e9;
  return {
    id: tier.id,
    name: tier.name,
    description: tier.description || "",
    price: String(priceInSol),
    token: "SOL",
    benefits: tier.benefits || [],
    color: tier.color || "#10b981",
    subscriberCount: tier.subscriberCount || 0,
    maxSubscribers: tier.maxSubscribers || null,
    // Token-gating fields
    requiredToken: tier.requiredToken || null,
    requiredTokenAmount: tier.requiredTokenAmount || null,
    requiredTokenSymbol: tier.requiredTokenSymbol || null,
  };
}

export const getTiers = asyncHandler(async (req: Request, res: Response) => {
  const creatorWallet = req.params.wallet as string;
  const tiers = await membershipService.getTiers(creatorWallet);
  sendSuccess(res, { creatorWallet, tiers: tiers.map(formatTier) });
});

function formatSubscription(sub: any) {
  return {
    id: sub.id,
    tierId: sub.tierId,
    supporterWallet: sub.supporterWallet,
    creatorWallet: sub.creatorWallet,
    status: sub.status,
    startedAt: sub.startedAt,
    expiresAt: sub.expiresAt || null,
    cancelledAt: sub.cancelledAt || null,
  };
}

export const createTier = asyncHandler(async (req: Request, res: Response) => {
  const tier = await membershipService.createTier(req.body);
  sendSuccess(res, formatTier(tier), "Membership tier created", 201);
});

export const updateTier = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const tier = await membershipService.updateTier(id, req.body);
  sendSuccess(res, formatTier(tier), "Membership tier updated");
});

export const deleteTier = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await membershipService.deleteTier(id);
  sendDeleted(res, "Membership tier deleted");
});

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const { tierId, supporterWallet } = req.body;
  const subscription = await membershipService.subscribe(tierId, supporterWallet);
  sendSuccess(res, subscription, "Subscribed successfully", 201);
});

export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await membershipService.cancelSubscription(id);
  sendDeleted(res, "Subscription cancelled");
});

export const getMySubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const memberships = await membershipService.getSubscriptions(wallet);
  sendSuccess(res, { wallet, memberships: memberships.map(formatSubscription) });
});

export const getCreatorSubscribers = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const data = await membershipService.getCreatorSubscribers(wallet);
  sendSuccess(res, data.map((item: any) => ({
    tier: formatTier(item.tier),
    subscriptions: (item.subscriptions || []).map(formatSubscription),
  })));
});
