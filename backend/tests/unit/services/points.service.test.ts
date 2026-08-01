import { describe, it, expect, vi, beforeEach } from "vitest";
import { PointsService, pointsFromLamports, tierForPoints } from "../../../src/services/points.service";

vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    transaction: {
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

import { prisma } from "../../../src/lib/prisma";

describe("PointsService", () => {
  let pointsService: PointsService;

  beforeEach(() => {
    pointsService = new PointsService();
    vi.clearAllMocks();
  });

  describe("pointsFromLamports", () => {
    it("awards 1000 points per SOL", () => {
      expect(pointsFromLamports(BigInt(1e9))).toBe(1000);
      expect(pointsFromLamports(BigInt(5 * 1e9))).toBe(5000);
      expect(pointsFromLamports(BigInt(5e7))).toBe(50); // 0.05 SOL
    });

    it("truncates fractional points", () => {
      expect(pointsFromLamports(BigInt(1_500_000))).toBe(1);
      expect(pointsFromLamports(BigInt(999_999))).toBe(0);
    });
  });

  describe("tierForPoints", () => {
    it("returns Bronze at 0 points", () => {
      expect(tierForPoints(0).name).toBe("Bronze");
      expect(tierForPoints(0).next).toBe("Silver");
    });

    it("hits each tier boundary", () => {
      expect(tierForPoints(5_000).name).toBe("Silver");
      expect(tierForPoints(25_000).name).toBe("Gold");
      expect(tierForPoints(100_000).name).toBe("Platinum");
      expect(tierForPoints(500_000).name).toBe("Hyper");
    });

    it("Hyper has no next tier", () => {
      expect(tierForPoints(1_000_000).next).toBeNull();
    });
  });

  describe("getPointsLeaderboard", () => {
    it("sums sent + received points and ranks by total", async () => {
      (prisma.transaction.groupBy as any)
        .mockResolvedValueOnce([
          // sent rows
          { senderWallet: "wallet-a", _sum: { amount: BigInt(1e9) }, _count: 1 },
          { senderWallet: "wallet-b", _sum: { amount: BigInt(5 * 1e9) }, _count: 2 },
        ])
        .mockResolvedValueOnce([
          // received rows
          { receiverWallet: "wallet-a", _sum: { amount: BigInt(2 * 1e9) }, _count: 1 },
        ]);

      const result = await pointsService.getPointsLeaderboard({ limit: 25 });

      // wallet-a: 1000 sent + 2000 received = 3000; wallet-b: 5000
      expect(result[0].walletAddress).toBe("wallet-b");
      expect(result[0].points).toBe(5000);
      expect(result[1].walletAddress).toBe("wallet-a");
      expect(result[1].points).toBe(3000);
      expect(result[1].sentPoints).toBe(1000);
      expect(result[1].receivedPoints).toBe(2000);
    });

    it("filters by period (7d / 30d) via createdAt gte", async () => {
      (prisma.transaction.groupBy as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const before = Date.now();
      await pointsService.getPointsLeaderboard({ period: "7d", limit: 10 });

      const call = (prisma.transaction.groupBy as any).mock.calls[0][0];
      const since = (call.where.createdAt.gte as Date).getTime();
      expect(since).toBeGreaterThan(before - 7 * 24 * 60 * 60 * 1000 - 1000);
      expect(since).toBeLessThanOrEqual(before);
    });

    it("does not apply a time filter for all-time", async () => {
      (prisma.transaction.groupBy as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await pointsService.getPointsLeaderboard({ period: "all", limit: 10 });

      const call = (prisma.transaction.groupBy as any).mock.calls[0][0];
      expect(call.where.createdAt).toBeUndefined();
    });

    it("filters by token when provided", async () => {
      (prisma.transaction.groupBy as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await pointsService.getPointsLeaderboard({ token: "USDC", limit: 10 });

      const call = (prisma.transaction.groupBy as any).mock.calls[0][0];
      expect(call.where.token).toBe("USDC");
    });

    it("caps results at 100 via slice", async () => {
      // The implementation caps with .slice(0, min(limit, 100)) after sorting,
      // so feed it 150 rows and verify only 100 come back.
      const manyRows = Array.from({ length: 150 }, (_, i) => ({
        senderWallet: `wallet-${i}`,
        _sum: { amount: BigInt((i + 1) * 1e6) },
        _count: 1,
      }));
      (prisma.transaction.groupBy as any)
        .mockResolvedValueOnce(manyRows)
        .mockResolvedValueOnce([]);

      const result = await pointsService.getPointsLeaderboard({ limit: 500 });

      expect(result.length).toBe(100);
    });
  });

  describe("getWalletPoints", () => {
    it("computes total, breakdown, tier and rank", async () => {
      (prisma.transaction.aggregate as any)
        .mockResolvedValueOnce({
          _sum: { amount: BigInt(1e9) }, // sent: 1 SOL
          _count: 1,
        })
        .mockResolvedValueOnce({
          _sum: { amount: BigInt(2 * 1e9) }, // received: 2 SOL
          _count: 2,
        });
      // leaderboard scan for rank
      (prisma.transaction.groupBy as any)
        .mockResolvedValueOnce([{ senderWallet: "wallet-x", _sum: { amount: BigInt(10 * 1e9) }, _count: 1 }])
        .mockResolvedValueOnce([]);

      const result = await pointsService.getWalletPoints("wallet-1");

      expect(result.points).toBe(3000);
      expect(result.sentPoints).toBe(1000);
      expect(result.receivedPoints).toBe(2000);
      expect(result.tipCount).toBe(3);
      expect(result.tier).toBe("Bronze");
      expect(result.nextTier).toBe("Silver");
      expect(result.rank).toBeNull(); // not in top-100 scan
    });

    it("returns zero points for a wallet with no activity", async () => {
      (prisma.transaction.aggregate as any)
        .mockResolvedValueOnce({ _sum: { amount: BigInt(0) }, _count: 0 })
        .mockResolvedValueOnce({ _sum: { amount: BigInt(0) }, _count: 0 });

      const result = await pointsService.getWalletPoints("wallet-0");

      expect(result.points).toBe(0);
      expect(result.rank).toBeNull();
      expect(result.tier).toBe("Bronze");
    });

    it("applies the period filter to both directions", async () => {
      (prisma.transaction.aggregate as any)
        .mockResolvedValueOnce({ _sum: { amount: BigInt(0) }, _count: 0 })
        .mockResolvedValueOnce({ _sum: { amount: BigInt(0) }, _count: 0 });

      await pointsService.getWalletPoints("wallet-1", "30d");

      const sentCall = (prisma.transaction.aggregate as any).mock.calls[0][0];
      const receivedCall = (prisma.transaction.aggregate as any).mock.calls[1][0];
      expect(sentCall.where.senderWallet).toBe("wallet-1");
      expect(sentCall.where.createdAt).toBeDefined();
      expect(receivedCall.where.receiverWallet).toBe("wallet-1");
      expect(receivedCall.where.createdAt).toBeDefined();
    });
  });
});
