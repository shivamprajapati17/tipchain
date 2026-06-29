import { describe, it, expect, vi, beforeEach } from "vitest";
import { badgeService } from "../../../src/services/badge.service";

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
import { NotFoundError, ConflictError } from "../../../src/middleware/error.middleware";

const mockCreator = {
  walletAddress: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd",
  username: "shivam",
  socialLinks: "{}",
};

describe("BadgeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllBadges", () => {
    it("should return all default badge definitions", async () => {
      const badges = await badgeService.getAllBadges();

      const slugs = badges.map((b) => b.slug);
      expect(slugs).toContain("early-supporter");
      expect(slugs).toContain("bronze-tipper");
      expect(slugs).toContain("silver-tipper");
      expect(slugs).toContain("gold-tipper");
      expect(slugs).toContain("creator-premier");
      expect(slugs).toContain("verified-creator");
      expect(slugs).toContain("diamond-supporter");
    });

    it("should include soulbound and limited flags", async () => {
      const badges = await badgeService.getAllBadges();

      const earlySupporter = badges.find((b) => b.slug === "early-supporter");
      expect(earlySupporter?.isSoulbound).toBe(true);
      expect(earlySupporter?.isLimited).toBe(true);

      const bronzeTipper = badges.find((b) => b.slug === "bronze-tipper");
      expect(bronzeTipper?.isSoulbound).toBe(false);
      expect(bronzeTipper?.isLimited).toBe(false);
    });

    it("should include requirement thresholds for progress badges", async () => {
      const badges = await badgeService.getAllBadges();

      const goldTipper = badges.find((b) => b.slug === "gold-tipper");
      expect(goldTipper?.requirement).toBe("tip_count");
      expect(goldTipper?.threshold).toBe("100");
    });
  });

  describe("getSupporterBadges", () => {
    it("should return badges awarded to a wallet", async () => {
      const creatorWithAwards = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _awards: [
            { badgeSlug: "early-supporter", walletAddress: "user-wallet", awardedAt: new Date().toISOString() },
            { badgeSlug: "bronze-tipper", walletAddress: "user-wallet", awardedAt: new Date().toISOString() },
          ],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorWithAwards]);

      const awards = await badgeService.getSupporterBadges("user-wallet");

      expect(awards).toHaveLength(2);
      expect(awards[0].badgeSlug).toBe("early-supporter");
      expect(awards[1].badgeSlug).toBe("bronze-tipper");
    });

    it("should return empty for wallet with no badges", async () => {
      (prisma.creator.findMany as any).mockResolvedValue([mockCreator]);

      const awards = await badgeService.getSupporterBadges("user-wallet");

      expect(awards).toEqual([]);
    });

    it("should not return badges awarded to other wallets", async () => {
      const creatorWithAwards = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _awards: [
            { badgeSlug: "gold-tipper", walletAddress: "other-user", awardedAt: new Date().toISOString() },
          ],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorWithAwards]);

      const awards = await badgeService.getSupporterBadges("my-wallet");

      expect(awards).toEqual([]);
    });
  });

  describe("awardBadge", () => {
    it("should award a badge to a wallet", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const award = await badgeService.awardBadge({
        badgeSlug: "early-supporter",
        walletAddress: "user-wallet",
        creatorWallet: mockCreator.walletAddress,
      });

      expect(award.badgeSlug).toBe("early-supporter");
      expect(award.walletAddress).toBe("user-wallet");
      expect(award.awardedAt).toBeDefined();
    });

    it("should throw NotFoundError for non-existing badge slug", async () => {
      await expect(
        badgeService.awardBadge({
          badgeSlug: "nonexistent-badge",
          walletAddress: "wallet",
          creatorWallet: mockCreator.walletAddress,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError for non-existing creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      await expect(
        badgeService.awardBadge({
          badgeSlug: "early-supporter",
          walletAddress: "wallet",
          creatorWallet: "nonexistent",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ConflictError for duplicate badge award", async () => {
      const creatorWithAward = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _awards: [
            { badgeSlug: "early-supporter", walletAddress: "user-wallet", awardedAt: new Date().toISOString() },
          ],
        }),
      };
      (prisma.creator.findUnique as any).mockResolvedValue(creatorWithAward);

      await expect(
        badgeService.awardBadge({
          badgeSlug: "early-supporter",
          walletAddress: "user-wallet",
          creatorWallet: mockCreator.walletAddress,
        })
      ).rejects.toThrow(ConflictError);
    });

    it("should create award with optional mint address and metadata URI", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const award = await badgeService.awardBadge({
        badgeSlug: "verified-creator",
        walletAddress: "creator-wallet",
        creatorWallet: mockCreator.walletAddress,
        mintAddress: "mint-addr-123",
        metadataUri: "https://arweave.net/metadata.json",
      });

      expect(award.mintAddress).toBe("mint-addr-123");
      expect(award.metadataUri).toBe("https://arweave.net/metadata.json");
    });
  });
});
