import { describe, it, expect, vi, beforeEach } from "vitest";
import { TipService } from "../../../src/services/tip.service";

// Mock all external dependencies
vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    supporter: {
      groupBy: vi.fn(),
    },
    transaction: {
      aggregate: vi.fn(),
    },
  },
}));

vi.mock("../../../src/repositories/transaction.repository", () => ({
  transactionRepository: {
    createWithStats: vi.fn(),
    findMany: vi.fn(),
    findByCreator: vi.fn(),
    findBySupporter: vi.fn(),
  },
}));

vi.mock("../../../src/repositories/creator.repository", () => ({
  creatorRepository: {},
}));

vi.mock("../../../src/utils/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { transactionRepository } from "../../../src/repositories/transaction.repository";
import { prisma } from "../../../src/lib/prisma";

const mockTransaction = {
  id: "tx-1",
  senderWallet: "sender-wallet-1",
  receiverWallet: "receiver-wallet-1",
  amount: BigInt(1000000000), // 1 SOL
  token: "SOL",
  txHash: "hash-1",
  message: "Great work!",
  createdAt: new Date("2024-06-01"),
};

const mockFormattedTx = {
  id: "tx-1",
  senderWallet: "sender-wallet-1",
  receiverWallet: "receiver-wallet-1",
  amount: "1000000000",
  token: "SOL",
  txHash: "hash-1",
  message: "Great work!",
  timestamp: mockTransaction.createdAt,
};

describe("TipService", () => {
  let tipService: TipService;

  beforeEach(() => {
    tipService = new TipService();
    vi.clearAllMocks();
  });

  describe("send", () => {
    it("should send a tip and format the transaction", async () => {
      (transactionRepository.createWithStats as any).mockResolvedValue(mockTransaction);

      const result = await tipService.send({
        senderWallet: "sender-wallet-1",
        receiverWallet: "receiver-wallet-1",
        amount: 1,
        token: "SOL",
        txHash: "hash-1",
        message: "Great work!",
      });

      expect(result).toEqual(mockFormattedTx);
      expect(transactionRepository.createWithStats).toHaveBeenCalledWith({
        senderWallet: "sender-wallet-1",
        receiverWallet: "receiver-wallet-1",
        amount: BigInt(1000000000),
        token: "SOL",
        txHash: "hash-1",
        message: "Great work!",
      });
    });

    it("should default token to SOL when not provided", async () => {
      (transactionRepository.createWithStats as any).mockResolvedValue({
        ...mockTransaction,
        token: "SOL",
      });

      await tipService.send({
        senderWallet: "sender-wallet-1",
        receiverWallet: "receiver-wallet-1",
        amount: 0.5,
      });

      expect(transactionRepository.createWithStats).toHaveBeenCalledWith(
        expect.objectContaining({ token: "SOL" })
      );
    });

    it("should handle small amounts correctly", async () => {
      (transactionRepository.createWithStats as any).mockResolvedValue({
        ...mockTransaction,
        amount: BigInt(1),
      });

      await tipService.send({
        senderWallet: "s",
        receiverWallet: "r",
        amount: 0.000000001,
      });

      expect(transactionRepository.createWithStats).toHaveBeenCalledWith(
        expect.objectContaining({ amount: BigInt(1) })
      );
    });
  });

  describe("sendSpl", () => {
    it("should send an SPL token tip with 6 decimal precision", async () => {
      (transactionRepository.createWithStats as any).mockResolvedValue({
        ...mockTransaction,
        amount: BigInt(1000000),
        token: "USDC",
      });

      const result = await tipService.sendSpl({
        senderWallet: "sender-wallet-1",
        receiverWallet: "receiver-wallet-1",
        amount: 1,
        tokenMint: "usdc-mint-address",
        tokenSymbol: "USDC",
        txHash: "hash-spl",
        message: "USDC tip",
      });

      expect(result.token).toBe("USDC");
      expect(result.amount).toBe("1000000");
      expect(transactionRepository.createWithStats).toHaveBeenCalledWith(
        expect.objectContaining({ amount: BigInt(1000000), token: "USDC" })
      );
    });

    it("should default token symbol to SPL", async () => {
      (transactionRepository.createWithStats as any).mockResolvedValue({
        ...mockTransaction,
        token: "SPL",
      });

      await tipService.sendSpl({
        senderWallet: "s",
        receiverWallet: "r",
        amount: 100,
        tokenMint: "mint-addr",
      });

      expect(transactionRepository.createWithStats).toHaveBeenCalledWith(
        expect.objectContaining({ token: "SPL" })
      );
    });
  });

  describe("getHistory", () => {
    it("should return paginated transaction history", async () => {
      (transactionRepository.findMany as any).mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
      });

      const result = await tipService.getHistory({ page: 1, limit: 20 });

      expect(result.transactions).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it("should filter by wallet address", async () => {
      (transactionRepository.findMany as any).mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
      });

      const result = await tipService.getHistory({
        wallet: "sender-wallet-1",
      });

      expect(result.transactions[0]).toHaveProperty("direction", "sent");
    });

    it("should filter by token", async () => {
      (transactionRepository.findMany as any).mockResolvedValue({
        transactions: [],
        total: 0,
      });

      await tipService.getHistory({
        token: "SOL",
      });

      expect(transactionRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ token: "SOL" }),
        })
      );
    });

    it("should filter by date range", async () => {
      (transactionRepository.findMany as any).mockResolvedValue({
        transactions: [],
        total: 0,
      });

      await tipService.getHistory({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      expect(transactionRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date("2024-01-01"),
              lte: new Date("2024-12-31"),
            },
          }),
        })
      );
    });

    it("should return empty history for wallet with no transactions", async () => {
      (transactionRepository.findMany as any).mockResolvedValue({
        transactions: [],
        total: 0,
      });

      const result = await tipService.getHistory({
        wallet: "new-wallet",
      });

      expect(result.transactions).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe("getCreatorTips", () => {
    it("should return tips received by a creator", async () => {
      (transactionRepository.findByCreator as any).mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
      });

      const result = await tipService.getCreatorTips("receiver-wallet-1", {
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe("getSupporterTips", () => {
    it("should return tips sent by a supporter", async () => {
      (transactionRepository.findBySupporter as any).mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
      });

      const result = await tipService.getSupporterTips("sender-wallet-1", {
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe("getLeaderboard", () => {
    it("should return top supporters by total tipped", async () => {
      (prisma.supporter.groupBy as any).mockResolvedValue([
        {
          walletAddress: "top-supporter",
          _sum: { totalTipped: BigInt(5000000000) },
          _count: { walletAddress: 10 },
        },
        {
          walletAddress: "second-supporter",
          _sum: { totalTipped: BigInt(3000000000) },
          _count: { walletAddress: 5 },
        },
      ]);

      const result = await tipService.getLeaderboard(25);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        rank: 1,
        walletAddress: "top-supporter",
        totalTipped: "5000000000",
        tipCount: 10,
      });
      expect(result[1]).toEqual({
        rank: 2,
        walletAddress: "second-supporter",
        totalTipped: "3000000000",
        tipCount: 5,
      });
    });

    it("should return empty leaderboard when no supporters exist", async () => {
      (prisma.supporter.groupBy as any).mockResolvedValue([]);

      const result = await tipService.getLeaderboard(25);

      expect(result).toHaveLength(0);
    });

    it("should handle BigInt zero values", async () => {
      (prisma.supporter.groupBy as any).mockResolvedValue([
        {
          walletAddress: "supporter-1",
          _sum: { totalTipped: null },
          _count: { walletAddress: 0 },
        },
      ]);

      const result = await tipService.getLeaderboard(25);

      expect(result[0].totalTipped).toBe("0");
    });
  });
});
