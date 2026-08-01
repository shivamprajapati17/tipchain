import { describe, it, expect, vi, beforeEach } from "vitest";
import { VaultService } from "../../../src/services/vault.service";

vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    vault: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    vaultSupporter: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../../src/repositories/transaction.repository", () => ({
  transactionRepository: {
    createWithStats: vi.fn(),
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
import { transactionRepository } from "../../../src/repositories/transaction.repository";
import { NotFoundError } from "../../../src/middleware/error.middleware";

const vaultFixture: any = {
  id: "vault-1",
  name: "Test Vault",
  description: "A basket",
  ownerWallet: "owner-1",
  imageUrl: null,
  category: null,
  creatorWallets: JSON.stringify(["creator-a", "creator-b", "creator-c"]),
  allocations: JSON.stringify([1, 1, 1]),
  totalTipped: BigInt(0),
  supporterCount: 0,
  tipCount: 0,
  isActive: true,
  createdAt: new Date(),
};

describe("VaultService", () => {
  let vaultService: VaultService;

  beforeEach(() => {
    vaultService = new VaultService();
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("filters isActive consistently across findMany and count", async () => {
      (prisma.vault.findMany as any).mockResolvedValue([vaultFixture]);
      (prisma.vault.count as any).mockResolvedValue(1);

      await vaultService.list({ limit: 24, offset: 0 });

      expect(prisma.vault.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } })
      );
      expect(prisma.vault.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });

    it("returns formatted vaults with parsed JSON arrays", async () => {
      (prisma.vault.findMany as any).mockResolvedValue([vaultFixture]);
      (prisma.vault.count as any).mockResolvedValue(1);

      const result = await vaultService.list({ limit: 24, offset: 0 });

      expect(result.vaults[0].creatorWallets).toEqual([
        "creator-a",
        "creator-b",
        "creator-c",
      ]);
      expect(result.vaults[0].allocations).toEqual([1, 1, 1]);
      expect(result.vaults[0].totalTipped).toBe("0");
    });
  });

  describe("create", () => {
    it("defaults to equal allocations when none provided", async () => {
      (prisma.vault.create as any).mockResolvedValue(vaultFixture);

      await vaultService.create({
        name: "Test Vault",
        ownerWallet: "owner-1",
        creatorWallets: ["creator-a", "creator-b", "creator-c"],
      });

      expect(prisma.vault.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creatorWallets: JSON.stringify(["creator-a", "creator-b", "creator-c"]),
            allocations: JSON.stringify([1, 1, 1]),
          }),
        })
      );
    });

    it("keeps provided allocations when they match creator count", async () => {
      (prisma.vault.create as any).mockResolvedValue(vaultFixture);

      await vaultService.create({
        name: "Test Vault",
        ownerWallet: "owner-1",
        creatorWallets: ["creator-a", "creator-b", "creator-c"],
        allocations: [3, 2, 1],
      });

      expect(prisma.vault.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            allocations: JSON.stringify([3, 2, 1]),
          }),
        })
      );
    });

    it("rejects empty creator lists", async () => {
      await expect(
        vaultService.create({
          name: "Empty",
          ownerWallet: "owner-1",
          creatorWallets: [],
        })
      ).rejects.toThrow("at least one creator");
    });

    it("deduplicates creator wallets", async () => {
      (prisma.vault.create as any).mockResolvedValue(vaultFixture);

      await vaultService.create({
        name: "Test Vault",
        ownerWallet: "owner-1",
        creatorWallets: ["creator-a", "creator-a", "creator-b"],
      });

      expect(prisma.vault.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creatorWallets: JSON.stringify(["creator-a", "creator-b"]),
          }),
        })
      );
    });
  });

  describe("support — split math", () => {
    it("distributes the remainder to the first split so Σ shares == amount", async () => {
      // 10 lamports across 3 equal-weight creators: 10/3 truncates to 3 each,
      // the leftover 1 lamport must go to the first split → [4, 3, 3]
      (prisma.vault.findUnique as any).mockResolvedValue({
        ...vaultFixture,
        totalTipped: BigInt(0),
      });
      (prisma.vaultSupporter.findUnique as any).mockResolvedValue(null);
      (prisma.$transaction as any).mockResolvedValue([]);
      // Second findUnique call returns the refreshed vault
      (prisma.vault.findUnique as any).mockResolvedValueOnce(vaultFixture);
      (prisma.vault.findUnique as any).mockResolvedValueOnce({
        ...vaultFixture,
        totalTipped: BigInt(10),
      });

      const result = await vaultService.support({
        vaultId: "vault-1",
        supporterWallet: "supporter-1",
        amount: 1e-8, // 10 lamports
        token: "SOL",
      });

      const shares = result.splits.map((s) => BigInt(s.amount));
      expect(shares).toEqual([BigInt(4), BigInt(3), BigInt(3)]);
      expect(shares.reduce((a, b) => a + b, BigInt(0))).toBe(BigInt(10));

      // One transaction recorded per creator
      expect(transactionRepository.createWithStats).toHaveBeenCalledTimes(3);
      expect(transactionRepository.createWithStats).toHaveBeenCalledWith(
        expect.objectContaining({ senderWallet: "supporter-1", token: "SOL" })
      );
    });

    it("falls back to equal weights when all allocations are zero", async () => {
      const zeroAllocVault = {
        ...vaultFixture,
        allocations: JSON.stringify([0, 0, 0]),
      };
      (prisma.vault.findUnique as any)
        .mockResolvedValueOnce(zeroAllocVault) // support lookup
        .mockResolvedValueOnce({ ...zeroAllocVault, totalTipped: BigInt(10) }); // fresh
      (prisma.vaultSupporter.findUnique as any).mockResolvedValue(null);
      (prisma.$transaction as any).mockResolvedValue([]);

      const result = await vaultService.support({
        vaultId: "vault-1",
        supporterWallet: "supporter-1",
        amount: 1e-8, // 10 lamports
      });

      const shares = result.splits.map((s) => BigInt(s.amount));
      // Equal weights → same as the 1,1,1 case: [4, 3, 3]
      expect(shares).toEqual([BigInt(4), BigInt(3), BigInt(3)]);
      expect(shares.reduce((a, b) => a + b, BigInt(0))).toBe(BigInt(10));
    });

    it("rejects invalid or non-positive amounts", async () => {
      (prisma.vault.findUnique as any).mockResolvedValue(vaultFixture);

      await expect(
        vaultService.support({
          vaultId: "vault-1",
          supporterWallet: "supporter-1",
          amount: 0,
        })
      ).rejects.toThrow("Invalid amount");

      await expect(
        vaultService.support({
          vaultId: "vault-1",
          supporterWallet: "supporter-1",
          amount: NaN,
        })
      ).rejects.toThrow("Invalid amount");
    });

    it("throws NotFoundError for missing vault", async () => {
      (prisma.vault.findUnique as any).mockResolvedValue(null);

      await expect(
        vaultService.support({
          vaultId: "missing",
          supporterWallet: "supporter-1",
          amount: 1,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("does not double-count supporterCount for existing supporters", async () => {
      (prisma.vault.findUnique as any)
        .mockResolvedValueOnce(vaultFixture) // support lookup
        .mockResolvedValueOnce({ ...vaultFixture, totalTipped: BigInt(10) }); // fresh
      (prisma.vaultSupporter.findUnique as any).mockResolvedValue({
        id: "vs-1",
        vaultId: "vault-1",
        walletAddress: "supporter-1",
        totalTipped: BigInt(5),
        tipCount: 1,
      });
      (prisma.$transaction as any).mockResolvedValue([]);

      await vaultService.support({
        vaultId: "vault-1",
        supporterWallet: "supporter-1",
        amount: 1e-8,
      });

      // supporter exists → supporterCount must NOT be incremented
      const updateCall = (prisma.vault.update as any).mock.calls[0][0];
      const data = updateCall.data;
      expect(data.supporterCount).toBeUndefined();
    });
  });

  describe("remove", () => {
    it("rejects deletion by a non-owner", async () => {
      (prisma.vault.findUnique as any).mockResolvedValue(vaultFixture);

      await expect(
        vaultService.remove("vault-1", "not-the-owner")
      ).rejects.toThrow("Only the vault owner");
      expect(prisma.vault.delete).not.toHaveBeenCalled();
    });

    it("deletes when owner matches", async () => {
      (prisma.vault.findUnique as any).mockResolvedValue(vaultFixture);
      (prisma.vault.delete as any).mockResolvedValue({});

      const result = await vaultService.remove("vault-1", "owner-1");

      expect(result.success).toBe(true);
      expect(prisma.vault.delete).toHaveBeenCalledWith({
        where: { id: "vault-1" },
      });
    });
  });
});
