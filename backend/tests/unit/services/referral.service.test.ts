import { describe, it, expect, vi, beforeEach } from "vitest";
import { referralService } from "../../../src/services/referral.service";

vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    creator: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../../../src/utils/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from "../../../src/lib/prisma";
import { NotFoundError } from "../../../src/middleware/error.middleware";

const mockCreator = {
  walletAddress: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd",
  username: "shivam",
  socialLinks: "{}",
};

describe("ReferralService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getReferralStats", () => {
    it("should return referral stats for a creator", async () => {
      const creatorWithCodes = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _referrals: [{ code: "SHIV-ABC123", creatorWallet: mockCreator.walletAddress, useCount: 3 }],
          _referral_uses: [
            { code: "SHIV-ABC123", wallet: "user1", usedAt: new Date().toISOString() },
            { code: "SHIV-ABC123", wallet: "user2", usedAt: new Date().toISOString() },
          ],
        }),
      };
      (prisma.creator.findUnique as any).mockResolvedValue(creatorWithCodes);

      const stats = await referralService.getReferralStats(mockCreator.walletAddress);

      expect(stats.wallet).toBe(mockCreator.walletAddress);
      expect(stats.codes).toHaveLength(1);
      expect(stats.totalUses).toBe(2);
      expect(stats.uses).toHaveLength(2);
    });

    it("should return empty stats for creator with no codes", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);

      const stats = await referralService.getReferralStats(mockCreator.walletAddress);

      expect(stats.codes).toEqual([]);
      expect(stats.totalUses).toBe(0);
    });

    it("should throw NotFoundError for non-existing creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      await expect(
        referralService.getReferralStats("nonexistent")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("createReferralCode", () => {
    it("should create a referral code with PREFIX-XXXXXX format", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const result = await referralService.createReferralCode(mockCreator.walletAddress);

      expect(result.code).toMatch(/^SHIV-[A-F0-9]{6}$/);
      expect(result.creatorWallet).toBe(mockCreator.walletAddress);
      expect(result.useCount).toBe(0);
    });

    it("should throw NotFoundError for non-existing creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      await expect(
        referralService.createReferralCode("nonexistent")
      ).rejects.toThrow(NotFoundError);
    });

    it("should store the referral code in creator metadata", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      await referralService.createReferralCode(mockCreator.walletAddress);

      expect(prisma.creator.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { walletAddress: mockCreator.walletAddress },
        })
      );
    });
  });

  describe("trackReferralCode", () => {
    it("should track usage of a valid referral code", async () => {
      const creatorWithCode = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _referrals: [{ code: "SHIV-TEST01", creatorWallet: mockCreator.walletAddress, useCount: 0 }],
          _referral_uses: [],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorWithCode]);
      (prisma.creator.update as any).mockResolvedValue(creatorWithCode);

      const result = await referralService.trackReferralCode("SHIV-TEST01", "new-user-wallet");

      expect(result).not.toBeNull();
      expect(result?.code).toBe("SHIV-TEST01");
      expect(result?.useCount).toBe(1);
    });

    it("should track usage without a wallet reference", async () => {
      const creatorWithCode = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _referrals: [{ code: "SHIV-TEST02", creatorWallet: mockCreator.walletAddress, useCount: 0 }],
          _referral_uses: [],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorWithCode]);
      (prisma.creator.update as any).mockResolvedValue(creatorWithCode);

      const result = await referralService.trackReferralCode("SHIV-TEST02");

      expect(result?.useCount).toBe(1);
    });

    it("should throw NotFoundError for invalid referral code", async () => {
      (prisma.creator.findMany as any).mockResolvedValue([mockCreator]);

      await expect(
        referralService.trackReferralCode("INVALID-CODE")
      ).rejects.toThrow(NotFoundError);
    });

    it("should increment use count on multiple uses", async () => {
      const creatorWithCode = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _referrals: [{ code: "SHIV-MULTI", creatorWallet: mockCreator.walletAddress, useCount: 2 }],
          _referral_uses: [
            { code: "SHIV-MULTI", wallet: "user1", usedAt: new Date().toISOString() },
            { code: "SHIV-MULTI", wallet: "user2", usedAt: new Date().toISOString() },
          ],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorWithCode]);
      (prisma.creator.update as any).mockResolvedValue(creatorWithCode);

      const result = await referralService.trackReferralCode("SHIV-MULTI", "user3");

      expect(result?.useCount).toBe(3);
    });
  });
});
