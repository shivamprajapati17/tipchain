import { prisma } from "../lib/prisma";
import { NotFoundError } from "../middleware/error.middleware";
import { generateReferralCode } from "../utils/crypto";
import logger from "../utils/logger";

const REFERRALS_KEY = "_referrals";
const USES_KEY = "_referral_uses";

// Commission paid to the referrer as a % of the referred wallet's tips
const COMMISSION_RATE = 0.1; // 10%

interface ReferralCode {
  code: string;
  creatorWallet: string;
  createdAt: string;
  useCount: number;
}

interface ReferralUse {
  code: string;
  wallet?: string;
  usedAt: string;
}

class ReferralService {
  private getStoredData(creator: any) {
    try {
      const links = JSON.parse(creator.socialLinks || "{}");
      return {
        codes: Array.isArray(links[REFERRALS_KEY]) ? links[REFERRALS_KEY] : [],
        uses: Array.isArray(links[USES_KEY]) ? links[USES_KEY] : [],
      };
    } catch {
      return { codes: [], uses: [] };
    }
  }

  private async saveData(wallet: string, data: { codes?: any[]; uses?: any[] }) {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: wallet } });
    if (!creator) throw new NotFoundError("Creator");

    const existing = this.getStoredData(creator);
    const merged = {
      [REFERRALS_KEY]: data.codes ?? existing.codes,
      [USES_KEY]: data.uses ?? existing.uses,
    };

    const links = JSON.parse(creator.socialLinks || "{}");
    Object.assign(links, merged);
    await prisma.creator.update({
      where: { walletAddress: wallet },
      data: { socialLinks: JSON.stringify(links) },
    });
  }

  async getReferralStats(wallet: string) {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: wallet } });
    if (!creator) throw new NotFoundError("Creator");

    const data = this.getStoredData(creator);

    // Enrich each use with the referred wallet's tip total + computed commission
    const referredWallets = data.uses
      .map((u: ReferralUse) => u.wallet)
      .filter((w: string | undefined): w is string => Boolean(w));

    const tipTotals = new Map<string, bigint>();
    const tipCounts = new Map<string, number>();
    if (referredWallets.length > 0) {
      const txs = await prisma.transaction.findMany({
        where: { senderWallet: { in: referredWallets } },
        select: { senderWallet: true, amount: true },
      });
      for (const tx of txs) {
        tipTotals.set(tx.senderWallet, (tipTotals.get(tx.senderWallet) ?? BigInt(0)) + tx.amount);
        tipCounts.set(tx.senderWallet, (tipCounts.get(tx.senderWallet) ?? 0) + 1);
      }
    }

    const totalReferredTips = [...tipTotals.values()].reduce((a, b) => a + b, BigInt(0));
    const totalCommission = (totalReferredTips * BigInt(Math.round(COMMISSION_RATE * 100))) / BigInt(100);

    const enrichedUses = data.uses.map((u: ReferralUse) => ({
      code: u.code,
      wallet: u.wallet ?? null,
      usedAt: u.usedAt,
      tipped: u.wallet ? (tipTotals.get(u.wallet) ?? BigInt(0)).toString() : "0",
      tipCount: u.wallet ? (tipCounts.get(u.wallet) ?? 0) : 0,
      commission:
        u.wallet && tipTotals.has(u.wallet)
          ? ((tipTotals.get(u.wallet)! * BigInt(Math.round(COMMISSION_RATE * 100))) / BigInt(100)).toString()
          : "0",
    }));

    return {
      wallet,
      codes: data.codes,
      totalUses: data.uses.length,
      uses: enrichedUses,
      commissionRate: COMMISSION_RATE,
      totalReferredTips: totalReferredTips.toString(),
      totalCommission: totalCommission.toString(),
    };
  }

  async createReferralCode(creatorWallet: string): Promise<ReferralCode> {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
    if (!creator) throw new NotFoundError("Creator");

    const data = this.getStoredData(creator);
    const code = generateReferralCode(creator.username);

    const referral: ReferralCode = {
      code,
      creatorWallet,
      createdAt: new Date().toISOString(),
      useCount: 0,
    };

    data.codes.push(referral);
    await this.saveData(creatorWallet, { codes: data.codes });

    logger.info("Referral code created", { code, creator: creatorWallet });
    return referral;
  }

  async trackReferralCode(code: string, wallet?: string): Promise<ReferralCode | null> {
    const creators = await prisma.creator.findMany();

    for (const creator of creators) {
      const data = this.getStoredData(creator);
      const referral = data.codes.find((r: ReferralCode) => r.code === code);
      if (referral) {
        const use: ReferralUse = {
          code,
          wallet,
          usedAt: new Date().toISOString(),
        };
        data.uses.push(use);
        referral.useCount++;
        await this.saveData(creator.walletAddress, { codes: data.codes, uses: data.uses });
        logger.info("Referral code used", { code, by: wallet });
        return referral;
      }
    }

    throw new NotFoundError("Referral code");
  }
}

export const referralService = new ReferralService();
