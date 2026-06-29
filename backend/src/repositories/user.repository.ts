import { prisma } from "../lib/prisma";

/**
 * User repository using the Creator model
 * The database has no User model, so we use Creator records as user profiles
 */
export class UserRepository {
  async findByWallet(wallet: string) {
    return prisma.creator.findUnique({
      where: { walletAddress: wallet },
    });
  }

  async findById(id: string) {
    return prisma.creator.findUnique({ where: { id } });
  }

  async upsert(wallet: string) {
    return prisma.creator.upsert({
      where: { walletAddress: wallet },
      update: {},
      create: {
        walletAddress: wallet,
        username: `user_${wallet.slice(0, 8)}`,
        bio: "",
      },
    });
  }

  async update(wallet: string, data: any) {
    return prisma.creator.update({
      where: { walletAddress: wallet },
      data,
    });
  }

  async findByWalletWithDetails(wallet: string) {
    const creator = await prisma.creator.findUnique({
      where: { walletAddress: wallet },
    });
    if (!creator) return null;
    return {
      id: creator.id,
      walletAddress: creator.walletAddress,
      displayName: creator.username,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      reputation: 0,
      totalTipped: creator.totalTips,
      tipCount: 0,
      isAdmin: false,
      createdAt: creator.createdAt,
    };
  }

  async getActivity(wallet: string, limit = 50) {
    const transactions = await prisma.transaction.findMany({
      where: { senderWallet: wallet },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return transactions.map((t: any) => ({
      id: t.id,
      type: "tip",
      amount: t.amount.toString(),
      token: t.token,
      receiverWallet: t.receiverWallet,
      message: t.message,
      timestamp: t.createdAt,
    }));
  }

  async count() {
    return prisma.creator.count();
  }
}

export const userRepository = new UserRepository();
