import { prisma } from "../lib/prisma";
import logger from "../utils/logger";
import { AppError, NotFoundError, ConflictError } from "../middleware/error.middleware";
import { verifyTokenHolding } from "./tokenVerification.service";
import { eventBus } from "./eventBus.service";

export interface MembershipTier {
  id: string;
  creatorWallet: string;
  name: string;
  description: string;
  priceSol: string; // in lamports
  priceUsd: number;
  benefits: string[];
  color: string;
  maxSubscribers: number | null;
  isActive: boolean;
  subscriberCount: number;
  createdAt: string;
  // Token-gating fields
  requiredToken?: string | null;  // Mint address of required token, e.g. "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" for USDC
  requiredTokenAmount?: string | null; // Minimum amount required (in token decimals)
  requiredTokenSymbol?: string | null; // Display symbol, e.g. "USDC", "BONK"
}

export interface Subscription {
  id: string;
  tierId: string;
  supporterWallet: string;
  creatorWallet: string;
  status: "active" | "cancelled" | "expired";
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
}

const TIERS_KEY = "membership_tiers";
const SUBSCRIPTIONS_KEY = "subscriptions";

class MembershipService {
  /**
   * Get stored metadata from creator
   */
  private getStoredData(creator: any) {
    try {
      const links = JSON.parse(creator.socialLinks || "{}");
      return {
        tiers: Array.isArray(links[TIERS_KEY]) ? links[TIERS_KEY] : [],
        subscriptions: Array.isArray(links[SUBSCRIPTIONS_KEY]) ? links[SUBSCRIPTIONS_KEY] : [],
      };
    } catch {
      return { tiers: [], subscriptions: [] };
    }
  }

  /**
   * Save metadata to creator
   */
  private async saveData(wallet: string, data: { tiers?: any[]; subscriptions?: any[] }) {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: wallet } });
    if (!creator) throw new NotFoundError("Creator");

    const existing = this.getStoredData(creator);
    const merged = {
      [TIERS_KEY]: data.tiers ?? existing.tiers,
      [SUBSCRIPTIONS_KEY]: data.subscriptions ?? existing.subscriptions,
    };

    const links = JSON.parse(creator.socialLinks || "{}");
    Object.assign(links, merged);
    
    await prisma.creator.update({
      where: { walletAddress: wallet },
      data: { socialLinks: JSON.stringify(links) },
    });
  }

  // ─── Tier Management ────────────────────────────────────────────────

  async getTiers(creatorWallet: string): Promise<MembershipTier[]> {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
    if (!creator) throw new NotFoundError("Creator");
    return this.getStoredData(creator).tiers;
  }

  async createTier(data: {
    creatorWallet: string;
    name: string;
    description?: string;
    priceSol: number;
    priceUsd: number;
    benefits?: string[];
    color?: string;
    maxSubscribers?: number;
    requiredToken?: string;
    requiredTokenAmount?: string;
    requiredTokenSymbol?: string;
  }): Promise<MembershipTier> {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: data.creatorWallet } });
    if (!creator) throw new NotFoundError("Creator");

    const stored = this.getStoredData(creator);

    const tier: MembershipTier = {
      id: `tier_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      creatorWallet: data.creatorWallet,
      name: data.name,
      description: data.description || "",
      priceSol: String(Math.floor(data.priceSol * 1e9)),
      priceUsd: data.priceUsd,
      benefits: data.benefits || [],
      color: data.color || "#10b981",
      maxSubscribers: data.maxSubscribers || null,
      isActive: true,
      subscriberCount: 0,
      createdAt: new Date().toISOString(),
      requiredToken: data.requiredToken || null,
      requiredTokenAmount: data.requiredTokenAmount || null,
      requiredTokenSymbol: data.requiredTokenSymbol || null,
    };

    stored.tiers.push(tier);
    await this.saveData(data.creatorWallet, { tiers: stored.tiers });

    logger.info("Membership tier created", { tier: tier.id, creator: data.creatorWallet });
    return tier;
  }

  async updateTier(tierId: string, updates: Partial<MembershipTier>): Promise<MembershipTier> {
    const creators = await prisma.creator.findMany();
    for (const creator of creators) {
      const stored = this.getStoredData(creator);
      const idx = stored.tiers.findIndex((t: MembershipTier) => t.id === tierId);
      if (idx >= 0) {
        stored.tiers[idx] = { ...stored.tiers[idx], ...updates, id: tierId };
        await this.saveData(creator.walletAddress, { tiers: stored.tiers });
        return stored.tiers[idx];
      }
    }
    throw new NotFoundError("Membership tier");
  }

  async deleteTier(tierId: string): Promise<void> {
    const creators = await prisma.creator.findMany();
    for (const creator of creators) {
      const stored = this.getStoredData(creator);
      const idx = stored.tiers.findIndex((t: MembershipTier) => t.id === tierId);
      if (idx >= 0) {
        stored.tiers.splice(idx, 1);
        await this.saveData(creator.walletAddress, { tiers: stored.tiers });
        return;
      }
    }
    throw new NotFoundError("Membership tier");
  }

  // ─── Subscriptions ──────────────────────────────────────────────────

  async getSubscriptions(supporterWallet: string): Promise<Subscription[]> {
    const creators = await prisma.creator.findMany();
    const allSubs: Subscription[] = [];

    for (const creator of creators) {
      const stored = this.getStoredData(creator);
      const userSubs = stored.subscriptions.filter(
        (s: Subscription) => s.supporterWallet === supporterWallet
      );
      allSubs.push(...userSubs);
    }

    return allSubs;
  }

  async subscribe(tierId: string, supporterWallet: string): Promise<Subscription> {
    const creators = await prisma.creator.findMany();
    for (const creator of creators) {
      const stored = this.getStoredData(creator);
      const tier = stored.tiers.find((t: MembershipTier) => t.id === tierId);
      if (tier) {
        // Check for existing active subscription
        const existing = stored.subscriptions.find(
          (s: Subscription) => s.tierId === tierId && s.supporterWallet === supporterWallet && s.status === "active"
        );
        if (existing) throw new ConflictError("Already subscribed to this tier");

        // Check max subscribers
        if (tier.maxSubscribers && tier.subscriberCount >= tier.maxSubscribers) {
          throw new AppError("Tier is full", 400, "TIER_FULL");
        }

        // Check token-gating requirements
        if (tier.requiredToken && tier.requiredTokenAmount) {
          const verification = await verifyTokenHolding(
            supporterWallet,
            tier.requiredToken,
            tier.requiredTokenAmount
          );
          if (!verification.qualified) {
            throw new AppError(
              `This tier requires ${verification.requiredAmount} ${tier.requiredTokenSymbol || "tokens"}. Your wallet only has ${verification.balance}.`,
              403,
              "TOKEN_REQUIREMENT_NOT_MET"
            );
          }
        }

        const subscription: Subscription = {
          id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          tierId,
          supporterWallet,
          creatorWallet: creator.walletAddress,
          status: "active",
          startedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          cancelledAt: null,
        };

        stored.subscriptions.push(subscription);
        tier.subscriberCount++;
        await this.saveData(creator.walletAddress, {
          tiers: stored.tiers,
          subscriptions: stored.subscriptions,
        });

        logger.info("Subscription created", { tier: tierId, supporter: supporterWallet });

        // Notify the n8n automation workflow (fire-and-forget)
        void eventBus.emit("membership.activated", {
          supporter: supporterWallet,
          creator: creator.walletAddress,
          tierId,
          tierName: tier.name,
          priceSol: tier.priceSol,
          expiresAt: subscription.expiresAt,
        });

        return subscription;
      }
    }
    throw new NotFoundError("Membership tier");
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const creators = await prisma.creator.findMany();
    for (const creator of creators) {
      const stored = this.getStoredData(creator);
      const sub = stored.subscriptions.find((s: Subscription) => s.id === subscriptionId);
      if (sub) {
        sub.status = "cancelled";
        sub.cancelledAt = new Date().toISOString();

        // Decrement subscriber count
        const tier = stored.tiers.find((t: MembershipTier) => t.id === sub.tierId);
        if (tier && tier.subscriberCount > 0) tier.subscriberCount--;

        await this.saveData(creator.walletAddress, {
          tiers: stored.tiers,
          subscriptions: stored.subscriptions,
        });
        return;
      }
    }
    throw new NotFoundError("Subscription");
  }

  async getCreatorSubscribers(creatorWallet: string): Promise<{ tier: MembershipTier; subscriptions: Subscription[] }[]> {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
    if (!creator) throw new NotFoundError("Creator");

    const stored = this.getStoredData(creator);
    return stored.tiers.map((tier: MembershipTier) => ({
      tier,
      subscriptions: stored.subscriptions.filter(
        (s: Subscription) => s.tierId === tier.id
      ),
    }));
  }
}

export const membershipService = new MembershipService();
