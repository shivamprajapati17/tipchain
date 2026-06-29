import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../lib/prisma";
import logger from "../utils/logger";
import { membershipService } from "../services/membership.service";

// ─── Action Metadata Helpers ────────────────────────────────────────────────

interface ActionMetadata {
  title: string;
  description: string;
  icon: string;
  label: string;
  disabled?: boolean;
  links?: {
    actions: Array<{
      href: string;
      label: string;
      parameters?: Array<{ name: string; label: string; required?: boolean }>;
    }>;
  };
  error?: { message: string };
}

function buildActionResponse(metadata: ActionMetadata) {
  return {
    ...metadata,
    // Default TipChain icon (a simple SVG data URI)
    icon: metadata.icon || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💎</text></svg>",
  };
}

// ─── Creator Tip Action ──────────────────────────────────────────────────────

/**
 * GET /api/actions/creator/:wallet
 * Returns metadata for the creator tip action.
 */
export const getCreatorAction = asyncHandler(async (req: Request, res: Response) => {
  const wallet = String(req.params.wallet);

  const creator = await prisma.creator.findUnique({ where: { walletAddress: wallet } });
  if (!creator) {
    res.status(404).json(buildActionResponse({
      title: "Creator Not Found",
      description: "This creator wallet does not have a TipChain profile.",
      icon: "",
      label: "Not Found",
      disabled: true,
    }));
    return;
  }

  const displayName = creator.username || creator.walletAddress.slice(0, 8);
  const bio = creator.bio || `Support ${displayName} on TipChain`;

  const metadata: ActionMetadata = {
    title: `Tip @${displayName}`,
    description: bio,
    icon: "",
    label: "Send Tip",
    links: {
      actions: [
        {
          label: "Send 0.1 SOL",
          href: `/api/actions/creator/${wallet}/tip?amount=0.1`,
        },
        {
          label: "Send 0.5 SOL",
          href: `/api/actions/creator/${wallet}/tip?amount=0.5`,
        },
        {
          label: "Send 1 SOL",
          href: `/api/actions/creator/${wallet}/tip?amount=1`,
        },
        {
          label: "Custom Tip",
          href: `/api/actions/creator/${wallet}/tip?amount={amount}`,
          parameters: [
            { name: "amount", label: "Amount in SOL", required: true },
          ],
        },
      ],
    },
  };

  res.json(buildActionResponse(metadata));
});

/**
 * POST /api/actions/creator/:wallet/tip
 * Processes a tip action and returns confirmation.
 */
export const postTipAction = asyncHandler(async (req: Request, res: Response) => {
  const wallet = String(req.params.wallet);
  const amount = Number(req.query.amount || req.body.amount || 0);

  if (amount <= 0) {
    res.status(400).json(buildActionResponse({
      title: "Invalid Amount",
      description: "Please provide a valid tip amount greater than 0.",
      icon: "",
      label: "Invalid",
      disabled: true,
    }));
    return;
  }

  const creator = await prisma.creator.findUnique({ where: { walletAddress: wallet } });
  if (!creator) {
    res.status(404).json(buildActionResponse({
      title: "Creator Not Found",
      description: "This creator does not exist.",
      icon: "",
      label: "Not Found",
      disabled: true,
    }));
    return;
  }

  // Record the transaction (in production, this would verify the on-chain tx)
  await prisma.transaction.create({
    data: {
      senderWallet: req.body.account || "blink-tip",
      receiverWallet: wallet,
      amount: BigInt(Math.floor(amount * 1e9)),
      token: "SOL",
      txHash: req.body.signature || null,
      message: req.body.message || `Tip via Solana Blink`,
    },
  });

  // Update creator stats
  await prisma.creator.update({
    where: { walletAddress: wallet },
    data: {
      totalTips: { increment: BigInt(Math.floor(amount * 1e9)) },
    },
  });

  logger.info("Blink tip action", { creator: wallet, amount });

  res.json({
    transaction: "confirmed",
    message: `You sent ${amount} SOL to @${creator.username || wallet.slice(0, 8)}!`,
  });
});

// ─── Membership Subscribe Action ────────────────────────────────────────────

/**
 * GET /api/actions/membership/:creatorWallet/:tierId
 * Returns metadata for subscribing to a membership tier.
 */
export const getMembershipAction = asyncHandler(async (req: Request, res: Response) => {
  const creatorWallet = String(req.params.creatorWallet);
  const tierId = String(req.params.tierId);

  const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
  if (!creator) {
    res.status(404).json(buildActionResponse({
      title: "Creator Not Found",
      description: "This creator does not exist.",
      icon: "",
      label: "Not Found",
      disabled: true,
    }));
    return;
  }

  const tiers = await membershipService.getTiers(creatorWallet);
  const tier = tiers.find((t: any) => t.id === tierId);

  if (!tier) {
    res.status(404).json(buildActionResponse({
      title: "Tier Not Found",
      description: "This membership tier does not exist.",
      icon: "",
      label: "Not Found",
      disabled: true,
    }));
    return;
  }

  const priceInSol = (Number(tier.priceSol) / 1e9).toFixed(2);

  const metadata: ActionMetadata = {
    title: `Join ${tier.name}`,
    description: `${tier.description || `Subscribe to ${tier.name} on TipChain`} — ${priceInSol} SOL/month. Benefits: ${(tier.benefits || []).join(", ")}`,
    icon: "",
    label: `Subscribe ${priceInSol} SOL`,
    links: {
      actions: [
        {
          label: `Subscribe ${priceInSol} SOL`,
          href: `/api/actions/membership/${creatorWallet}/${tierId}/subscribe`,
        },
      ],
    },
  };

  res.json(buildActionResponse(metadata));
});

/**
 * POST /api/actions/membership/:creatorWallet/:tierId/subscribe
 * Processes a membership subscription via blink.
 */
export const postMembershipAction = asyncHandler(async (req: Request, res: Response) => {
  const creatorWallet = String(req.params.creatorWallet);
  const tierId = String(req.params.tierId);
  const account = req.body.account as string;

  if (!account) {
    res.status(400).json(buildActionResponse({
      title: "Wallet Required",
      description: "Your wallet address is required to subscribe.",
      icon: "",
      label: "Error",
      disabled: true,
    }));
    return;
  }

  // Subscribe the user
  const subscription = await membershipService.subscribe(tierId, account);

  logger.info("Blink membership subscription", { tier: tierId, supporter: account });

  res.json({
    transaction: "confirmed",
    message: `Successfully subscribed! Welcome to the community.`,
    subscription: {
      id: subscription.id,
      status: subscription.status,
      startedAt: subscription.startedAt,
    },
  });
});

// ─── Donate/Support Action ──────────────────────────────────────────────────

/**
 * GET /api/actions/donate
 * General donate action for the TipChain platform.
 */
export const getDonateAction = asyncHandler(async (_req: Request, res: Response) => {
  const metadata: ActionMetadata = {
    title: "Support TipChain",
    description: "Donate to support the development of TipChain, the Solana creator monetization platform.",
    icon: "",
    label: "Donate",
    links: {
      actions: [
        {
          label: "Donate 0.1 SOL",
          href: "/api/actions/donate?amount=0.1",
        },
        {
          label: "Donate 0.5 SOL",
          href: "/api/actions/donate?amount=0.5",
        },
        {
          label: "Donate 1 SOL",
          href: "/api/actions/donate?amount=1",
        },
        {
          label: "Custom Amount",
          href: "/api/actions/donate?amount={amount}",
          parameters: [
            { name: "amount", label: "Amount in SOL", required: true },
          ],
        },
      ],
    },
  };

  res.json(buildActionResponse(metadata));
});

/**
 * POST /api/actions/donate
 * Processes a donation via blink.
 */
export const postDonateAction = asyncHandler(async (req: Request, res: Response) => {
  const amount = Number(req.query.amount || req.body.amount || 0);

  if (amount <= 0) {
    res.status(400).json(buildActionResponse({
      title: "Invalid Amount",
      description: "Please provide a valid donation amount.",
      icon: "",
      label: "Invalid",
      disabled: true,
    }));
    return;
  }

  // Platform wallet — in production, this would be a configurable treasury address
  const platformWallet = process.env.PLATFORM_WALLET || "TipChain";

  await prisma.transaction.create({
    data: {
      senderWallet: req.body.account || "blink-donor",
      receiverWallet: platformWallet,
      amount: BigInt(Math.floor(amount * 1e9)),
      token: "SOL",
      txHash: req.body.signature || null,
      message: req.body.message || "Donation via TipChain Blink",
    },
  });

  logger.info("Blink donation", { amount, donor: req.body.account });

  res.json({
    transaction: "confirmed",
    message: `Thank you for your donation of ${amount} SOL!`,
  });
});
