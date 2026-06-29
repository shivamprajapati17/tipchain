import { Router } from "express";
import { membershipController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { apiLimiter } from "../middleware/rateLimiter.middleware";
import { z } from "zod";

const router = Router();

const createTierSchema = z.object({
  creatorWallet: z.string().min(32).max(44),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priceSol: z.number().positive(),
  priceUsd: z.number().positive(),
  benefits: z.array(z.string()).optional(),
  color: z.string().optional(),
  maxSubscribers: z.number().positive().int().optional(),
});

const subscribeSchema = z.object({
  tierId: z.string().min(1),
  supporterWallet: z.string().min(32).max(44),
});

// Tier Management
router.get("/memberships/:wallet", apiLimiter, membershipController.getTiers);
router.post("/memberships", apiLimiter, authenticate, validateBody(createTierSchema), membershipController.createTier);
router.put("/memberships/:id", apiLimiter, authenticate, membershipController.updateTier);
router.delete("/memberships/:id", apiLimiter, authenticate, membershipController.deleteTier);

// Subscriptions
router.post("/memberships/subscribe", apiLimiter, authenticate, validateBody(subscribeSchema), membershipController.subscribe);
router.put("/memberships/cancel/:id", apiLimiter, authenticate, membershipController.cancelSubscription);

// Query
router.get("/memberships/my/:wallet", apiLimiter, membershipController.getMySubscriptions);
router.get("/memberships/subscribers/:wallet", apiLimiter, authenticate, membershipController.getCreatorSubscribers);

export default router;
