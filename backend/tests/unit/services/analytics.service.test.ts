import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyticsService } from "../../../src/services/analytics.service";

vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    creator: {
      count: vi.fn(),
    },
    transaction: {
      count: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    supporter: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../../src/repositories/transaction.repository", () => ({
  transactionRepository: {
    aggregateByWallet: vi.fn(),
    count: vi.fn(),
    getDailyRevenue: vi.fn(),
    getTokenBreakdown: vi.fn(),
  },
}));

vi.mock("../../../src/repositories/creator.repository", () => ({
  creatorRepository: {
    findByWallet: vi.fn(),
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
import { transactionRepository } from "../../../src/repositories/transaction.repository";
import { prisma } from "../../../src/lib/prisma";
import { NotFoundError } from "../../../src/middleware/error.middleware";

describe("AnalyticsService", () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    vi.clearAllMocks();
  });

  describe("getOverview", () => {
    it("should return creator overview with stats", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue({
        walletAddress: "wallet-1",
        totalTips: BigInt(10000000000),
        supporterCount: 25,
      });
      (transactionRepository.aggregateByWallet as any).mockResolvedValue({
        _sum: { amount: BigInt(5000000000) },
        _count: 10,
      });
      (transactionRepository.count as any).mockResolvedValue(100);

      const result = await analyticsService.getOverview("wallet-1");

      expect(result.totalEarnings).toBe("10000000000");
      expect(result.totalTransactions).toBe(100);
      expect(result.totalSupporters).toBe(25);
      expect(result.monthlyEarnings).toBe("5000000000");
      expect(result.monthlyTransactions).toBe(10);
      expect(result.totalFollowers).toBe(0);
      expect(result.walletBalance).toBe("0");
    });

    it("should throw NotFoundError for non-existing creator", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue(null);

      await expect(
        analyticsService.getOverview("unknown-wallet")
      ).rejects.toThrow(NotFoundError);
    });

    it("should handle zero stats for a new creator", async () => {
      (creatorRepository.findByWallet as any).mockResolvedValue({
        walletAddress: "new-wallet",
        totalTips: null,
        supporterCount: 0,
      });
      (transactionRepository.aggregateByWallet as any).mockResolvedValue({
        _sum: { amount: BigInt(0) },
        _count: 0,
      });
      (transactionRepository.count as any).mockResolvedValue(0);

      const result = await analyticsService.getOverview("new-wallet");

      expect(result.totalEarnings).toBe("0");
      expect(result.totalTransactions).toBe(0);
      expect(result.totalSupporters).toBe(0);
    });
  });

  describe("getRevenue", () => {
    it("should return daily revenue data", async () => {
      const mockRevenue = [
        { date: "2024-06-01", amount: "1000000000", count: 1 },
        { date: "2024-06-02", amount: "2000000000", count: 2 },
      ];
      (transactionRepository.getDailyRevenue as any).mockResolvedValue(mockRevenue);

      const result = await analyticsService.getRevenue("wallet-1", 7);

      expect(result.wallet).toBe("wallet-1");
      expect(result.days).toBe(7);
      expect(result.revenue).toEqual(mockRevenue);
    });

    it("should clamp days to max 365", async () => {
      (transactionRepository.getDailyRevenue as any).mockResolvedValue([]);

      const result = await analyticsService.getRevenue("wallet-1", 500);

      expect(result.days).toBe(365);
    });
  });

  describe("getTipAnalytics", () => {
    it("should return comprehensive tip analytics", async () => {
      (prisma.transaction.findMany as any).mockResolvedValue([
        { amount: BigInt(1000000000), createdAt: new Date() },
        { amount: BigInt(2000000000), createdAt: new Date() },
        { amount: BigInt(3000000000), createdAt: new Date() },
      ]);
      (prisma.supporter.findMany as any).mockResolvedValue([
        { walletAddress: "supporter-1", totalTipped: BigInt(3000000000), tipCount: 3 },
      ]);
      (transactionRepository.getTokenBreakdown as any).mockResolvedValue([
        { token: "SOL", _sum: { amount: BigInt(6000000000) }, _count: 3 },
      ]);

      const result = await analyticsService.getTipAnalytics("wallet-1");

      expect(result.totalTips).toBe(3);
      expect(result.averageTip).toBe("2000000000");
      expect(result.largestTip).toBe("3000000000");
      expect(result.tokenBreakdown).toHaveLength(1);
      expect(result.topSupporters).toHaveLength(1);
    });

    it("should handle no transactions", async () => {
      (prisma.transaction.findMany as any).mockResolvedValue([]);
      (prisma.supporter.findMany as any).mockResolvedValue([]);
      (transactionRepository.getTokenBreakdown as any).mockResolvedValue([]);

      const result = await analyticsService.getTipAnalytics("wallet-1");

      expect(result.totalTips).toBe(0);
      expect(result.averageTip).toBe("0");
      expect(result.largestTip).toBe("0");
      expect(result.tokenBreakdown).toHaveLength(0);
      expect(result.topSupporters).toHaveLength(0);
    });
  });

  describe("getGrowth", () => {
    it("should calculate month-over-month growth", async () => {
      (transactionRepository.aggregateByWallet as any).mockResolvedValue({
        _sum: { amount: BigInt(10000000000) },
        _count: 20,
      });
      (prisma.transaction.aggregate as any).mockResolvedValue({
        _sum: { amount: BigInt(5000000000) },
        _count: 10,
      });

      const result = await analyticsService.getGrowth("wallet-1");

      expect(result.wallet).toBe("wallet-1");
      expect(result.currentMonthRevenue).toBe("10000000000");
      expect(result.previousMonthRevenue).toBe("5000000000");
      expect(result.revenueGrowthPercent).toBe(100);
      expect(result.currentMonthTransactions).toBe(20);
      expect(result.previousMonthTransactions).toBe(10);
    });

    it("should handle 0% growth for same revenue", async () => {
      (transactionRepository.aggregateByWallet as any).mockResolvedValue({
        _sum: { amount: BigInt(5000000000) },
        _count: 10,
      });
      (prisma.transaction.aggregate as any).mockResolvedValue({
        _sum: { amount: BigInt(5000000000) },
        _count: 10,
      });

      const result = await analyticsService.getGrowth("wallet-1");

      expect(result.revenueGrowthPercent).toBe(0);
    });

    it("should handle zero previous revenue", async () => {
      (transactionRepository.aggregateByWallet as any).mockResolvedValue({
        _sum: { amount: BigInt(5000000000) },
        _count: 10,
      });
      (prisma.transaction.aggregate as any).mockResolvedValue({
        _sum: { amount: BigInt(0) },
        _count: 0,
      });

      const result = await analyticsService.getGrowth("wallet-1");

      expect(result.previousMonthRevenue).toBe("0");
      expect(result.revenueGrowthPercent).toBe(0);
    });
  });

  describe("getPlatform", () => {
    it("should return platform-wide statistics", async () => {
      (prisma.creator.count as any).mockResolvedValue(50);
      (prisma.transaction.count as any).mockResolvedValue(1000);
      (prisma.supporter.count as any).mockResolvedValue(200);
      (prisma.transaction.aggregate as any).mockResolvedValue({
        _sum: { amount: BigInt(100000000000) },
      });

      const result = await analyticsService.getPlatform();

      expect(result.totalCreators).toBe(50);
      expect(result.totalUsers).toBe(50);
      expect(result.totalTransactions).toBe(1000);
      expect(result.totalSupporters).toBe(200);
      expect(result.totalVolume).toBe("100000000000");
      expect(result.activeWallets24h).toBe(0);
    });

    it("should handle empty platform", async () => {
      (prisma.creator.count as any).mockResolvedValue(0);
      (prisma.transaction.count as any).mockResolvedValue(0);
      (prisma.supporter.count as any).mockResolvedValue(0);
      (prisma.transaction.aggregate as any).mockResolvedValue({
        _sum: { amount: BigInt(0) },
      });

      const result = await analyticsService.getPlatform();

      expect(result.totalCreators).toBe(0);
      expect(result.totalVolume).toBe("0");
    });
  });

  describe("exportCsv", () => {
    it("should export transactions as CSV", async () => {
      (prisma.transaction.findMany as any).mockResolvedValue([
        {
          createdAt: new Date("2024-06-01T12:00:00Z"),
          senderWallet: "sender-1",
          amount: BigInt(1000000000),
          token: "SOL",
          message: "Great work!",
          txHash: "hash-1",
        },
      ]);

      const csv = await analyticsService.exportCsv("wallet-1", 90);

      expect(csv).toContain("Date,Sender,Amount,Token,Message,TxHash");
      expect(csv).toContain("sender-1");
      expect(csv).toContain("SOL");
    });

    it("should clamp days to max 365", async () => {
      (prisma.transaction.findMany as any).mockResolvedValue([]);

      const csv = await analyticsService.exportCsv("wallet-1", 500);

      expect(csv).toContain("Date,Sender");
    });

    it("should escape quotes in messages", async () => {
      (prisma.transaction.findMany as any).mockResolvedValue([
        {
          createdAt: new Date("2024-06-01T12:00:00Z"),
          senderWallet: "sender-1",
          amount: BigInt(1000000000),
          token: "SOL",
          message: 'He said "hello"',
          txHash: "hash-2",
        },
      ]);

      const csv = await analyticsService.exportCsv("wallet-1", 30);

      expect(csv).toContain('"""');
    });
  });
});
