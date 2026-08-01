import { prisma } from "../lib/prisma";

// ─── TipPoints (Hyperliquid-style points program) ────────────────────────────
// Points are earned for every tip: the supporter earns points for sending and
// the creator earns points for receiving. 1 SOL of activity = 1000 points.
// Tiers are derived from lifetime points (Hyperliquid-inspired).

const POINTS_PER_LAMPORT = 1e6; // 1 SOL => 1000 points

export function pointsFromLamports(lamports: bigint): number {
  return Math.floor(Number(lamports) / POINTS_PER_LAMPORT);
}

export const POINT_TIERS = [
  { name: "Bronze", min: 0, color: "bronze" },
  { name: "Silver", min: 5_000, color: "silver" },
  { name: "Gold", min: 25_000, color: "gold" },
  { name: "Platinum", min: 100_000, color: "platinum" },
  { name: "Hyper", min: 500_000, color: "hyper" },
] as const;

export type PointTier = (typeof POINT_TIERS)[number]["name"];

export function tierForPoints(points: number): { name: PointTier; next: string | null } {
  let current: (typeof POINT_TIERS)[number] = POINT_TIERS[0];
  for (const tier of POINT_TIERS) {
    if (points >= tier.min) current = tier;
  }
  const idx = POINT_TIERS.findIndex((t) => t.name === current.name);
  const next = POINT_TIERS[idx + 1] ?? null;
  return { name: current.name, next: next ? next.name : null };
}

function periodSince(period: string): Date | null {
  const days: Record<string, number> = { "7d": 7, "30d": 30 };
  const d = days[period];
  return d ? new Date(Date.now() - d * 24 * 60 * 60 * 1000) : null;
}

export class PointsService {
  /**
   * Top wallets by points earned within a period (or all-time).
   * Points are summed across both sent and received tips.
   */
  async getPointsLeaderboard(params: { period?: string; limit?: number; token?: string }) {
    const { period = "all", limit = 25, token } = params;
    const since = periodSince(period);
    const where: any = {};
    if (since) where.createdAt = { gte: since };
    if (token && token !== "ALL") where.token = token;

    const [sentRows, receivedRows] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["senderWallet"],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ["receiverWallet"],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const map = new Map<
      string,
      { points: number; tipCount: number; sent: number; received: number }
    >();

    for (const row of sentRows) {
      const pts = pointsFromLamports(row._sum.amount ?? BigInt(0));
      map.set(row.senderWallet, {
        points: pts,
        tipCount: row._count,
        sent: pts,
        received: 0,
      });
    }
    for (const row of receivedRows) {
      const pts = pointsFromLamports(row._sum.amount ?? BigInt(0));
      const existing =
        map.get(row.receiverWallet) ?? { points: 0, tipCount: 0, sent: 0, received: 0 };
      existing.points += pts;
      existing.received += pts;
      existing.tipCount += row._count;
      map.set(row.receiverWallet, existing);
    }

    const sorted = [...map.entries()]
      .sort((a, b) => b[1].points - a[1].points)
      .slice(0, Math.min(limit, 100));

    return sorted.map(([walletAddress, v], i) => ({
      rank: i + 1,
      walletAddress,
      points: v.points,
      tipCount: v.tipCount,
      sentPoints: v.sent,
      receivedPoints: v.received,
      tier: tierForPoints(v.points).name,
    }));
  }

  /**
   * A single wallet's points summary: total, sent/received breakdown, rank & tier.
   */
  async getWalletPoints(wallet: string, period = "all") {
    const since = periodSince(period);
    const where = (role: "sender" | "receiver") => ({
      [role === "sender" ? "senderWallet" : "receiverWallet"]: wallet,
      ...(since ? { createdAt: { gte: since } } : {}),
    });

    const [sentRows, receivedRows] = await Promise.all([
      prisma.transaction.aggregate({
        where: where("sender"),
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: where("receiver"),
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const sent = pointsFromLamports(sentRows._sum.amount ?? BigInt(0));
    const received = pointsFromLamports(receivedRows._sum.amount ?? BigInt(0));
    const total = sent + received;

    // Find rank by scanning the matching-period leaderboard
    let rank: number | null = null;
    if (total > 0) {
      const leaderboard = await this.getPointsLeaderboard({ period, limit: 100 });
      const found = leaderboard.find((e) => e.walletAddress === wallet);
      rank = found ? found.rank : null;
    }

    const tier = tierForPoints(total);

    return {
      wallet,
      points: total,
      sentPoints: sent,
      receivedPoints: received,
      tipCount: sentRows._count + receivedRows._count,
      rank,
      tier: tier.name,
      nextTier: tier.next,
    };
  }
}

export const pointsService = new PointsService();
