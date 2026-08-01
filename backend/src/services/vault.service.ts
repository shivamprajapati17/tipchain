import { prisma } from "../lib/prisma";
import { NotFoundError } from "../middleware/error.middleware";
import { transactionRepository } from "../repositories/transaction.repository";
import logger from "../utils/logger";

/**
 * Creator Vaults — Hyperliquid-inspired copy-tipping.
 *
 * A vault is a curated basket of creators with allocation weights. A supporter
 * "supports" the vault with an amount and the tip is split across the creators
 * proportionally to their allocation, recording real transactions.
 */
export class VaultService {
  private parseJson<T>(raw: string, fallback: T): T {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private formatVault(vault: any, supporters?: any[]) {
    return {
      id: vault.id,
      name: vault.name,
      description: vault.description,
      ownerWallet: vault.ownerWallet,
      imageUrl: vault.imageUrl,
      category: vault.category,
      creatorWallets: this.parseJson<string[]>(vault.creatorWallets, []),
      allocations: this.parseJson<number[]>(vault.allocations, []),
      totalTipped: vault.totalTipped?.toString() ?? "0",
      supporterCount: vault.supporterCount,
      tipCount: vault.tipCount,
      isActive: vault.isActive,
      createdAt: vault.createdAt,
      ...(supporters ? { supporters } : {}),
    };
  }

  async list(params: { limit?: number; offset?: number }) {
    const { limit = 24, offset = 0 } = params;
    const [vaults, total] = await Promise.all([
      prisma.vault.findMany({
        where: { isActive: true },
        orderBy: [{ totalTipped: "desc" }, { supporterCount: "desc" }],
        take: Math.min(limit, 100),
        skip: offset,
      }),
      prisma.vault.count({ where: { isActive: true } }),
    ]);
    return {
      vaults: vaults.map((v) => this.formatVault(v)),
      pagination: { limit, offset, total },
    };
  }

  async getById(id: string) {
    const vault = await prisma.vault.findUnique({
      where: { id },
      include: {
        supporters: {
          orderBy: { totalTipped: "desc" },
          take: 10,
        },
      },
    });
    if (!vault) throw new NotFoundError("Vault");
    const supporters = vault.supporters.map((s) => ({
      walletAddress: s.walletAddress,
      totalTipped: s.totalTipped.toString(),
      tipCount: s.tipCount,
    }));
    return this.formatVault(vault, supporters);
  }

  async create(data: {
    name: string;
    description?: string;
    ownerWallet: string;
    creatorWallets: string[];
    allocations?: number[];
    imageUrl?: string;
    category?: string;
  }) {
    if (!data.name?.trim()) throw new Error("Vault name is required");
    const creators = [...new Set((data.creatorWallets || []).filter(Boolean))];
    if (creators.length === 0) throw new Error("Vault needs at least one creator");

    // Default equal allocations if not provided or mismatched
    let allocations = data.allocations;
    if (!allocations || allocations.length !== creators.length) {
      allocations = creators.map(() => 1);
    }

    const vault = await prisma.vault.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() ?? "",
        ownerWallet: data.ownerWallet,
        imageUrl: data.imageUrl ?? null,
        category: data.category ?? null,
        creatorWallets: JSON.stringify(creators),
        allocations: JSON.stringify(allocations),
        totalTipped: BigInt(0),
        supporterCount: 0,
        tipCount: 0,
        isActive: true,
      },
    });
    logger.info("Vault created", { id: vault.id, owner: data.ownerWallet });
    return this.formatVault(vault);
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      creatorWallets?: string[];
      allocations?: number[];
      imageUrl?: string;
      category?: string;
      isActive?: boolean;
    }
  ) {
    const vault = await prisma.vault.findUnique({ where: { id } });
    if (!vault) throw new NotFoundError("Vault");

    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.description !== undefined) patch.description = data.description.trim();
    if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;
    if (data.category !== undefined) patch.category = data.category;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.creatorWallets !== undefined) {
      const creators = [...new Set(data.creatorWallets.filter(Boolean))];
      if (creators.length === 0) throw new Error("Vault needs at least one creator");
      patch.creatorWallets = JSON.stringify(creators);
      if (data.allocations !== undefined && data.allocations.length === creators.length) {
        patch.allocations = JSON.stringify(data.allocations);
      } else {
        patch.allocations = JSON.stringify(creators.map(() => 1));
      }
    }

    const updated = await prisma.vault.update({ where: { id }, data: patch });
    return this.formatVault(updated);
  }

  async remove(id: string, ownerWallet?: string) {
    const vault = await prisma.vault.findUnique({ where: { id } });
    if (!vault) throw new NotFoundError("Vault");
    if (ownerWallet && vault.ownerWallet !== ownerWallet) {
      throw new Error("Only the vault owner can delete this vault");
    }
    await prisma.vault.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Support a vault: split `amount` across creators by allocation weights and
   * record one transaction per creator (updates supporter + creator stats).
   */
  async support(data: {
    vaultId: string;
    supporterWallet: string;
    amount: number;
    token?: string;
    message?: string;
  }) {
    const vault = await prisma.vault.findUnique({ where: { id: data.vaultId } });
    if (!vault) throw new NotFoundError("Vault");
    if (!vault.isActive) throw new Error("Vault is not active");

    const creators = this.parseJson<string[]>(vault.creatorWallets, []);
    const allocations = this.parseJson<number[]>(vault.allocations, []);
    if (creators.length === 0) throw new Error("Vault has no creators");

    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount");

    // Guard: if all allocations are zero, fall back to equal weights so funds
    // are never silently lost
    const totalWeight = allocations.reduce((a, b) => a + b, 0);
    const weights = totalWeight > 0 ? allocations : creators.map(() => 1);
    const weightTotal = totalWeight > 0 ? totalWeight : creators.length;
    const amountLamports = BigInt(Math.floor(amount * 1e9));
    const token = data.token ?? "SOL";

    // Split the tip across creators proportionally (remainder goes to the first)
    const splits = creators.map((creatorWallet, i) => {
      const weight = weights[i] ?? 1;
      const share = (amountLamports * BigInt(weight)) / BigInt(weightTotal);
      return { creatorWallet, share };
    });
    const distributed = splits.reduce((a, s) => a + s.share, BigInt(0));
    if (distributed < amountLamports && splits.length > 0) {
      splits[0].share += amountLamports - distributed;
    }

    // Record real transactions (fire-and-forget event notifications happen inside)
    for (const split of splits) {
      if (split.share <= BigInt(0)) continue;
      await transactionRepository.createWithStats({
        senderWallet: data.supporterWallet,
        receiverWallet: split.creatorWallet,
        amount: split.share,
        token,
        txHash: null,
        message: data.message ?? `Vault: ${vault.name}`,
        vaultId: vault.id,
      });
    }

    // Update vault stats
    const supporter = await prisma.vaultSupporter.findUnique({
      where: {
        vaultId_walletAddress: {
          vaultId: vault.id,
          walletAddress: data.supporterWallet,
        },
      },
    });

    await prisma.$transaction([
      prisma.vault.update({
        where: { id: vault.id },
        data: {
          totalTipped: { increment: amountLamports },
          tipCount: { increment: 1 },
          supporterCount: supporter ? undefined : { increment: 1 },
        },
      }),
      prisma.vaultSupporter.upsert({
        where: {
          vaultId_walletAddress: {
            vaultId: vault.id,
            walletAddress: data.supporterWallet,
          },
        },
        update: {
          totalTipped: { increment: amountLamports },
          tipCount: { increment: 1 },
          lastTipAt: new Date(),
        },
        create: {
          vaultId: vault.id,
          walletAddress: data.supporterWallet,
          totalTipped: amountLamports,
          tipCount: 1,
          lastTipAt: new Date(),
        },
      }),
    ]);

    const fresh = await prisma.vault.findUnique({ where: { id: vault.id } });
    return {
      success: true,
      vaultId: vault.id,
      splits: splits
        .filter((s) => s.share > BigInt(0))
        .map((s) => ({
          creatorWallet: s.creatorWallet,
          amount: s.share.toString(),
        })),
      vault: fresh ? this.formatVault(fresh) : null,
    };
  }

  /**
   * Per-vault transaction history — every split recorded by this vault's
   * supporters, newest first (followup: vault history view).
   */
  async getTransactions(vaultId: string, params: { limit?: number; offset?: number }) {
    const { limit = 20, offset = 0 } = params;
    const vault = await prisma.vault.findUnique({ where: { id: vaultId } });
    if (!vault) throw new NotFoundError("Vault");

    const { transactions, total } = await transactionRepository.findMany({
      where: { vaultId },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
      skip: offset,
    });

    return {
      vaultId,
      transactions: transactions.map((t) => ({
        id: t.id,
        senderWallet: t.senderWallet,
        receiverWallet: t.receiverWallet,
        amount: t.amount.toString(),
        token: t.token,
        txHash: t.txHash,
        message: t.message,
        timestamp: t.createdAt,
      })),
      pagination: { limit, offset, total },
    };
  }
}

export const vaultService = new VaultService();
