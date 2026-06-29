import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreatorService } from "../../../src/services/creator.service";

// Mock all external dependencies
vi.mock("../../../src/repositories/creator.repository", () => ({
  creatorRepository: {
    findByWallet: vi.fn(),
    findByUsername: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
    getMyDashboard: vi.fn(),
    getTrending: vi.fn(),
  },
}));

vi.mock("../../../src/repositories/user.repository", () => ({
  userRepository: {
    upsert: vi.fn(),
  },
}));

vi.mock("../../../src/lib/redis", () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDelPattern: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    follow: {
      findMany: vi.fn().mockResolvedValue([]),
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

import { creatorRepository } from "../../../src/repositories/creator.repository";
import { userRepository } from "../../../src/repositories/user.repository";
import { ConflictError, NotFoundError } from "../../../src/middleware/error.middleware";

const mockCreator = {
  walletAddress: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd",
  username: "shivam",
  bio: "A Solana creator",
  avatarUrl: "https://example.com/avatar.png",
  socialLinks: '{"twitter":"https://twitter.com/test"}',
  totalTips: BigInt(1000000000),
  supporterCount: 5,
  createdAt: new Date("2024-01-01"),
};

const mockFormattedCreator = {
  walletAddress: mockCreator.walletAddress,
  username: mockCreator.username,
  displayName: mockCreator.username,
  bio: mockCreator.bio,
  avatarUrl: mockCreator.avatarUrl,
  bannerUrl: null,
  socialLinks: { twitter: "https://twitter.com/test" },
  category: null,
  tags: [],
  featured: false,
  verified: false,
  totalTips: "1000000000",
  supporterCount: 5,
  followerCount: 0,
  joinMessage: null,
  createdAt: mockCreator.createdAt.toISOString(),
};

describe("CreatorService", () => {
  let creatorService: CreatorService;

  beforeEach(() => {
    creatorService = new CreatorService();
    vi.clearAllMocks();
  });

  describe("getByWallet", () => {
    it("should return formatted creator for existing wallet", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue(mockCreator);

      const result = await creatorService.getByWallet(mockCreator.walletAddress);

      expect(result.walletAddress).toBe(mockCreator.walletAddress);
      expect(result.username).toBe(mockCreator.username);
      expect(result.totalTips).toBe("1000000000");
      expect(creatorRepository.findByWallet).toHaveBeenCalledWith(mockCreator.walletAddress);
    });

    it("should throw NotFoundError for non-existing wallet", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue(null);

      await expect(
        creatorService.getByWallet("nonexistent")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getByUsername", () => {
    it("should return formatted creator for existing username", async () => {
      (creatorRepository.findByUsername as any).mockResolvedValue(mockCreator);

      const result = await creatorService.getByUsername("shivam");

      expect(result.username).toBe("shivam");
    });

    it("should throw NotFoundError for non-existing username", async () => {
      (creatorRepository.findByUsername as any).mockResolvedValue(null);

      await expect(
        creatorService.getByUsername("unknown")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("list", () => {
    it("should return paginated creators list", async () => {
      (creatorRepository.findMany as any).mockResolvedValue({
        creators: [mockCreator],
        total: 1,
      });

      const result = await creatorService.list({ page: 1, limit: 20 });

      expect(result.creators).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it("should support sorting by supporters", async () => {
      (creatorRepository.findMany as any).mockResolvedValue({
        creators: [mockCreator],
        total: 1,
      });

      await creatorService.list({ page: 1, limit: 20, sortBy: "supporters" });

      expect(creatorRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { supporterCount: "desc" },
        })
      );
    });

    it("should support sorting by newest", async () => {
      (creatorRepository.findMany as any).mockResolvedValue({
        creators: [mockCreator],
        total: 1,
      });

      await creatorService.list({ page: 1, limit: 20, sortBy: "newest" });

      expect(creatorRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });

  describe("register", () => {
    const registerData = {
      walletAddress: "new-wallet-address",
      username: "newcreator",
      bio: "A new creator",
      avatarUrl: null,
    };

    it("should register a new creator", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue(null);
      (creatorRepository.findByUsername as any).mockResolvedValue(null);
      (userRepository.upsert as any).mockResolvedValue({ id: "user-id" });
      (creatorRepository.create as any).mockResolvedValue(mockCreator);

      const result = await creatorService.register(registerData);

      expect(result).toHaveProperty("walletAddress");
      expect(result).toHaveProperty("username", "shivam");
      expect(creatorRepository.create).toHaveBeenCalled();
    });

    it("should throw ConflictError if wallet already exists", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue(mockCreator);

      await expect(
        creatorService.register(registerData)
      ).rejects.toThrow(ConflictError);
    });

    it("should throw ConflictError if username already exists", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue(null);
      (creatorRepository.findByUsername as any).mockResolvedValue(mockCreator);

      await expect(
        creatorService.register(registerData)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("update", () => {
    it("should update creator fields", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue(mockCreator);
      (creatorRepository.update as any).mockResolvedValue({
        ...mockCreator,
        bio: "Updated bio",
      });

      const result = await creatorService.update(mockCreator.walletAddress, {
        bio: "Updated bio",
      });

      expect(result.bio).toBe("Updated bio");
    });

    it("should throw NotFoundError for non-existing creator", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue(null);

      await expect(
        creatorService.update("nonexistent", { bio: "test" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should check username uniqueness on update", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue(mockCreator);
      (creatorRepository.findByUsername as any).mockResolvedValue({
        ...mockCreator,
        walletAddress: "other-wallet",
      });

      await expect(
        creatorService.update(mockCreator.walletAddress, {
          username: "taken-username",
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("delete", () => {
    it("should delete existing creator", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue(mockCreator);
      (creatorRepository.delete as any).mockResolvedValue(mockCreator);

      await creatorService.delete(mockCreator.walletAddress);

      expect(creatorRepository.delete).toHaveBeenCalledWith(mockCreator.walletAddress);
    });

    it("should throw NotFoundError for non-existing creator", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue(null);

      await expect(
        creatorService.delete("nonexistent")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getFeatured", () => {
    it("should return top creators", async () => {
      (creatorRepository.findMany as any).mockResolvedValue({
        creators: [mockCreator],
        total: 1,
      });

      const result = await creatorService.getFeatured(10);

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe("shivam");
    });
  });

  describe("getRecent", () => {
    it("should return recently created creators", async () => {
      (creatorRepository.findMany as any).mockResolvedValue({
        creators: [mockCreator],
        total: 1,
      });

      const result = await creatorService.getRecent(10);

      expect(result).toHaveLength(1);
    });
  });

  describe("search", () => {
    it("should search creators by query", async () => {
      (creatorRepository.search as any).mockResolvedValue({
        creators: [mockCreator],
        total: 1,
      });

      const result = await creatorService.search("shivam", { page: 1, limit: 20 });

      expect(result.creators).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(creatorRepository.search).toHaveBeenCalledWith(
        "shivam",
        expect.objectContaining({ skip: 0, take: 20 })
      );
    });
  });

  describe("formatCreator", () => {
    it("should format creator with all fields", () => {
      const formatted = (creatorService as any).formatCreator(mockCreator);

      expect(formatted).toEqual(mockFormattedCreator);
    });

    it("should handle null avatar and empty social links", () => {
      const creatorWithNulls = {
        ...mockCreator,
        avatarUrl: null,
        socialLinks: "{}",
        totalTips: BigInt(0),
        supporterCount: 0,
        createdAt: new Date("2024-01-01"),
      };

      const formatted = (creatorService as any).formatCreator(creatorWithNulls);

      expect(formatted.avatarUrl).toBeNull();
      expect(formatted.socialLinks).toEqual({});
      expect(formatted.totalTips).toBe("0");
      expect(formatted.supporterCount).toBe(0);
    });

    it("should parse JSON social links", () => {
      const creatorWithLinks = {
        ...mockCreator,
        socialLinks: '{"twitter":"https://x.com/test"}',
      };

      const formatted = (creatorService as any).formatCreator(creatorWithLinks);

      expect(formatted.socialLinks).toEqual({
        twitter: "https://x.com/test",
      });
    });
  });
});
