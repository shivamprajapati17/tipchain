import { Router } from "express";
import { socialController, badgeController, referralController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";
import { optionalAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { apiLimiter } from "../middleware/rateLimiter.middleware";
import { z } from "zod";

const router = Router();

// ─── Social — Follow ──────────────────────────────────────────────────

const followSchema = z.object({
  followerWallet: z.string().min(32).max(44),
  creatorWallet: z.string().min(32).max(44),
});

router.post("/follow", apiLimiter, authenticate, validateBody(followSchema), socialController.follow);
router.delete("/follow/:follower/:creator", apiLimiter, authenticate, socialController.unfollow);
router.get("/follow/:wallet/followers", apiLimiter, socialController.getFollowers);
router.get("/follow/:wallet/following", apiLimiter, socialController.getFollowing);

// ─── Social — Comments ────────────────────────────────────────────────

const commentSchema = z.object({
  authorWallet: z.string().min(32).max(44),
  creatorWallet: z.string().min(32).max(44),
  content: z.string().min(1).max(1000),
});

router.post("/comments", apiLimiter, authenticate, validateBody(commentSchema), socialController.addComment);
router.get("/comments/:creatorWallet", apiLimiter, socialController.getComments);

// ─── Social — Updates ─────────────────────────────────────────────────

const updateSchema = z.object({
  creatorWallet: z.string().min(32).max(44),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  imageUrl: z.string().url().optional(),
});

router.post("/updates", apiLimiter, authenticate, validateBody(updateSchema), socialController.createUpdate);
router.get("/updates/:creatorWallet", apiLimiter, socialController.getUpdates);
router.get("/feed/:wallet", apiLimiter, socialController.getFeed);

// ─── Badges ───────────────────────────────────────────────────────────

const awardBadgeSchema = z.object({
  badgeSlug: z.string().min(1),
  walletAddress: z.string().min(32).max(44),
  creatorWallet: z.string().optional(),
  mintAddress: z.string().optional(),
  metadataUri: z.string().optional(),
});

router.get("/badges", apiLimiter, badgeController.getAllBadges);
router.get("/badges/supporter/:wallet", apiLimiter, badgeController.getSupporterBadges);
router.post("/badges/award", apiLimiter, authenticate, validateBody(awardBadgeSchema), badgeController.awardBadge);

// ─── Referrals ────────────────────────────────────────────────────────

router.get("/referrals/:wallet", apiLimiter, referralController.getReferralStats);
router.post("/referrals", apiLimiter, referralController.createReferralCode);
router.get("/referrals/code/:code", apiLimiter, referralController.trackReferralCode);

export default router;
