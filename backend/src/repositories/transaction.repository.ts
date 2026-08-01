import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class TransactionRepository {
  async findById(id: string) {
    return prisma.transaction.findUnique({ where: { id } });
  }

  async findByTxHash(txHash: string) {
    return prisma.transaction.findUnique({ where: { txHash } });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.TransactionWhereInput;
    orderBy?: Prisma.TransactionOrderByWithRelationInput;
  }) {
    const { skip = 0, take = 20, where, orderBy = { createdAt: "desc" } } = params;
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({ where, orderBy, skip, take }),
      prisma.transaction.count({ where }),
    ]);
    return { transactions, total };
  }

  async findByWallet(wallet: string, params: { skip?: number; take?: number }) {
    const { skip = 0, take = 20 } = params;
    const where = {
      OR: [{ senderWallet: wallet }, { receiverWallet: wallet }],
    };
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.transaction.count({ where }),
    ]);
    return { transactions, total, wallet };
  }

  async findByCreator(creatorWallet: string, params: { skip?: number; take?: number }) {
    return this.findMany({
      where: { receiverWallet: creatorWallet },
      ...params,
    });
  }

  async findBySupporter(supporterWallet: string, params: { skip?: number; take?: number }) {
    return this.findMany({
      where: { senderWallet: supporterWallet },
      ...params,
    });
  }

  async create(data: Prisma.TransactionCreateInput) {
    return prisma.transaction.create({ data });
  }

  async createWithStats(data: {
    senderWallet: string;
    receiverWallet: string;
    amount: bigint;
    token: string;
    txHash?: string | null;
    message?: string | null;
    vaultId?: string | null;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Upsert supporter record
      await tx.supporter.upsert({
        where: {
          walletAddress_creatorWallet: {
            walletAddress: data.senderWallet,
            creatorWallet: data.receiverWallet,
          },
        },
        update: {
          totalTipped: { increment: data.amount },
          tipCount: { increment: 1 },
        },
        create: {
          walletAddress: data.senderWallet,
          creatorWallet: data.receiverWallet,
          totalTipped: data.amount,
          tipCount: 1,
        },
      });

      // Update creator stats
      await tx.creator.upsert({
        where: { walletAddress: data.receiverWallet },
        update: { totalTips: { increment: data.amount } },
        create: {
          walletAddress: data.receiverWallet,
          username: `c_${data.receiverWallet.slice(0, 8)}`,
          bio: "",
          totalTips: data.amount,
          supporterCount: 1,
        },
      });

      // Create transaction
      return tx.transaction.create({ data });
    });
  }

  async aggregateByWallet(wallet: string, days?: number) {
    const where: Prisma.TransactionWhereInput = { receiverWallet: wallet };
    if (days) {
      where.createdAt = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }
    return prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });
  }

  async getTokenBreakdown(wallet: string) {
    return prisma.transaction.groupBy({
      by: ["token"],
      where: { receiverWallet: wallet },
      _sum: { amount: true },
      _count: true,
    });
  }

  async getDailyRevenue(wallet: string, days: number) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const transactions = await prisma.transaction.findMany({
      where: { receiverWallet: wallet, createdAt: { gte: startDate } },
      orderBy: { createdAt: "asc" },
    });

    const dailyMap = new Map<string, { tips: bigint; count: number }>();
    for (const tx of transactions) {
      const day = tx.createdAt.toISOString().slice(0, 10);
      const existing = dailyMap.get(day) ?? { tips: BigInt(0), count: 0 };
      existing.tips += tx.amount;
      existing.count += 1;
      dailyMap.set(day, existing);
    }

    const revenue = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      const data = dailyMap.get(key);
      revenue.push({
        date: key,
        amount: data ? data.tips.toString() : "0",
        count: data ? data.count : 0,
      });
    }
    return revenue;
  }

  async count(where?: Prisma.TransactionWhereInput) {
    return prisma.transaction.count({ where });
  }
}

export const transactionRepository = new TransactionRepository();
