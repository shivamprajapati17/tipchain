import { prisma } from "../lib/prisma";
import { transactionRepository } from "../repositories/transaction.repository";
import { creatorRepository } from "../repositories/creator.repository";
import { NotFoundError } from "../middleware/error.middleware";
import { eventBus } from "./eventBus.service";

export class TipService {
  async send(data: {
    senderWallet: string;
    receiverWallet: string;
    amount: number;
    token?: string;
    txHash?: string;
    message?: string;
  }) {
    const amountLamports = BigInt(Math.floor(data.amount * 1e9));

    const transaction = await transactionRepository.createWithStats({
      senderWallet: data.senderWallet,
      receiverWallet: data.receiverWallet,
      amount: amountLamports,
      token: data.token ?? "SOL",
      txHash: data.txHash ?? null,
      message: data.message ?? null,
    });

    // Notify the n8n automation workflow (fire-and-forget)
    void eventBus.emit("tip.received", {
      amount: data.amount,
      currency: data.token ?? "SOL",
      from: data.senderWallet,
      to: data.receiverWallet,
      txHash: data.txHash ?? null,
      message: data.message ?? null,
    });

    return this.formatTransaction(transaction);
  }

  async sendSpl(data: {
    senderWallet: string;
    receiverWallet: string;
    amount: number;
    tokenMint: string;
    tokenSymbol?: string;
    txHash?: string;
    message?: string;
  }) {
    const amountRaw = BigInt(Math.floor(data.amount * 1e6)); // USDC has 6 decimals

    const transaction = await transactionRepository.createWithStats({
      senderWallet: data.senderWallet,
      receiverWallet: data.receiverWallet,
      amount: amountRaw,
      token: data.tokenSymbol ?? "SPL",
      txHash: data.txHash ?? null,
      message: data.message ?? null,
    });

    // Notify the n8n automation workflow (fire-and-forget)
    void eventBus.emit("tip.received", {
      amount: data.amount,
      currency: data.tokenSymbol ?? "SPL",
      from: data.senderWallet,
      to: data.receiverWallet,
      txHash: data.txHash ?? null,
      message: data.message ?? null,
    });

    return this.formatTransaction(transaction);
  }

  async getHistory(params: {
    page?: number;
    limit?: number;
    wallet?: string;
    token?: string;
    direction?: "sent" | "received";
    days?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, wallet, token, direction, days, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (wallet) {
      if (direction === "sent") {
        where.senderWallet = wallet;
      } else if (direction === "received") {
        where.receiverWallet = wallet;
      } else {
        where.OR = [{ senderWallet: wallet }, { receiverWallet: wallet }];
      }
    }
    if (token && token !== "ALL") where.token = token;
    if (days && !startDate) {
      where.createdAt = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }
    if (startDate || endDate) {
      where.createdAt = where.createdAt ?? {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const { transactions, total } = await transactionRepository.findMany({
      where,
      skip,
      take: limit,
    });

    return {
      transactions: transactions.map((t: any) => this.formatTransaction(t, params.wallet)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCreatorTips(creatorWallet: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const { transactions, total } = await transactionRepository.findByCreator(creatorWallet, { skip, take: limit });

    return {
      transactions: transactions.map((t: any) => this.formatTransaction(t)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSupporterTips(supporterWallet: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const { transactions, total } = await transactionRepository.findBySupporter(supporterWallet, { skip, take: limit });

    return {
      transactions: transactions.map((t: any) => this.formatTransaction(t)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getLeaderboard(params: { limit?: number; period?: string; token?: string } = {}) {
    const { limit = 25, period = "all", token } = params;

    // Period-filtered leaderboard aggregates transactions within the window
    const days: Record<string, number> = { "7d": 7, "30d": 30 };
    const since = days[period] ? new Date(Date.now() - days[period] * 24 * 60 * 60 * 1000) : null;
    const where: any = {};
    if (since) where.createdAt = { gte: since };
    if (token && token !== "ALL") where.token = token;

    const supporters = await prisma.transaction.groupBy({
      by: ["senderWallet"],
      where,
      _sum: { amount: true },
      _count: { senderWallet: true },
      orderBy: { _sum: { amount: "desc" } },
      take: limit,
    });

    return supporters.map((s: any, index: number) => ({
      rank: index + 1,
      walletAddress: s.senderWallet,
      totalTipped: (s._sum.amount ?? BigInt(0)).toString(),
      tipCount: s._count.senderWallet,
    }));
  }

  private formatTransaction(tx: any, wallet?: string) {
    return {
      id: tx.id,
      senderWallet: tx.senderWallet,
      receiverWallet: tx.receiverWallet,
      amount: tx.amount?.toString() ?? "0",
      token: tx.token,
      txHash: tx.txHash,
      message: tx.message,
      timestamp: tx.createdAt,
      ...(wallet ? { direction: tx.senderWallet === wallet ? "sent" : "received" } : {}),
    };
  }
}

export const tipService = new TipService();
