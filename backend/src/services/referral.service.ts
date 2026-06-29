import { prisma } from "../lib/prisma";
import { NotFoundError } from "../middleware/error.middleware";
import { generateReferralCode } from "../utils/crypto";
import logger from "../utils/logger";

const REFERRALS_KEY = "_referrals";
const USES_KEY = "_referral_uses";

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
    return {
      wallet,
      codes: data.codes,
      totalUses: data.uses.length,
      uses: data.uses,
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
