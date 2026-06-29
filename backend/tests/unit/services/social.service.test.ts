import { describe, it, expect, vi, beforeEach } from "vitest";
import { socialService } from "../../../src/services/social.service";

vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    creator: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    supporter: {
      findFirst: vi.fn(),
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

describe("SocialService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("follow", () => {
    it("should create a follow relationship", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);
      (prisma.supporter.findFirst as any).mockResolvedValue(null);
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const result = await socialService.follow("follower-wallet", mockCreator.walletAddress);

      expect(result.followerWallet).toBe("follower-wallet");
      expect(result.creatorWallet).toBe(mockCreator.walletAddress);
      expect(prisma.creator.update).toHaveBeenCalled();
    });

    it("should throw NotFoundError for non-existing creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      await expect(
        socialService.follow("wallet", "nonexistent")
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ConflictError if already following", async () => {
      const creatorWithFollow = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _social: [{ followerWallet: "follower-wallet", creatorWallet: mockCreator.walletAddress }],
        }),
      };
      (prisma.creator.findUnique as any).mockResolvedValue(creatorWithFollow);

      await expect(
        socialService.follow("follower-wallet", mockCreator.walletAddress)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("unfollow", () => {
    it("should remove a follow relationship", async () => {
      const creatorWithFollow = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _social: [{ followerWallet: "follower", creatorWallet: mockCreator.walletAddress }],
        }),
      };
      (prisma.creator.findUnique as any).mockResolvedValue(creatorWithFollow);
      (prisma.creator.update as any).mockResolvedValue(creatorWithFollow);

      await socialService.unfollow("follower", mockCreator.walletAddress);

      expect(prisma.creator.update).toHaveBeenCalled();
    });

    it("should throw NotFoundError for non-existing creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      await expect(
        socialService.unfollow("wallet", "nonexistent")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getFollowers", () => {
    it("should return followers for a creator", async () => {
      const creatorWithFollowers = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _social: [
            { followerWallet: "f1", creatorWallet: mockCreator.walletAddress, createdAt: new Date().toISOString() },
            { followerWallet: "f2", creatorWallet: mockCreator.walletAddress, createdAt: new Date().toISOString() },
          ],
        }),
      };
      (prisma.creator.findUnique as any).mockResolvedValue(creatorWithFollowers);

      const result = await socialService.getFollowers(mockCreator.walletAddress);

      expect(result.followers).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should return empty when creator has no followers", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);

      const result = await socialService.getFollowers(mockCreator.walletAddress);

      expect(result.followers).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should return empty for non-existing creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      const result = await socialService.getFollowers("nonexistent");

      expect(result.followers).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("getFollowing", () => {
    it("should return all creators a wallet follows", async () => {
      const creator1 = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _social: [{ followerWallet: "wallet-A", creatorWallet: mockCreator.walletAddress }],
        }),
      };
      const creator2 = {
        walletAddress: "creator-2",
        username: "test2",
        socialLinks: JSON.stringify({
          _social: [{ followerWallet: "wallet-A", creatorWallet: "creator-2" }],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creator1, creator2]);

      const result = await socialService.getFollowing("wallet-A");

      expect(result.following).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should return empty when wallet follows no one", async () => {
      (prisma.creator.findMany as any).mockResolvedValue([mockCreator]);

      const result = await socialService.getFollowing("unknown-wallet");

      expect(result.following).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("addComment", () => {
    it("should add a comment to a creator profile", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const comment = await socialService.addComment("author-wallet", mockCreator.walletAddress, "Great work!");

      expect(comment.authorWallet).toBe("author-wallet");
      expect(comment.content).toBe("Great work!");
      expect(comment.id).toContain("cmt_");
    });

    it("should throw NotFoundError for non-existing creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      await expect(
        socialService.addComment("author", "nonexistent", "test")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getComments", () => {
    it("should return comments for a creator in reverse order", async () => {
      const creatorWithComments = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _comments: [
            { id: "cmt_1", content: "First", createdAt: "2024-01-01T00:00:00Z" },
            { id: "cmt_2", content: "Second", createdAt: "2024-01-02T00:00:00Z" },
          ],
        }),
      };
      (prisma.creator.findUnique as any).mockResolvedValue(creatorWithComments);

      const comments = await socialService.getComments(mockCreator.walletAddress);

      expect(comments).toHaveLength(2);
      expect(comments[0].content).toBe("Second"); // Reversed
    });

    it("should return empty for non-existing creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      const comments = await socialService.getComments("nonexistent");

      expect(comments).toEqual([]);
    });
  });

  describe("createUpdate", () => {
    it("should create a creator update", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const update = await socialService.createUpdate(
        mockCreator.walletAddress,
        "New Release",
        "Check out my latest work!",
        "https://example.com/image.png"
      );

      expect(update.title).toBe("New Release");
      expect(update.content).toBe("Check out my latest work!");
      expect(update.imageUrl).toBe("https://example.com/image.png");
      expect(update.id).toContain("upd_");
    });

    it("should create update without image", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const update = await socialService.createUpdate(
        mockCreator.walletAddress,
        "Text only", "Just text"
      );

      expect(update.imageUrl).toBeUndefined();
    });
  });

  describe("getUpdates", () => {
    it("should return updates in reverse order", async () => {
      const creatorWithUpdates = {
        ...mockCreator,
        socialLinks: JSON.stringify({
          _updates: [
            { id: "upd_1", title: "Old", createdAt: "2024-01-01T00:00:00Z" },
            { id: "upd_2", title: "New", createdAt: "2024-01-02T00:00:00Z" },
          ],
        }),
      };
      (prisma.creator.findUnique as any).mockResolvedValue(creatorWithUpdates);

      const updates = await socialService.getUpdates(mockCreator.walletAddress);

      expect(updates).toHaveLength(2);
      expect(updates[0].title).toBe("New");
    });
  });

  describe("getFeed", () => {
    it("should return updates from followed creators", async () => {
      const creatorFollowed = {
        walletAddress: "followed-creator",
        username: "followed",
        socialLinks: JSON.stringify({
          _social: [{ followerWallet: "my-wallet", creatorWallet: "followed-creator" }],
          _updates: [{ id: "upd_1", title: "From Followed", content: "test", createdAt: new Date().toISOString() }],
        }),
      };
      const myCreator = {
        walletAddress: "my-wallet",
        username: "me",
        socialLinks: JSON.stringify({
          _updates: [{ id: "upd_2", title: "My Update", content: "test", createdAt: new Date().toISOString() }],
        }),
      };
      (prisma.creator.findMany as any).mockResolvedValue([creatorFollowed, myCreator]);

      // getFeed calls getFollowing which calls findMany again
      (prisma.creator.findUnique as any).mockResolvedValue(creatorFollowed);

      const feed = await socialService.getFeed("my-wallet");

      expect(feed).toHaveLength(2);
      expect(feed[0].title).toBe("From Followed");
      expect(feed[1].title).toBe("My Update");
    });
  });
});
