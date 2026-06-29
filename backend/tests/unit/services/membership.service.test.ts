import { describe, it, expect, vi, beforeEach } from "vitest";
import { membershipService } from "../../../src/services/membership.service";

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
  bio: "A creator",
};

describe("MembershipService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTiers", () => {
    it("should return tiers for a creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);

      const tiers = await membershipService.getTiers(mockCreator.walletAddress);

      expect(tiers).toEqual([]);
      expect(prisma.creator.findUnique).toHaveBeenCalledWith({
        where: { walletAddress: mockCreator.walletAddress },
      });
    });

    it("should throw NotFoundError for non-existing creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      await expect(
        membershipService.getTiers("nonexistent")
      ).rejects.toThrow(NotFoundError);
    });

    it("should parse existing tiers from socialLinks", async () => {
      const existingTiers = [
        { id: "tier_1", name: "Gold", creatorWallet: mockCreator.walletAddress, priceSol: "1000000000", priceUsd: 10 },
      ];
      (prisma.creator.findUnique as any).mockResolvedValue({
        ...mockCreator,
        socialLinks: JSON.stringify({ membership_tiers: existingTiers }),
      });

      const tiers = await membershipService.getTiers(mockCreator.walletAddress);

      expect(tiers).toHaveLength(1);
      expect(tiers[0].name).toBe("Gold");
    });
  });

  describe("createTier", () => {
    it("should create a new membership tier", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const tier = await membershipService.createTier({
        creatorWallet: mockCreator.walletAddress,
        name: "Gold Tier",
        description: "Premium support",
        priceSol: 1,
        priceUsd: 10,
        benefits: ["Early access", "Shoutout"],
      });

      expect(tier.name).toBe("Gold Tier");
      expect(tier.priceSol).toBe("1000000000");
      expect(tier.priceUsd).toBe(10);
      expect(tier.benefits).toEqual(["Early access", "Shoutout"]);
      expect(tier.subscriberCount).toBe(0);
      expect(tier.isActive).toBe(true);
      expect(tier.id).toContain("tier_");
      expect(prisma.creator.update).toHaveBeenCalled();
    });

    it("should throw NotFoundError for non-existing creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      await expect(
        membershipService.createTier({
          creatorWallet: "nonexistent",
          name: "Test",
          priceSol: 1,
          priceUsd: 10,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should apply defaults for optional fields", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const tier = await membershipService.createTier({
        creatorWallet: mockCreator.walletAddress,
        name: "Basic",
        priceSol: 0.5,
        priceUsd: 5,
      });

      expect(tier.description).toBe("");
      expect(tier.benefits).toEqual([]);
      expect(tier.color).toBe("#10b981");
      expect(tier.maxSubscribers).toBeNull();
    });
  });

  describe("updateTier", () => {
    it("should update an existing tier", async () => {
      const tierId = "tier_abc123";
      const creatorWithTier = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          membership_tiers: [{ id: tierId, name: "Old Name", creatorWallet: mockCreator.walletAddress, priceSol: "1000000000", priceUsd: 10, benefits: [], color: "#000", maxSubscribers: null, isActive: true, subscriberCount: 0, createdAt: new Date().toISOString() }],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorWithTier]);
      (prisma.creator.update as any).mockResolvedValue(creatorWithTier);

      const updated = await membershipService.updateTier(tierId, { name: "New Name" });

      expect(updated.name).toBe("New Name");
    });

    it("should throw NotFoundError for non-existing tier", async () => {
      (prisma.creator.findMany as any).mockResolvedValue([mockCreator]);

      await expect(
        membershipService.updateTier("nonexistent", { name: "Test" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteTier", () => {
    it("should delete an existing tier", async () => {
      const tierId = "tier_abc";
      const creatorWithTier = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          membership_tiers: [{ id: tierId, name: "Test" }],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorWithTier]);
      (prisma.creator.update as any).mockResolvedValue(creatorWithTier);

      await membershipService.deleteTier(tierId);

      expect(prisma.creator.update).toHaveBeenCalled();
    });

    it("should throw NotFoundError for non-existing tier", async () => {
      (prisma.creator.findMany as any).mockResolvedValue([mockCreator]);

      await expect(membershipService.deleteTier("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("subscribe", () => {
    it("should create a subscription for an existing tier", async () => {
      const tierId = "tier_abc";
      const creatorWithTier = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          membership_tiers: [{ id: tierId, name: "Gold", creatorWallet: mockCreator.walletAddress, priceSol: "1000000000", priceUsd: 10, benefits: [], color: "#10b981", maxSubscribers: null, isActive: true, subscriberCount: 0, createdAt: new Date().toISOString() }],
          subscriptions: [],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorWithTier]);
      (prisma.creator.update as any).mockResolvedValue(creatorWithTier);

      const sub = await membershipService.subscribe(tierId, "supporter-wallet");

      expect(sub.status).toBe("active");
      expect(sub.tierId).toBe(tierId);
      expect(sub.supporterWallet).toBe("supporter-wallet");
      expect(sub.creatorWallet).toBe(mockCreator.walletAddress);
      expect(sub.expiresAt).not.toBeNull();
    });

    it("should throw ConflictError for duplicate subscription", async () => {
      const tierId = "tier_abc";
      const creatorWithSub = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          membership_tiers: [{ id: tierId, name: "Gold", creatorWallet: mockCreator.walletAddress, priceSol: "1000000000", priceUsd: 10, benefits: [], color: "#10b981", maxSubscribers: null, isActive: true, subscriberCount: 1, createdAt: new Date().toISOString() }],
          subscriptions: [{ id: "sub_1", tierId, supporterWallet: "supporter-wallet", creatorWallet: mockCreator.walletAddress, status: "active" }],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorWithSub]);

      await expect(
        membershipService.subscribe(tierId, "supporter-wallet")
      ).rejects.toThrow(ConflictError);
    });

    it("should throw AppError when tier is full", async () => {
      const tierId = "tier_full";
      const creatorFull = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          membership_tiers: [{ id: tierId, name: "Limited", creatorWallet: mockCreator.walletAddress, priceSol: "1000000000", priceUsd: 10, benefits: [], color: "#10b981", maxSubscribers: 1, isActive: true, subscriberCount: 1, createdAt: new Date().toISOString() }],
          subscriptions: [{ id: "sub_1", tierId, supporterWallet: "other-wallet", creatorWallet: mockCreator.walletAddress, status: "active" }],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorFull]);

      await expect(
        membershipService.subscribe(tierId, "new-supporter")
      ).rejects.toThrow("Tier is full");
    });

    it("should throw NotFoundError for non-existing tier", async () => {
      (prisma.creator.findMany as any).mockResolvedValue([mockCreator]);

      await expect(
        membershipService.subscribe("nonexistent", "wallet")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("cancelSubscription", () => {
    it("should cancel an active subscription", async () => {
      const subId = "sub_abc";
      const tierId = "tier_abc";
      const creatorWithSub = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          membership_tiers: [{ id: tierId, name: "Gold", creatorWallet: mockCreator.walletAddress, priceSol: "1000000000", priceUsd: 10, benefits: [], color: "#10b981", maxSubscribers: null, isActive: true, subscriberCount: 1, createdAt: new Date().toISOString() }],
          subscriptions: [{ id: subId, tierId, supporterWallet: "wallet", creatorWallet: mockCreator.walletAddress, status: "active" }],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorWithSub]);
      (prisma.creator.update as any).mockResolvedValue(creatorWithSub);

      await membershipService.cancelSubscription(subId);

      expect(prisma.creator.update).toHaveBeenCalled();
    });

    it("should throw NotFoundError for non-existing subscription", async () => {
      (prisma.creator.findMany as any).mockResolvedValue([mockCreator]);

      await expect(membershipService.cancelSubscription("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getSubscriptions", () => {
    it("should return subscriptions for a wallet", async () => {
      const wallet = "supporter-wallet";
      const creatorWithSub = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          subscriptions: [{ id: "sub_1", tierId: "tier_1", supporterWallet: wallet, creatorWallet: mockCreator.walletAddress, status: "active" }],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorWithSub]);

      const subs = await membershipService.getSubscriptions(wallet);

      expect(subs).toHaveLength(1);
      expect(subs[0].supporterWallet).toBe(wallet);
    });

    it("should return empty array when no subscriptions exist", async () => {
      (prisma.creator.findMany as any).mockResolvedValue([mockCreator]);

      const subs = await membershipService.getSubscriptions("any-wallet");

      expect(subs).toEqual([]);
    });
  });

  describe("getCreatorSubscribers", () => {
    it("should return tier and subscription data for a creator", async () => {
      const tierId = "tier_1";
      const creatorWithData = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          membership_tiers: [{ id: tierId, name: "Gold", creatorWallet: mockCreator.walletAddress, priceSol: "1000000000", priceUsd: 10, benefits: [], color: "#10b981", maxSubscribers: null, isActive: true, subscriberCount: 0, createdAt: new Date().toISOString() }],
          subscriptions: [{ id: "sub_1", tierId, supporterWallet: "wallet", creatorWallet: mockCreator.walletAddress, status: "active" }],
        }),
      };
      (prisma.creator.findUnique as any).mockResolvedValue(creatorWithData);

      const result = await membershipService.getCreatorSubscribers(mockCreator.walletAddress);

      expect(result).toHaveLength(1);
      expect(result[0].tier.name).toBe("Gold");
      expect(result[0].subscriptions).toHaveLength(1);
    });

    it("should throw NotFoundError for non-existing creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      await expect(
        membershipService.getCreatorSubscribers("nonexistent")
      ).rejects.toThrow(NotFoundError);
    });
  });
});
