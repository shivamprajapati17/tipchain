import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

// Only select columns that exist in the actual database
const creatorSelect = {
  walletAddress: true,
  username: true,
  bio: true,
  avatarUrl: true,
  socialLinks: true,
  totalTips: true,
  supporterCount: true,
  createdAt: true,
} as const;

export class CreatorRepository {
  async findByWallet(wallet: string) {
    return prisma.creator.findUnique({
      where: { walletAddress: wallet },
      select: creatorSelect,
    });
  }

  async findByUsername(username: string) {
    return prisma.creator.findUnique({
      where: { username },
      select: creatorSelect,
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.CreatorOrderByWithRelationInput;
    where?: Prisma.CreatorWhereInput;
  }) {
    const { skip = 0, take = 20, orderBy = { totalTips: "desc" }, where } = params;
    const [creators, total] = await Promise.all([
      prisma.creator.findMany({
        where,
        select: creatorSelect,
        orderBy,
        skip,
        take,
      }),
      prisma.creator.count({ where }),
    ]);
    return { creators, total };
  }

  async create(data: Prisma.CreatorCreateInput) {
    return prisma.creator.create({ data, select: creatorSelect });
  }

  async update(wallet: string, data: Prisma.CreatorUpdateInput) {
    return prisma.creator.update({
      where: { walletAddress: wallet },
      data,
      select: creatorSelect,
    });
  }

  async delete(wallet: string) {
    return prisma.creator.delete({ where: { walletAddress: wallet } });
  }

  async count(where?: Prisma.CreatorWhereInput) {
    return prisma.creator.count({ where });
  }

  async incrementStat(wallet: string, field: "totalTips" | "supporterCount", amount = 1) {
    const increment = field === "totalTips" ? { increment: BigInt(amount) } : { increment: amount };
    return prisma.creator.update({
      where: { walletAddress: wallet },
      data: { [field]: increment },
    });
  }

  async search(query: string, params: {
    skip?: number;
    take?: number;
    category?: string;
    sortBy?: string;
  }) {
    const { skip = 0, take = 20 } = params;

    const where: Prisma.CreatorWhereInput = {
      OR: [
        { username: { contains: query } },
        { bio: { contains: query } },
      ],
    };

    const orderBy: any = { totalTips: "desc" };
    const sortField = params.sortBy;
    if (sortField === "supporters") orderBy.supporterCount = "desc";
    if (sortField === "newest") orderBy.createdAt = "desc";
    if (sortField === "earnings") orderBy.totalTips = "desc";

    const [creators, total] = await Promise.all([
      prisma.creator.findMany({
        where,
        select: creatorSelect,
        orderBy,
        skip,
        take,
      }),
      prisma.creator.count({ where }),
    ]);

    return { creators, total };
  }

  async getTrending(limit = 20) {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const trendingTxs = await prisma.transaction.groupBy({
      by: ["receiverWallet"],
      where: { createdAt: { gte: threeDaysAgo } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
      take: limit,
    });

    const wallets = trendingTxs.map((t: any) => t.receiverWallet);
    const creators = await prisma.creator.findMany({
      where: { walletAddress: { in: wallets } },
      select: creatorSelect,
    });

    const creatorMap = new Map(creators.map((c: any) => [c.walletAddress, c]));
    return trendingTxs
      .filter((t: any) => creatorMap.has(t.receiverWallet))
      .map((t: any) => ({
        ...creatorMap.get(t.receiverWallet)!,
        recentVolume: (t._sum.amount ?? BigInt(0)).toString(),
        recentTips: t._count,
      }));
  }

  async getMyDashboard(wallet: string) {
    const creator = await this.findByWallet(wallet);
    if (!creator) return null;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [monthlyTx, totalTx, recentTips, topSupporters] = await Promise.all([
      prisma.transaction.aggregate({
        where: { receiverWallet: wallet, createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.count({ where: { receiverWallet: wallet } }),
      prisma.transaction.findMany({
        where: { receiverWallet: wallet },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          senderWallet: true,
          amount: true,
          token: true,
          message: true,
          createdAt: true,
        },
      }),
      prisma.supporter.findMany({
        where: { creatorWallet: wallet },
        orderBy: { totalTipped: "desc" },
        take: 10,
      }),
    ]);

    return {
      creator,
      followers: 0,
      totalTransactions: totalTx,
      monthlyEarnings: (monthlyTx._sum?.amount ?? BigInt(0)).toString(),
      monthlyTransactions: monthlyTx._count,
      recentTips: recentTips.map((t: any) => ({
        ...t,
        amount: t.amount.toString(),
        timestamp: t.createdAt,
      })),
      topSupporters: topSupporters.map((s: any) => ({
        walletAddress: s.walletAddress,
        totalTipped: s.totalTipped.toString(),
        tipCount: s.tipCount,
      })),
    };
  }
}

export const creatorRepository = new CreatorRepository();
