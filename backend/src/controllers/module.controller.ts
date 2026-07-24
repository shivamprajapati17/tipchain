import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

// ─── GameFi ───────────────────────────────────────────────────────────────────

export const getQuests = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    quests: [
      { id: "q1", title: "First Tip", description: "Send your first tip to a creator", reward: "50 XP", difficulty: "easy" },
      { id: "q2", title: "Collector", description: "Collect 5 different badges", reward: "100 XP", difficulty: "medium" },
      { id: "q3", title: "Community Builder", description: "Refer 3 friends to TipChain", reward: "200 XP", difficulty: "hard" },
    ],
    total: 3,
  });
});

export const getXP = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    totalXP: 1250,
    level: 5,
    nextLevelAt: 2000,
    breakdown: { tips: 500, referrals: 300, quests: 350, badges: 100 },
  });
});

export const getAchievements = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    achievements: [
      { id: "a1", name: "First Tip", description: "Sent your first tip", unlocked: true, unlockedAt: "2026-07-01T00:00:00Z" },
      { id: "a2", name: "Early Adopter", description: "Joined in the first month", unlocked: true },
      { id: "a3", name: "Whale", description: "Sent over 100 SOL in tips", unlocked: false, progress: "45/100 SOL" },
    ],
  });
});

export const getLeaderboard = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    leaderboard: [
      { rank: 1, wallet: "8xJ...Abc1", tips: 542, xp: 12500 },
      { rank: 2, wallet: "3yK...Xz9", tips: 389, xp: 9800 },
      { rank: 3, wallet: "7mP...Qw5", tips: 276, xp: 7200 },
    ],
    totalParticipants: 1284,
  });
});

export const getSeasons = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    currentSeason: { id: "s3", name: "Summer 2026", startDate: "2026-06-01", endDate: "2026-08-31", active: true },
    seasons: [
      { id: "s1", name: "Spring 2026", startDate: "2026-03-01", endDate: "2026-05-31" },
      { id: "s2", name: "Summer 2026", startDate: "2026-06-01", endDate: "2026-08-31" },
    ],
  });
});

export const getMissions = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    missions: [
      { id: "m1", title: "Daily Check-in", xp: 10, type: "daily", completed: false },
      { id: "m2", title: "Tip 3 Creators", xp: 50, type: "daily", completed: true },
      { id: "m3", title: "Complete Profile", xp: 100, type: "weekly", completed: false },
      { id: "m4", title: "Refer 10 Users", xp: 500, type: "seasonal", completed: false },
    ],
  });
});

export const getPvP = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    matchmaking: true,
    rank: "Gold III",
    rating: 1842,
    wins: 47,
    losses: 23,
    winRate: "67.1%",
  });
});

export const getGuilds = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    guilds: [
      { id: "g1", name: "Solana Sharks", members: 342, rank: 1, xp: 45200 },
      { id: "g2", name: "Tip Titans", members: 281, rank: 2, xp: 38900 },
      { id: "g3", name: "Crypto Phoenix", members: 156, rank: 3, xp: 21500 },
    ],
  });
});

// ─── DeFi ─────────────────────────────────────────────────────────────────────

export const getStaking = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    totalStaked: "125.5 SOL",
    apy: "8.4%",
    rewards: "2.3 SOL",
    protocols: [
      { name: "Marinade", apy: "7.8%", tvl: "$450M", staked: "75 SOL" },
      { name: "Jito", apy: "8.2%", tvl: "$380M", staked: "50.5 SOL" },
    ],
  });
});

export const getLending = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    totalSupplied: "2500 USDC",
    totalBorrowed: "1000 USDC",
    netApy: "5.2%",
    positions: [
      { protocol: "Marginfi", supplied: "1500 USDC", apy: "6.1%", health: "85%" },
      { protocol: "Solend", supplied: "1000 USDC", apy: "4.8%", health: "92%" },
    ],
  });
});

export const getLiquidityPools = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    pools: [
      { name: "SOL-USDC", dex: "Orca", tvl: "$12.5M", apy: "14.2%", yourLiquidity: "0 SOL" },
      { name: "SOL-mSOL", dex: "Raydium", tvl: "$8.3M", apy: "6.8%", yourLiquidity: "0 SOL" },
      { name: "JitoSOL-SOL", dex: "Meteora", tvl: "$5.1M", apy: "9.5%", yourLiquidity: "0 SOL" },
    ],
  });
});

export const getYieldFarming = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    farms: [
      { name: "SOL-USDC LP", protocol: "Orca", apy: "18.5%", rewards: "ORCA", locked: false },
      { name: "RAY Staking", protocol: "Raydium", apy: "22.3%", rewards: "RAY", locked: true },
      { name: "JitoSOL Vault", protocol: "Jito", apy: "9.8%", rewards: "JitoSOL", locked: false },
    ],
  });
});

export const getTreasury = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    balance: "45,000 USDC",
    assets: [
      { token: "SOL", amount: "250", value: "$12,500" },
      { token: "USDC", amount: "45,000", value: "$45,000" },
      { token: "mSOL", amount: "100", value: "$18,000" },
    ],
    totalValue: "$75,500",
  });
});

export const getTokenSwaps = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    recentSwaps: [
      { from: "USDC", to: "SOL", amount: "500", timestamp: "2 min ago" },
      { from: "SOL", to: "mSOL", amount: "25", timestamp: "15 min ago" },
    ],
    stats: { totalSwaps: 142, volume24h: "12,500 USDC" },
  });
});

export const getCrossChainBridge = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    bridges: [
      { from: "Solana", to: "Ethereum", fee: "0.1%", time: "~3 min", supported: true },
      { from: "Solana", to: "Polygon", fee: "0.05%", time: "~1 min", supported: true },
    ],
    recentTransfers: [
      { from: "Solana", to: "Ethereum", amount: "1000 USDC", status: "completed", timestamp: "1 hour ago" },
    ],
  });
});

// ─── Creator Economy ──────────────────────────────────────────────────────────

export const getTokenGatedCommunities = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    communities: [
      { id: "c1", name: "Premium Club", tokenRequired: "100 $TC", members: 234, yourStatus: "not joined" },
      { id: "c2", name: "Whale Lounge", tokenRequired: "1000 $TC", members: 56, yourStatus: "not joined" },
    ],
  });
});

export const getMemberships = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    tiers: [
      { name: "Bronze", price: "5 $TC/mo", benefits: ["Exclusive content", "Badge"], active: false },
      { name: "Silver", price: "15 $TC/mo", benefits: ["All Bronze", "Direct messages", "Early access"], active: false },
      { name: "Gold", price: "50 $TC/mo", benefits: ["All Silver", "1-on-1 calls", "Custom NFT"], active: false },
    ],
  });
});

export const getCollectibles = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    collectibles: [
      { id: "col1", name: "Genesis Tipper", type: "badge", rarity: "rare", floor: "5 SOL" },
      { id: "col2", name: "Gold Supporter", type: "nft", rarity: "epic", floor: "25 SOL" },
    ],
    owned: [
      { id: "col3", name: "Early Adopter", type: "badge", rarity: "common" },
    ],
  });
});

export const getNFTDrops = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    upcomingDrops: [
      { name: "Summer Collection 2026", date: "2026-08-01", supply: 1000, price: "2 SOL" },
      { name: "Creator Pass S2", date: "2026-09-15", supply: 500, price: "5 SOL" },
    ],
    activeDrops: [
      { name: "TipChain Genesis", remaining: 234, total: 1000, price: "1 SOL" },
    ],
  });
});

export const getPayments = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    balance: "45.5 SOL",
    pendingPayouts: "12.3 SOL",
    transactions: [
      { id: "tx1", from: "8xJ...Abc1", amount: "5 SOL", timestamp: "1 hour ago", status: "completed" },
      { id: "tx2", from: "3yK...Xz9", amount: "2 SOL", timestamp: "3 hours ago", status: "pending" },
    ],
    totalEarned: "1,250 SOL",
  });
});

export const getRevenueAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    revenue24h: "12.5 SOL",
    revenue7d: "85.2 SOL",
    revenue30d: "342.1 SOL",
    topEarning: [
      { source: "Tips", amount: "215 SOL", percentage: "62.8%" },
      { source: "Memberships", amount: "85 SOL", percentage: "24.9%" },
      { source: "NFT Sales", amount: "42 SOL", percentage: "12.3%" },
    ],
    activeSupporters: 128,
    newSupporters7d: 23,
  });
});
