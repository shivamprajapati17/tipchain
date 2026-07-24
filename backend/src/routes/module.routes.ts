import { Router } from "express";
import {
  // GameFi
  getQuests, getXP, getAchievements, getLeaderboard, getSeasons, getMissions, getPvP, getGuilds,
  // DeFi
  getStaking, getLending, getLiquidityPools, getYieldFarming, getTreasury, getTokenSwaps, getCrossChainBridge,
  // Creator Economy
  getTokenGatedCommunities, getMemberships, getCollectibles, getNFTDrops, getPayments, getRevenueAnalytics,
} from "../controllers/module.controller";
import { apiLimiter } from "../middleware/rateLimiter.middleware";
import { simpleApiKeyAuth } from "../middleware/simpleApiKey.middleware";

const router = Router();

// ─── GameFi Routes ────────────────────────────────────────────────────────────
router.get("/api/gamefi/quests", apiLimiter, simpleApiKeyAuth, getQuests);
router.get("/api/gamefi/xp", apiLimiter, simpleApiKeyAuth, getXP);
router.get("/api/gamefi/achievements", apiLimiter, simpleApiKeyAuth, getAchievements);
router.get("/api/gamefi/leaderboard", apiLimiter, simpleApiKeyAuth, getLeaderboard);
router.get("/api/gamefi/seasons", apiLimiter, simpleApiKeyAuth, getSeasons);
router.get("/api/gamefi/missions", apiLimiter, simpleApiKeyAuth, getMissions);
router.get("/api/gamefi/pvp", apiLimiter, simpleApiKeyAuth, getPvP);
router.get("/api/gamefi/guilds", apiLimiter, simpleApiKeyAuth, getGuilds);

// ─── DeFi Routes ──────────────────────────────────────────────────────────────
router.get("/api/defi/staking", apiLimiter, simpleApiKeyAuth, getStaking);
router.get("/api/defi/lending", apiLimiter, simpleApiKeyAuth, getLending);
router.get("/api/defi/liquidity-pools", apiLimiter, simpleApiKeyAuth, getLiquidityPools);
router.get("/api/defi/yield-farming", apiLimiter, simpleApiKeyAuth, getYieldFarming);
router.get("/api/defi/treasury", apiLimiter, simpleApiKeyAuth, getTreasury);
router.get("/api/defi/token-swaps", apiLimiter, simpleApiKeyAuth, getTokenSwaps);
router.get("/api/defi/cross-chain-bridge", apiLimiter, simpleApiKeyAuth, getCrossChainBridge);

// ─── Creator Economy Routes ───────────────────────────────────────────────────
router.get("/api/creator/token-gated-communities", apiLimiter, simpleApiKeyAuth, getTokenGatedCommunities);
router.get("/api/creator/memberships", apiLimiter, simpleApiKeyAuth, getMemberships);
router.get("/api/creator/collectibles", apiLimiter, simpleApiKeyAuth, getCollectibles);
router.get("/api/creator/nft-drops", apiLimiter, simpleApiKeyAuth, getNFTDrops);
router.get("/api/creator/payments", apiLimiter, simpleApiKeyAuth, getPayments);
router.get("/api/creator/revenue-analytics", apiLimiter, simpleApiKeyAuth, getRevenueAnalytics);

export default router;
