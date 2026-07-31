import { prisma } from "../lib/prisma";
import { NotFoundError, ConflictError } from "../middleware/error.middleware";
import logger from "../utils/logger";
import { eventBus } from "./eventBus.service";

const BADGES_KEY = "_badges";
const AWARDS_KEY = "_awards";

export interface BadgeDef {
  slug: string;
  name: string;
  description: string;
  tier: number;
  imageUrl?: string;
  requirement?: string;
  threshold?: string;
  isSoulbound: boolean;
  isLimited: boolean;
}

export interface BadgeAward {
  badgeSlug: string;
  walletAddress: string;
  awardedAt: string;
  mintAddress?: string;
  metadataUri?: string;
}

const DEFAULT_BADGES: BadgeDef[] = [
  { slug: "early-supporter", name: "Early Supporter", description: "One of the first supporters on TipChain", tier: 1, isSoulbound: true, isLimited: true },
  { slug: "bronze-tipper", name: "Bronze Tipper", description: "Sent 10+ tips", tier: 1, isSoulbound: false, isLimited: false, requirement: "tip_count", threshold: "10" },
  { slug: "silver-tipper", name: "Silver Tipper", description: "Sent 50+ tips", tier: 2, isSoulbound: false, isLimited: false, requirement: "tip_count", threshold: "50" },
  { slug: "gold-tipper", name: "Gold Tipper", description: "Sent 100+ tips", tier: 3, isSoulbound: false, isLimited: false, requirement: "tip_count", threshold: "100" },
  { slug: "creator-premier", name: "Premier Creator", description: "Earned 100+ SOL in tips", tier: 3, isSoulbound: false, isLimited: false, requirement: "earnings", threshold: "100000000000" },
  { slug: "verified-creator", name: "Verified Creator", description: "Verified creator on TipChain", tier: 2, isSoulbound: true, isLimited: false },
  { slug: "diamond-supporter", name: "Diamond Supporter", description: "Supported 10+ different creators", tier: 4, isSoulbound: false, isLimited: false, requirement: "creators_supported", threshold: "10" },
];

class BadgeService {
  private getStoredData(creator: any) {
    try {
      const links = JSON.parse(creator.socialLinks || "{}");
      return {
        badges: Array.isArray(links[BADGES_KEY]) ? links[BADGES_KEY] : [],
        awards: Array.isArray(links[AWARDS_KEY]) ? links[AWARDS_KEY] : [],
      };
    } catch {
      return { badges: [], awards: [] };
    }
  }

  private async saveData(wallet: string, data: { badges?: any[]; awards?: any[] }) {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: wallet } });
    if (!creator) throw new NotFoundError("Creator");

    const existing = this.getStoredData(creator);
    const merged = {
      [BADGES_KEY]: data.badges ?? existing.badges,
      [AWARDS_KEY]: data.awards ?? existing.awards,
    };

    const links = JSON.parse(creator.socialLinks || "{}");
    Object.assign(links, merged);
    await prisma.creator.update({
      where: { walletAddress: wallet },
      data: { socialLinks: JSON.stringify(links) },
    });
  }

  async getAllBadges(): Promise<BadgeDef[]> {
    return DEFAULT_BADGES;
  }

  async getSupporterBadges(walletAddress: string): Promise<BadgeAward[]> {
    const creators = await prisma.creator.findMany();
    const awards: BadgeAward[] = [];

    for (const creator of creators) {
      const data = this.getStoredData(creator);
      const userAwards = data.awards.filter((a: BadgeAward) => a.walletAddress === walletAddress);
      awards.push(...userAwards);
    }

    return awards;
  }

  async awardBadge(data: {
    badgeSlug: string;
    walletAddress: string;
    creatorWallet?: string;
    mintAddress?: string;
    metadataUri?: string;
  }): Promise<BadgeAward> {
    const badge = DEFAULT_BADGES.find((b) => b.slug === data.badgeSlug);
    if (!badge) throw new NotFoundError("Badge");

    // Store award in the target wallet's creator profile (or first available creator)
    const targetWallet = data.creatorWallet || data.walletAddress;
    const creator = await prisma.creator.findUnique({ where: { walletAddress: targetWallet } });
    if (!creator) throw new NotFoundError("Creator");

    const stored = this.getStoredData(creator);
    const existingAward = stored.awards.find(
      (a: BadgeAward) => a.badgeSlug === data.badgeSlug && a.walletAddress === data.walletAddress
    );
    if (existingAward) throw new ConflictError("Badge already awarded to this user");

    const award: BadgeAward = {
      badgeSlug: data.badgeSlug,
      walletAddress: data.walletAddress,
      awardedAt: new Date().toISOString(),
      mintAddress: data.mintAddress,
      metadataUri: data.metadataUri,
    };

    stored.awards.push(award);
    await this.saveData(targetWallet, { awards: stored.awards });

    logger.info("Badge awarded", { badge: data.badgeSlug, wallet: data.walletAddress });

    // Notify the n8n automation workflow (fire-and-forget)
    void eventBus.emit("badge.awarded", {
      badgeSlug: data.badgeSlug,
      badgeName: badge.name,
      wallet: data.walletAddress,
      mintAddress: data.mintAddress ?? null,
    });

    return award;
  }
}

export const badgeService = new BadgeService();
