import { prisma } from "../lib/prisma";
import { transactionRepository } from "../repositories/transaction.repository";
import { creatorRepository } from "../repositories/creator.repository";
import { NotFoundError } from "../middleware/error.middleware";

export class AnalyticsService {
  async getOverview(wallet: string) {
    const creator = await creatorRepository.findByWallet(wallet);
    if (!creator) throw new NotFoundError("Creator");

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [monthlyTx, totalTx] = await Promise.all([
      transactionRepository.aggregateByWallet(wallet, 30),
      transactionRepository.count({ receiverWallet: wallet }),
    ]);

    return {
      totalEarnings: creator.totalTips?.toString() ?? "0",
      totalTransactions: totalTx,
      totalSupporters: creator.supporterCount ?? 0,
      totalFollowers: 0,
      monthlyEarnings: (monthlyTx._sum?.amount ?? BigInt(0)).toString(),
      monthlyTransactions: monthlyTx._count,
      monthlySupporters: 0,
      returningSupporters: 0,
      walletBalance: "0",
    };
  }

  async getRevenue(wallet: string, days = 30) {
    const revenue = await transactionRepository.getDailyRevenue(wallet, days);
    return { wallet, days: Math.min(days, 365), revenue };
  }

  async getTipAnalytics(wallet: string) {
    const [allTx, topSupporters, tokenBreakdown] = await Promise.all([
      prisma.transaction.findMany({
        where: { receiverWallet: wallet },
        orderBy: { createdAt: "desc" },
      }),
      prisma.supporter.findMany({
        where: { creatorWallet: wallet },
        orderBy: { totalTipped: "desc" },
        take: 10,
      }),
      transactionRepository.getTokenBreakdown(wallet),
    ]);

    const totalAmount = allTx.reduce((s: bigint, tx: any) => s + BigInt(tx.amount), BigInt(0));
    const largestTip = allTx.length > 0
      ? allTx.reduce((max: bigint, tx: any) => BigInt(tx.amount) > max ? BigInt(tx.amount) : max, BigInt(0))
      : BigInt(0);

    return {
      totalTips: allTx.length,
      averageTip: allTx.length > 0 ? (totalAmount / BigInt(allTx.length)).toString() : "0",
      largestTip: largestTip.toString(),
      tokenBreakdown: tokenBreakdown.map((t: any) => ({
        token: t.token,
        total: (t._sum?.amount ?? BigInt(0)).toString(),
        count: t._count,
      })),
      topSupporters: topSupporters.map((s: any) => ({
        walletAddress: s.walletAddress,
        totalTipped: s.totalTipped.toString(),
        tipCount: s.tipCount,
      })),
    };
  }

  async getGrowth(wallet: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [currentMonth, previousMonth] = await Promise.all([
      transactionRepository.aggregateByWallet(wallet, 30),
      prisma.transaction.aggregate({
        where: { receiverWallet: wallet, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const currentRevenue = Number(currentMonth._sum?.amount ?? BigInt(0));
    const previousRevenue = Number(previousMonth._sum?.amount ?? BigInt(0));
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return {
      wallet,
      currentMonthRevenue: currentRevenue.toString(),
      previousMonthRevenue: previousRevenue.toString(),
      revenueGrowthPercent: Math.round(revenueGrowth * 100) / 100,
      currentMonthTransactions: currentMonth._count,
      previousMonthTransactions: previousMonth._count,
      totalSupporters: 0,
      totalFollowers: 0,
    };
  }

  async getPlatform() {
    const [totalCreators, totalTransactions, totalSupporters] = await Promise.all([
      prisma.creator.count(),
      prisma.transaction.count(),
      prisma.supporter.count(),
    ]);

    const [revenueAgg, todayTx] = await Promise.all([
      prisma.transaction.aggregate({ _sum: { amount: true } }),
      prisma.transaction.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    return {
      totalCreators,
      totalUsers: totalCreators,
      totalTransactions,
      totalSupporters,
      totalVolume: (revenueAgg._sum?.amount ?? BigInt(0)).toString(),
      todayTransactions: todayTx,
      activeWallets24h: 0,
    };
  }

  async exportCsv(wallet: string, days = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.min(days, 365));

    const transactions = await prisma.transaction.findMany({
      where: { receiverWallet: wallet, createdAt: { gte: startDate } },
      orderBy: { createdAt: "desc" },
    });

    const headers = "Date,Sender,Amount,Token,Message,TxHash";
    const rows = transactions.map((tx: any) =>
      [
        tx.createdAt.toISOString(),
        tx.senderWallet,
        (Number(tx.amount) / 1e9).toFixed(9),
        tx.token,
        `"${(tx.message ?? "").replace(/"/g, '""')}"`,
        tx.txHash ?? "",
      ].join(",")
    );

    return `${headers}\n${rows.join("\n")}`;
  }
}

export const analyticsService = new AnalyticsService();
